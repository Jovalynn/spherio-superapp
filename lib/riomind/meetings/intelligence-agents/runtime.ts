import {
  MEETING_AGENT_REGISTRY,
} from "./registry";

import type {
  MeetingAgentId,
  MeetingAgentRuntimeSnapshot,
  MeetingAgentRuntimeState,
  MeetingAgentStatus,
} from "./types";

export type BuildMeetingAgentRuntimeInput = {
  meetingCode: string;
  transcriptAvailable?: boolean;
  persistenceAvailable?: boolean;
  intelligenceCount?: number;
  graphNodeCount?: number;
  actionCount?: number;
  overrides?: Partial<
    Record<
      MeetingAgentId,
      Partial<MeetingAgentRuntimeState>
    >
  >;
};

function deriveStatus(
  agentId: MeetingAgentId,
  input: BuildMeetingAgentRuntimeInput
): MeetingAgentStatus {
  const definition =
    MEETING_AGENT_REGISTRY.find(
      (agent) => agent.id === agentId
    );

  if (!definition) {
    return "error";
  }

  if (
    definition.requiresTranscript &&
    !input.transcriptAvailable
  ) {
    return "blocked";
  }

  if (
    definition.requiresPersistence &&
    !input.persistenceAvailable
  ) {
    return "blocked";
  }

  if (
    agentId === "knowledge-graph" ||
    agentId === "memory"
  ) {
    return (input.graphNodeCount || 0) > 0
      ? "ready"
      : "idle";
  }

  if (
    agentId === "workflow" ||
    agentId === "planner"
  ) {
    return (input.actionCount || 0) > 0
      ? "ready"
      : "idle";
  }

  if (agentId === "meeting") {
    return "observing";
  }

  return (input.intelligenceCount || 0) > 0
    ? "ready"
    : definition.defaultStatus;
}

export function buildMeetingAgentRuntime(
  input: BuildMeetingAgentRuntimeInput
): MeetingAgentRuntimeSnapshot {
  return {
    meetingCode: input.meetingCode,
    generatedAt: new Date().toISOString(),

    agents: MEETING_AGENT_REGISTRY
      .slice()
      .sort(
        (left, right) =>
          right.priority - left.priority
      )
      .map((definition) => {
        const override =
          input.overrides?.[definition.id] || {};

        return {
          ...definition,

          agentId: definition.id,

          status:
            override.status ||
            deriveStatus(
              definition.id,
              input
            ),

          lastRunAt:
            override.lastRunAt || null,

          lastResultId:
            override.lastResultId || null,

          message:
            override.message || null,

          metadata:
            override.metadata || {},
        };
      }),
  };
}
