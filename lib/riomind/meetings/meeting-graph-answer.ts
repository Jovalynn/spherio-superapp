import { queryRioMindKg } from "../knowledge-graph/kg-engine";


function cleanGraphTitle(value: string) {
  return String(value || "")
    .replace(/^(Topic|Risk|Speaker|Decision|Action Item|Question|Source Language|Target Language|Configured Language|Live Summary):\s*/i, "")
    .trim();
}

function cleanGraphTitles(values: string[]) {
  return values.map(cleanGraphTitle).filter(Boolean);
}

function pickQuestionMode(question: string) {
  const q = question.toLowerCase();
  if (q.includes("decision") || q.includes("decided")) return "decisions";
  if (q.includes("action item") || q.includes("next") || q.includes("do next") || q.includes("should we do") || q.includes("task")) return "actions";
  if (q.includes("topic") || q.includes("discuss")) return "topics";
  if (q.includes("risk")) return "risks";
  if (q.includes("language") || q.includes("translate")) return "languages";
  if (q.includes("speaker") || q.includes("who spoke")) return "speakers";
  if (q.includes("summary") || q.includes("summarize")) return "summary";
  if (q.includes("transcript")) return "transcripts";
  return "overview";
}

export async function answerMeetingFromKnowledgeGraph(input: {
  meetingCode: string;
  question?: string;
}) {
  const question = input.question || `Summarize meeting ${input.meetingCode} from the Knowledge Graph.`;
  const mode = pickQuestionMode(question);

  const graph = await queryRioMindKg({
    aiLayer: "nexus_ai",
    nodeKey: input.meetingCode,
    limit: 100,
  });

  const edges = graph.edges || [];
  const nodes = graph.nodes || [];

  const byRelation = (relation: string) =>
    edges.filter((edge: any) => edge.relation === relation).map((edge: any) => edge.to_title);

  const topics = cleanGraphTitles(byRelation("has_topic"));
  const risks = cleanGraphTitles(byRelation("has_risk"));
  const speakers = cleanGraphTitles(byRelation("has_speaker"));
  const sourceLanguages = cleanGraphTitles(byRelation("has_source_language"));
  const targetLanguages = cleanGraphTitles(byRelation("has_target_language"));
  const supportedLanguages = cleanGraphTitles(byRelation("supports_language"));
  const summaries = cleanGraphTitles(byRelation("has_summary"));
  const decisions = cleanGraphTitles(byRelation("has_decision"));
  const actionItems = cleanGraphTitles(byRelation("has_action_item"));
  const questions = cleanGraphTitles(byRelation("has_question"));
  const transcripts = byRelation("has_transcript");
  const translations = byRelation("has_translation");
  const realtimeSessions = byRelation("has_realtime_ai_session");
  const voiceSessions = byRelation("has_voice_session");
  const liveIntel = byRelation("has_live_intelligence");

  let answer = "";

  if (mode === "decisions") {
    answer = decisions.length
      ? `Decisions made: ${decisions.join("; ")}.`
      : "No decisions were found in the Knowledge Graph for this meeting.";
  } else if (mode === "actions") {
    answer = actionItems.length
      ? `Action items / next steps: ${actionItems.join("; ")}.`
      : "No action items were found in the Knowledge Graph for this meeting.";
  } else if (mode === "topics") {
    answer = topics.length
      ? `The meeting discussed: ${topics.join(", ")}.`
      : "No meeting topics were found in the Knowledge Graph yet.";
  } else if (mode === "risks") {
    answer = risks.length
      ? `The detected risks are: ${risks.join("; ")}.`
      : "No risks were found in the Knowledge Graph for this meeting.";
  } else if (mode === "languages") {
    answer = [
      sourceLanguages.length ? `Source languages: ${sourceLanguages.join(", ")}.` : "",
      targetLanguages.length ? `Used target languages: ${targetLanguages.join(", ")}.` : "",
      supportedLanguages.length ? `Configured supported languages: ${supportedLanguages.join(", ")}.` : "",
    ].filter(Boolean).join(" ");
    if (!answer) answer = "No language information was found in the Knowledge Graph for this meeting.";
  } else if (mode === "speakers") {
    answer = speakers.length
      ? `Speaker labels found: ${speakers.join(", ")}.`
      : "No speaker labels were found in the Knowledge Graph for this meeting.";
  } else if (mode === "summary") {
    answer = summaries.length
      ? `Meeting summary: ${summaries.join(" ")}`
      : liveIntel.length
        ? `Live intelligence available: ${liveIntel.join(", ")}.`
        : "No summary node was found in the Knowledge Graph yet.";
  } else if (mode === "transcripts") {
    answer = transcripts.length || translations.length
      ? `The meeting has ${transcripts.length} transcript node(s) and ${translations.length} translation node(s) in the graph.`
      : "No transcript or translation nodes were found for this meeting.";
  } else {
    answer = [
      `Knowledge Graph overview for ${input.meetingCode}:`,
      `${topics.length} topic(s), ${speakers.length} speaker label(s), ${risks.length} risk(s), ${decisions.length} decision(s), ${actionItems.length} action item(s), ${transcripts.length} transcript node(s), ${translations.length} translation node(s), ${realtimeSessions.length} realtime AI session(s), ${voiceSessions.length} voice session(s).`,
    ].join(" ");
  }

  return {
    ok: true,
    meetingCode: input.meetingCode,
    question,
    mode,
    answer,
    graphSummary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      topics,
      risks,
      speakers,
      decisions,
      actionItems,
      questions,
      sourceLanguages,
      targetLanguages,
      supportedLanguages,
      summaries,
      transcriptCount: transcripts.length,
      translationCount: translations.length,
      realtimeSessionCount: realtimeSessions.length,
      voiceSessionCount: voiceSessions.length,
    },
  };
}
