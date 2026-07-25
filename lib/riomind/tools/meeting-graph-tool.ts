import { answerMeetingFromKnowledgeGraph } from "../meetings/meeting-graph-answer";

export async function executeMeetingGraphTool(input: {
  meetingCode?: string;
  meeting_code?: string;
  question?: string;
}) {
  const meetingCode = input.meetingCode || input.meeting_code;

  if (!meetingCode) {
    return {
      ok: false,
      error: "meetingCode is required",
    };
  }

  return answerMeetingFromKnowledgeGraph({
    meetingCode,
    question: input.question || `Summarize meeting ${meetingCode} from the Knowledge Graph.`,
  });
}
