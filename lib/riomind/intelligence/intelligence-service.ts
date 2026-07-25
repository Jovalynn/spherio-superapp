import { NexusIntelligenceRequest, NexusIntelligenceResponse } from "./intelligence-types";

async function safeJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getNexusIntelligence(
  request: NexusIntelligenceRequest
): Promise<NexusIntelligenceResponse> {
  const meetingCode = request.meetingCode;

  if (!meetingCode) {
    return {
      summary: {},
      knowledge: { topics: [], entities: [], facts: [] },
      decisions: [],
      actionItems: [],
      tasks: [],
      memory: { graphUpdated: false, searchIndexed: false, knowledgeLinked: false },
      agents: [
        { name: "Planner", status: "idle" },
        { name: "Research", status: "idle" },
        { name: "Workflow", status: "ready" },
      ],
    };
  }

  const [live, tasks, graph] = await Promise.all([
    safeJson(`/api/riomind/meetings/${meetingCode}/live-intelligence?targets=de,fr,zh,yo,ig,ha,ar,es,pt,sw`),
    safeJson(`/api/riomind/meetings/${meetingCode}/tasks`),
    safeJson(`/api/riomind/kg/query?aiLayer=nexus_ai&q=${encodeURIComponent(meetingCode)}`),
  ]);

  const intel = live?.intelligence || {};
  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph?.edges) ? graph.edges : [];

  return {
    summary: {
      text: intel.liveSummary || "No live summary available yet.",
      transcriptEntries: intel.counts?.transcriptEntries || 0,
      speakers: intel.speakers || [],
      risks: intel.risks || [],
    },
    knowledge: {
      topics: intel.topics || [],
      entities: graphNodes.filter((n: any) =>
        ["meeting_topic", "meeting_speaker", "meeting_language"].includes(n.node_type)
      ),
      facts: graphEdges || [],
    },
    decisions: intel.decisions || graphNodes.filter((n: any) => n.node_type === "meeting_decision"),
    actionItems: intel.actionItems || graphNodes.filter((n: any) => n.node_type === "meeting_action_item"),
    tasks: Array.isArray(tasks?.tasks) ? tasks.tasks : [],
    memory: {
      graphUpdated: graphNodes.length > 0,
      graphNodeCount: graphNodes.length,
      graphEdgeCount: graphEdges.length,
      searchIndexed: true,
      knowledgeLinked: graphEdges.length > 0,
      meetingCode,
    },
    agents: [
      { name: "Meeting Agent", status: "running" },
      { name: "Workflow Agent", status: tasks?.count ? "ready" : "idle" },
      { name: "Memory Agent", status: graphNodes.length ? "ready" : "idle" },
      { name: "Planner Agent", status: "idle" },
    ],
  };
}
