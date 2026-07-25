import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { listRioMindArtifacts } from "@/lib/riomind/artifacts/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);

    const artifacts = await listRioMindArtifacts({
      ownerKey,
      projectId: url.searchParams.get("projectId"),
      artifactType: url.searchParams.get("type"),
      limit: Number(url.searchParams.get("limit") || 25),
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      artifacts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "artifact_registry_list_failed",
      },
      { status: 500 }
    );
  }
}
