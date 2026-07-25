import { NextRequest, NextResponse } from "next/server";
import { getRioMindRelationshipClusters } from "@/lib/riomind/intelligence/relationship-clusters";
import { buildRioMindClusterReasoning } from "@/lib/riomind/intelligence/reasoning-engine";

function answerFromCluster(cluster: any, question: string) {
  const q = question.toLowerCase();

  const title = cluster?.title || "This cluster";
  const summary = cluster?.summary || "No cluster summary is available yet.";
  const counts = cluster?.counts || {};
  const importance = cluster?.importance?.label || "Informational";
  const confidence = cluster?.confidence || "Medium";

  if (q.includes("risk")) {
    return `${title} contains ${counts.risks || 0} risk signal(s). Importance is ${importance}, and confidence is ${confidence}. Review the connected risk nodes and related evidence before taking action.`;
  }

  if (q.includes("decision")) {
    return `${title} contains ${counts.decisions || 0} decision node(s). ${summary}. The strongest next step is to review the connected decisions and verify whether they created action items or downstream risks.`;
  }

  if (q.includes("action") || q.includes("next")) {
    return `${title} contains ${counts.actions || 0} action item(s). Recommended next step: review connected action items, validate owners and due dates, then convert unresolved follow-ups into tracked work.`;
  }

  if (q.includes("important") || q.includes("why")) {
    return `${title} matters because RioMind grouped ${counts.nodes || 0} connected knowledge nodes into one intelligence object. It is rated ${importance} because it includes ${counts.decisions || 0} decision(s), ${counts.actions || 0} action item(s), and ${counts.risks || 0} risk signal(s).`;
  }

  return `${title}: ${summary}. Importance: ${importance}. Confidence: ${confidence}. Connected nodes: ${counts.nodes || 0}. Decisions: ${counts.decisions || 0}. Actions: ${counts.actions || 0}. Risks: ${counts.risks || 0}.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const clusterId = decodeURIComponent(String(body.clusterId || "")).trim();
    const question = String(body.question || "Why is this cluster important?").trim();

    const result = await getRioMindRelationshipClusters({
      aiLayer: body.aiLayer || "nexus_ai",
      q: "",
      type: "all",
      limit: Number(body.limit || 100),
    });

    const cluster =
      result.clusters.find((item: any) => item.clusterId === clusterId) ||
      result.clusters.find((item: any) => String(item.clusterId || "").includes(clusterId)) ||
      null;

    if (!cluster) {
      return NextResponse.json({
        ok: false,
        error: "Cluster not found",
        clusterId,
      }, { status: 404 });
    }

    const reasoning = buildRioMindClusterReasoning(cluster, question);

    return NextResponse.json({
      ok: true,
      surface: "cluster_scoped_ask",
      clusterId,
      question,
      answer: answerFromCluster(cluster, question),
      reasoning,
      context: {
        title: cluster.title,
        type: cluster.type,
        summary: cluster.summary,
        importance: cluster.importance,
        confidence: cluster.confidence,
        counts: cluster.counts,
        memberTypes: cluster.memberTypes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown cluster ask error" },
      { status: 500 }
    );
  }
}
