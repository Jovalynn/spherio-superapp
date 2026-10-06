import type {
  MeetingAgentRuntimeSnapshot,
} from "@/lib/riomind/meetings/intelligence-agents";

export type AIWorkspaceProps = {
  runtime: MeetingAgentRuntimeSnapshot;
};

export type AgentCardProps = {
  agent: MeetingAgentRuntimeSnapshot["agents"][number];
};
