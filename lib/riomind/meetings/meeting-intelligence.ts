import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

async function safeQuery(sql: string, params: unknown[] = []) {
  try {
    return await getRioMindAiFoundationPool().query(sql, params);
  } catch {
    return { rows: [], rowCount: 0 } as any;
  }
}

function summarizeText(items: string[], max = 1200) {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean).join("\n");
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max)}...[truncated]` : clean;
}

export async function buildMeetingIntelligence(meetingCode: string) {
  await ensureRioMindAiFoundationSchema();

  const meeting = await safeQuery(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 OR id::text = $1 LIMIT 1`,
    [meetingCode]
  );

  const meetingRow = meeting.rows[0] || {
    id: meetingCode,
    meeting_code: meetingCode,
    title: `Meeting ${meetingCode}`,
  };

  const messages = await safeQuery(
    `SELECT * FROM riomind_team_meeting_messages
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 200`,
    [meetingCode]
  );

  const participants = await safeQuery(
    `SELECT * FROM riomind_team_meeting_participants
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 100`,
    [meetingCode]
  );

  const teamVoiceTranscripts = await safeQuery(
    `SELECT * FROM riomind_team_meeting_voice_transcripts
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 200`,
    [meetingCode]
  );

  const riomindVoiceTranscripts = await safeQuery(
    `SELECT * FROM riomind_voice_transcripts
     WHERE meeting_code = $1
     ORDER BY created_at ASC LIMIT 200`,
    [meetingCode]
  );

  const voiceTranscripts = {
    rows: [...teamVoiceTranscripts.rows, ...riomindVoiceTranscripts.rows],
    rowCount: teamVoiceTranscripts.rows.length + riomindVoiceTranscripts.rows.length,
  };

  const decisions = await safeQuery(
    `SELECT * FROM riomind_team_room_decisions
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 100`,
    [meetingCode]
  );

  const actionItems = await safeQuery(
    `SELECT * FROM riomind_team_room_action_items
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 100`,
    [meetingCode]
  );

  const notes = await safeQuery(
    `SELECT * FROM riomind_team_room_notes
     WHERE meeting_code = $1 OR meeting_id::text = $1
     ORDER BY created_at ASC LIMIT 100`,
    [meetingCode]
  );

  const messageText = summarizeText(messages.rows.map((row: any) => row.content || row.message || row.text));
  const transcriptText = summarizeText(voiceTranscripts.rows.map((row: any) => row.transcript || row.text || row.content));

  const summary = [
    "## Meeting Intelligence Summary",
    "",
    `Meeting: ${meetingRow.title || meetingRow.name || meetingCode}`,
    `Meeting code: ${meetingCode}`,
    "",
    "## Counts",
    `- Participants: ${participants.rows.length}`,
    `- Chat messages: ${messages.rows.length}`,
    `- Voice transcript entries: ${voiceTranscripts.rows.length}`,
    `- Notes: ${notes.rows.length}`,
    `- Decisions: ${decisions.rows.length}`,
    `- Action items: ${actionItems.rows.length}`,
    "",
    "## Conversation Preview",
    messageText || transcriptText || "No readable meeting conversation content found yet.",
  ].join("\n");

  const meetingNode = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: "meeting",
    nodeKey: meetingCode,
    title: meetingRow.title || meetingRow.name || `Meeting ${meetingCode}`,
    description: summary,
    metadata: {
      meetingId: meetingRow.id,
      meetingCode,
      participantCount: participants.rows.length,
      messageCount: messages.rows.length,
      transcriptCount: voiceTranscripts.rows.length,
      decisionCount: decisions.rows.length,
      actionItemCount: actionItems.rows.length,
      noteCount: notes.rows.length,
    },
  });

  const teamsNode = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: "surface",
    nodeKey: "nexus_teams",
    title: "Nexus Teams",
    description: "RioMind Nexus Teams collaboration surface.",
  });

  await upsertRioMindKgEdge({
    aiLayer: "nexus_ai",
    fromNodeId: teamsNode.id,
    toNodeId: meetingNode.id,
    relation: "has_meeting",
    confidence: 1,
  });

  for (const participant of participants.rows.slice(0, 50)) {
    const key = participant.user_id || participant.email || participant.display_name || participant.id;
    if (!key) continue;

    const participantNode = await upsertRioMindKgNode({
      aiLayer: "nexus_ai",
      nodeType: "meeting_participant",
      nodeKey: String(key),
      title: participant.display_name || participant.email || String(key),
      description: "Nexus Teams meeting participant.",
      metadata: participant,
    });

    await upsertRioMindKgEdge({
      aiLayer: "nexus_ai",
      fromNodeId: meetingNode.id,
      toNodeId: participantNode.id,
      relation: "has_participant",
      confidence: 1,
    });
  }

  for (const item of decisions.rows.slice(0, 50)) {
    const key = item.id || `${meetingCode}:decision:${item.created_at}`;
    const node = await upsertRioMindKgNode({
      aiLayer: "nexus_ai",
      nodeType: "meeting_decision",
      nodeKey: String(key),
      title: item.title || item.decision || item.content || "Meeting decision",
      description: item.description || item.decision || item.content || "",
      metadata: item,
    });

    await upsertRioMindKgEdge({
      aiLayer: "nexus_ai",
      fromNodeId: meetingNode.id,
      toNodeId: node.id,
      relation: "produced_decision",
      confidence: 1,
    });
  }

  for (const item of actionItems.rows.slice(0, 50)) {
    const key = item.id || `${meetingCode}:action:${item.created_at}`;
    const node = await upsertRioMindKgNode({
      aiLayer: "nexus_ai",
      nodeType: "meeting_action_item",
      nodeKey: String(key),
      title: item.title || item.action_item || item.content || "Meeting action item",
      description: item.description || item.action_item || item.content || "",
      metadata: item,
    });

    await upsertRioMindKgEdge({
      aiLayer: "nexus_ai",
      fromNodeId: meetingNode.id,
      toNodeId: node.id,
      relation: "produced_action_item",
      confidence: 1,
    });
  }

  return {
    meeting: meetingRow,
    intelligence: {
      summary,
      counts: {
        participants: participants.rows.length,
        messages: messages.rows.length,
        voiceTranscripts: voiceTranscripts.rows.length,
        notes: notes.rows.length,
        decisions: decisions.rows.length,
        actionItems: actionItems.rows.length,
      },
      previews: {
        messages: messageText,
        transcripts: transcriptText,
      },
    },
    knowledgeGraph: {
      meetingNode,
    },
  };
}
