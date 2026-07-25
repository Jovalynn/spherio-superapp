import { NextRequest, NextResponse } from "next/server";
import { getRioMindRelationshipClusters } from "@/lib/riomind/intelligence/relationship-clusters";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawClusterId = url.searchParams.get("clusterId") || "";
    const clusterId = decodeURIComponent(rawClusterId).trim();

    const result = await getRioMindRelationshipClusters({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      q: url.searchParams.get("q") || "",
      type: url.searchParams.get("type") || "all",
      limit: Number(url.searchParams.get("limit") || 100),
    });

    const cluster =
      result.clusters.find((item: any) => String(item.clusterId || "").trim() === clusterId) ||
      result.clusters.find((item: any) => String(item.clusterId || "").trim() === rawClusterId) ||
      result.clusters.find((item: any) => String(item.clusterId || "").includes(clusterId)) ||
      null;

    return NextResponse.json({
      ok: true,
      surface: "cluster_intelligence_detail",
      clusterId,
      cluster,
      relatedClusters: result.clusters
        .filter((item: any) => item.clusterId !== cluster?.clusterId)
        .slice(0, 8),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown cluster detail error" },
      { status: 500 }
    );
  }
}
