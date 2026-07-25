import { NextRequest, NextResponse } from "next/server";

import { getRioMindRelationshipClusters } from "@/lib/riomind/intelligence/relationship-clusters";
import { buildRioMindClusterReasoning } from "@/lib/riomind/intelligence/reasoning-engine";

export async function GET(req: NextRequest) {
  try {

    const url = new URL(req.url);

    const clusterId =
      decodeURIComponent(url.searchParams.get("clusterId") || "").trim();

    const question =
      url.searchParams.get("question") ||
      "Why is this intelligence important?";

    const result = await getRioMindRelationshipClusters({
      aiLayer: "nexus_ai",
      limit: 200,
    });

    const cluster =
      result.clusters.find((c:any)=>c.clusterId===clusterId) ||
      result.clusters.find((c:any)=>String(c.clusterId).includes(clusterId));

    if(!cluster){
      return NextResponse.json({
        ok:false,
        error:"Cluster not found",
        clusterId
      },{status:404});
    }

    const reasoning =
      buildRioMindClusterReasoning(cluster,question);

    return NextResponse.json({

      ok:true,

      surface:"reasoning_intelligence",

      clusterId,

      reasoning

    });

  } catch(error){

    return NextResponse.json({

      ok:false,

      error:error instanceof Error
        ? error.message
        : "Unknown reasoning error"

    },{status:500});

  }

}
