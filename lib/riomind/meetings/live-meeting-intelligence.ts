import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";
import { recordRioMindVoiceEvent } from "../voice/voice-event-bus";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function extractTopics(text: string) {
  const candidates = [
    "scheduler", "invite", "lobby", "voice", "translation", "AI", "meeting",
    "Nexus Teams", "realtime", "transcript", "action item", "summary",
    "provider", "Deepgram", "OpenAI", "ElevenLabs", "workflow", "agent",
  ];

  return candidates.filter((topic) => text.toLowerCase().includes(topic.toLowerCase()));
}

function extractActionItems(text: string) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines
    .filter((line) => /\b(todo|action|next|must|should|need to|follow up|assign|build|connect|integrate)\b/i.test(line))
    .slice(0, 12);
}


function extractDecisions(text: string) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines
    .filter((line) => /\b(decided|decision|approved|agreed|confirmed|we will|we should proceed|finalized|accepted)\b/i.test(line))
    .slice(0, 12);
}

function extractQuestions(text: string) {
  return text
    .split(/(?<=[?.!])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.endsWith("?"))
    .slice(0, 12);
}

function extractRisks(text: string) {
  const risks = [];
  if (/not_configured|missing|unavailable|failed|error/i.test(text)) risks.push("Provider/configuration issue detected.");
  if (/mock/i.test(text)) risks.push("Mock runtime is still being used for at least one voice capability.");
  if (/pending/i.test(text)) risks.push("Some realtime client/provider wiring is still pending.");
  return risks;
}


function slugifyGraphKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "unknown";
}

async function linkMeetingIntelEntity(input: {
  meetingCode: string;
  nodeType: string;
  nodeKey: string;
  title: string;
  description?: string;
  relation: string;
  metadata?: Record<string, unknown>;
}) {
  const meetingNode = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: "meeting",
    nodeKey: input.meetingCode,
    title: `Meeting ${input.meetingCode}`,
    description: "Nexus Teams meeting.",
  });

  const entityNode = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: input.nodeType,
    nodeKey: input.nodeKey,
    title: input.title,
    description: input.description || "",
    metadata: input.metadata || {},
  });

  await upsertRioMindKgEdge({
    aiLayer: "nexus_ai",
    fromNodeId: meetingNode.id,
    toNodeId: entityNode.id,
    relation: input.relation,
    confidence: 1,
  });

  return entityNode;
}

async function expandLiveIntelligenceIntoGraph(intelligence: any) {
  const meetingCode = intelligence.meetingCode;

  await linkMeetingIntelEntity({
    meetingCode,
    nodeType: "meeting_summary",
    nodeKey: `${meetingCode}:summary:live`,
    title: `Live Summary: ${meetingCode}`,
    description: intelligence.liveSummary || "",
    relation: "has_summary",
    metadata: intelligence.counts || {},
  });

  for (const speaker of intelligence.speakers || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_speaker",
      nodeKey: `${meetingCode}:speaker:${slugifyGraphKey(speaker)}`,
      title: `Speaker: ${speaker}`,
      description: `Speaker label detected in meeting ${meetingCode}.`,
      relation: "has_speaker",
      metadata: { speaker },
    });
  }

  for (const topic of intelligence.topics || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_topic",
      nodeKey: `${meetingCode}:topic:${slugifyGraphKey(topic)}`,
      title: `Topic: ${topic}`,
      description: `Topic detected in meeting ${meetingCode}.`,
      relation: "has_topic",
      metadata: { topic },
    });
  }

  for (const risk of intelligence.risks || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_risk",
      nodeKey: `${meetingCode}:risk:${slugifyGraphKey(risk)}`,
      title: `Risk: ${risk.slice(0, 80)}`,
      description: risk,
      relation: "has_risk",
      metadata: { risk },
    });
  }

  for (const language of intelligence.languageCoverage?.sourceLanguages || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_language",
      nodeKey: `${meetingCode}:source_language:${slugifyGraphKey(language)}`,
      title: `Source Language: ${language}`,
      description: `Source language detected in meeting ${meetingCode}.`,
      relation: "has_source_language",
      metadata: { language, direction: "source" },
    });
  }

  for (const language of intelligence.languageCoverage?.targetLanguages || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_language",
      nodeKey: `${meetingCode}:target_language:${slugifyGraphKey(language)}`,
      title: `Target Language: ${language}`,
      description: `Target translation language used in meeting ${meetingCode}.`,
      relation: "has_target_language",
      metadata: { language, direction: "target" },
    });
  }

  for (const language of intelligence.languageCoverage?.configuredTargets || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_language",
      nodeKey: `${meetingCode}:configured_language:${slugifyGraphKey(language)}`,
      title: `Configured Language: ${language}`,
      description: `Configured translation target for meeting ${meetingCode}.`,
      relation: "supports_language",
      metadata: { language, direction: "configured_target" },
    });
  }

  for (const item of intelligence.actionItems || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_action_item",
      nodeKey: `${meetingCode}:action:${slugifyGraphKey(item)}`,
      title: `Action Item: ${item.slice(0, 80)}`,
      description: item,
      relation: "has_action_item",
      metadata: { item },
    });
  }


  for (const decision of intelligence.decisions || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_decision",
      nodeKey: `${meetingCode}:decision:${slugifyGraphKey(decision)}`,
      title: `Decision: ${decision.slice(0, 80)}`,
      description: decision,
      relation: "has_decision",
      metadata: { decision },
    });
  }

  for (const question of intelligence.unansweredQuestions || []) {
    await linkMeetingIntelEntity({
      meetingCode,
      nodeType: "meeting_question",
      nodeKey: `${meetingCode}:question:${slugifyGraphKey(question)}`,
      title: `Question: ${question.slice(0, 80)}`,
      description: question,
      relation: "has_question",
      metadata: { question },
    });
  }
}

