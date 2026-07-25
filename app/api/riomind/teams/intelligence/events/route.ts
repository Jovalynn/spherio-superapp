import { NextRequest, NextResponse } from "next/server";
import { getNexusTeamsRuntimeDiagnostics } from "@/lib/riomind/teams/runtime/runtime-manager";

function event(
  type: string,
  title: string,
  summary: string,
  status: "completed" | "active" | "pending" | "warning",
  source: string,
  metadata: Record<string, any> = {}
) {
  return {
    id: `${type}:${source}:${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 120),
    type,
    title,
    summary,
    status,
    source,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const meetingCode = req.nextUrl.searchParams.get("meetingCode") || null;
    const runtime = await getNexusTeamsRuntimeDiagnostics();

    const intelligence = runtime.intelligence || {};
    const runtimes = runtime.runtimes || [];

    const byKey = (key: string): any => runtimes.find((item: any) => item.key === key) || {};
    const meeting = byKey("meeting");
    const transcript = byKey("transcript");
    const graph = byKey("knowledge_graph");
    const reasoning = byKey("reasoning");
    const rda = byKey("risks_decisions_actions");
    const reports = byKey("reports");
    const agents = byKey("agents");
    const memory = byKey("memory");
    const search = byKey("search");

    const events = [
      event(
        "meeting_runtime",
        "Meeting runtime verified",
        `${intelligence.meetingClusters || 0} meeting intelligence cluster(s) detected${meetingCode ? ` for ${meetingCode}` : ""}.`,
        meeting.state === "healthy" ? "completed" : "active",
        "meeting_runtime",
        meeting.metrics || {}
      ),
      event(
        "transcript_runtime",
        "Transcript intelligence linked",
        `${transcript.metrics?.transcriptLinkedNodes || 0} transcript-linked knowledge node(s) available.`,
        transcript.state === "healthy" ? "completed" : "active",
        "transcript_runtime",
        transcript.metrics || {}
      ),
      event(
        "knowledge_graph",
        "Knowledge graph updated",
        `${graph.metrics?.clusters || intelligence.clusters || 0} relationship cluster(s), ${graph.metrics?.aggregatedNodes || intelligence.knowledgeNodes || 0} aggregated node reference(s).`,
        graph.state === "healthy" ? "completed" : "active",
        "knowledge_graph",
        graph.metrics || {}
      ),
      event(
        "decision_action_risk",
        "Decisions, actions, and risks extracted",
        `${intelligence.decisions || 0} decision(s), ${intelligence.actions || 0} action item(s), ${intelligence.risks || 0} risk signal(s).`,
        rda.state === "healthy" ? "completed" : "warning",
        "reasoning_extraction",
        rda.metrics || {}
      ),
      event(
        "reasoning",
        "Reasoning refreshed",
        `Reasoning engine is ${reasoning.metrics?.engine || "available"} and chat router is ${reasoning.metrics?.chatRouter || "wired"}.`,
        reasoning.state === "healthy" ? "completed" : "active",
        "reasoning_runtime",
        reasoning.metrics || {}
      ),
      event(
        "memory",
        "Memory state checked",
        `Memory runtime is ${memory.state || "unknown"}; future recall is ${memory.metrics?.futureRecall || "pending verification"}.`,
        memory.state === "healthy" ? "completed" : "pending",
        "memory_runtime",
        memory.metrics || {}
      ),
      event(
        "agents",
        "Agents state checked",
        `Meeting, workflow, memory, and planner agents reported current runtime status.`,
        agents.state === "healthy" ? "completed" : "active",
        "agents_runtime",
        agents.metrics || {}
      ),
      event(
        "reports",
        "Executive reports available",
        `${reports.metrics?.reportCards || 0} executive report card(s) available; workspace is ${reports.metrics?.executiveWorkspace || "available"}.`,
        reports.state === "healthy" ? "completed" : "active",
        "reports_runtime",
        reports.metrics || {}
      ),
      event(
        "search",
        "Search runtime checked",
        `Search runtime is ${search.state || "placeholder"}; query runtime is ${search.metrics?.queryRuntime || "needs implementation"}.`,
        search.state === "healthy" ? "completed" : "pending",
        "search_runtime",
        search.metrics || {}
      ),
    ];

    return NextResponse.json({
      ok: true,
      surface: "nexus_teams_intelligence_events",
      meetingCode,
      generatedAt: new Date().toISOString(),
      count: events.length,
      events,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown team intelligence events error" },
      { status: 500 }
    );
  }
}
