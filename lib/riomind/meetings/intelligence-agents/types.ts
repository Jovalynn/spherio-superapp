export type MeetingAgentId =
  | "meeting"
  | "executive"
  | "planner"
  | "memory"
  | "workflow"
  | "presenter-coach"
  | "replay"
  | "knowledge-graph";

export type MeetingAgentStatus =
  | "idle"
  | "observing"
  | "ready"
  | "running"
  | "blocked"
  | "error";

export type MeetingAgentCapability =
  | "summaries"
  | "decisions"
  | "actions"
  | "risks"
  | "questions"
  | "commitments"
  | "planning"
  | "memory"
  | "automation"
  | "presentation-coaching"
  | "replay"
  | "knowledge-graph";

export type MeetingAgentDefinition = {
  id: MeetingAgentId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  capabilities: MeetingAgentCapability[];
  requiresTranscript: boolean;
  requiresPersistence: boolean;
  defaultStatus: MeetingAgentStatus;
  priority: number;
};

export type MeetingAgentRuntimeState = {
  agentId: MeetingAgentId;
  status: MeetingAgentStatus;
  lastRunAt: string | null;
  lastResultId: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
};

export type MeetingAgentRuntimeSnapshot = {
  meetingCode: string;
  generatedAt: string;
  agents: Array<
    MeetingAgentDefinition &
      MeetingAgentRuntimeState
  >;
};