export async function buildLiveMeetingIntelligence(input: {
  meetingCode: string;
  targetLanguages?: string[];
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();

  const transcripts = await db.query(
    `SELECT * FROM riomind_voice_transcripts
     WHERE meeting_code = $1
     ORDER BY created_at ASC
     LIMIT 500`,
    [input.meetingCode]
  );

  const sessions = await db.query(
    `SELECT * FROM riomind_voice_sessions
     WHERE meeting_code = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [input.meetingCode]
  );

  const transcriptText = transcripts.rows
    .map((row: any) => row.translation || row.transcript)
    .filter(Boolean)
    .join("\n");

  const speakers = unique(transcripts.rows.map((row: any) => row.speaker_label).filter(Boolean));
  const sourceLanguages = unique(transcripts.rows.map((row: any) => row.source_language).filter(Boolean));
  const targetLanguages = unique(transcripts.rows.map((row: any) => row.target_language).filter(Boolean));

  const topics = extractTopics(transcriptText);
  const actionItems = extractActionItems(transcriptText);
  const decisions = extractDecisions(transcriptText);
  const questions = extractQuestions(transcriptText);
  const risks = extractRisks(JSON.stringify({ transcriptText, sessions: sessions.rows }));

  const intelligence = {
    meetingCode: input.meetingCode,
    mode: "live_meeting_intelligence",
    counts: {
      sessions: sessions.rows.length,
      transcriptEntries: transcripts.rows.length,
      speakers: speakers.length,
      sourceLanguages: sourceLanguages.length,
      targetLanguages: targetLanguages.length,
    },
    speakers,
    languageCoverage: {
      sourceLanguages,
      targetLanguages,
      configuredTargets: input.targetLanguages || [],
    },
    topics,
    actionItems,
    decisions,
    unansweredQuestions: questions,
    risks,
    liveSummary: transcriptText
      ? `This meeting currently has ${transcripts.rows.length} transcript/translation entries across ${speakers.length || 1} speaker label(s). Key topics: ${topics.length ? topics.join(", ") : "not enough topic signal yet"}.`
      : "No live transcript content has been captured yet.",
    transcriptPreview: transcriptText.slice(0, 1800),
  };

  await recordRioMindVoiceEvent({
    sessionId: sessions.rows[0]?.id || null,
    eventType: "live_meeting_intelligence_updated",
    direction: "internal",
    payload: intelligence,
  });

  await expandLiveIntelligenceIntoGraph(intelligence).catch(() => null);

  const meetingNode = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: "meeting",
    nodeKey: input.meetingCode,
    title: `Meeting ${input.meetingCode}`,
    description: intelligence.liveSummary,
    metadata: intelligence,
  }).catch(() => null);

  if (meetingNode) {
    const intelligenceNode = await upsertRioMindKgNode({
      aiLayer: "nexus_ai",
      nodeType: "meeting_intelligence",
      nodeKey: `${input.meetingCode}:live`,
      title: `Live Intelligence: ${input.meetingCode}`,
      description: intelligence.liveSummary,
      metadata: intelligence,
    }).catch(() => null);

    if (intelligenceNode) {
      await upsertRioMindKgEdge({
        aiLayer: "nexus_ai",
        fromNodeId: meetingNode.id,
        toNodeId: intelligenceNode.id,
        relation: "has_live_intelligence",
        confidence: 1,
      }).catch(() => null);
    }
  }

  return intelligence;
}
