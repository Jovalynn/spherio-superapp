import type {
  MeetingAgentDefinition,
  MeetingAgentId,
} from "./types";

export const MEETING_AGENT_REGISTRY:
  MeetingAgentDefinition[] = [
    {
      id: "meeting",
      name: "AI Meeting Agent",
      shortName: "Meeting",
      icon: "✨",
      description:
        "Observes permitted meeting activity and coordinates summaries, decisions, actions, risks, questions, and commitments.",
      capabilities: [
        "summaries",
        "decisions",
        "actions",
        "risks",
        "questions",
        "commitments",
      ],
      requiresTranscript: false,
      requiresPersistence: false,
      defaultStatus: "observing",
      priority: 100,
    },
    {
      id: "executive",
      name: "Executive Agent",
      shortName: "Executive",
      icon: "📊",
      description:
        "Produces executive briefings, priorities, outcome summaries, unresolved risks, and decision intelligence.",
      capabilities: [
        "summaries",
        "decisions",
        "risks",
        "commitments",
      ],
      requiresTranscript: true,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 90,
    },
    {
      id: "planner",
      name: "Planner Agent",
      shortName: "Planner",
      icon: "🗓️",
      description:
        "Converts decisions and commitments into milestones, owners, deadlines, dependencies, and follow-up plans.",
      capabilities: [
        "actions",
        "planning",
        "commitments",
      ],
      requiresTranscript: true,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 80,
    },
    {
      id: "memory",
      name: "Memory Agent",
      shortName: "Memory",
      icon: "🧠",
      description:
        "Connects the current meeting with historical meetings, people, projects, files, decisions, and organizational memory.",
      capabilities: [
        "memory",
        "knowledge-graph",
      ],
      requiresTranscript: false,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 70,
    },
    {
      id: "workflow",
      name: "Workflow Agent",
      shortName: "Workflow",
      icon: "⚙️",
      description:
        "Turns accepted meeting outcomes into authorized tasks, app actions, notifications, and enterprise workflows.",
      capabilities: [
        "actions",
        "automation",
        "planning",
      ],
      requiresTranscript: false,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 60,
    },
    {
      id: "presenter-coach",
      name: "AI Presenter Coach",
      shortName: "Coach",
      icon: "🎯",
      description:
        "Analyzes speaking pace, clarity, participation balance, timing, confidence, and audience engagement.",
      capabilities: [
        "presentation-coaching",
      ],
      requiresTranscript: true,
      requiresPersistence: false,
      defaultStatus: "idle",
      priority: 50,
    },
    {
      id: "replay",
      name: "AI Meeting Replay",
      shortName: "Replay",
      icon: "⏯️",
      description:
        "Builds a searchable intelligence replay from transcript events, decisions, actions, risks, media, and timeline markers.",
      capabilities: [
        "replay",
        "summaries",
        "decisions",
        "actions",
        "risks",
      ],
      requiresTranscript: true,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 40,
    },
    {
      id: "knowledge-graph",
      name: "Knowledge Graph Agent",
      shortName: "Knowledge Graph",
      icon: "🕸️",
      description:
        "Creates and queries relationships between meetings, people, topics, projects, files, decisions, risks, and tasks.",
      capabilities: [
        "knowledge-graph",
        "memory",
      ],
      requiresTranscript: false,
      requiresPersistence: true,
      defaultStatus: "idle",
      priority: 30,
    },
  ];

export function getMeetingAgent(
  agentId: MeetingAgentId
) {
  return (
    MEETING_AGENT_REGISTRY.find(
      (agent) => agent.id === agentId
    ) || null
  );
}
