import { NextRequest, NextResponse } from "next/server";

import { createPptxArtifact } from "@/lib/riomind/artifacts/pptx";
import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ownerKey = getRioMindOwnerKey(request.headers);

    const artifact = await createPptxArtifact({
      ownerKey,
      title: body?.title,
      content: body?.content,
      sections: body?.sections,
      columns: body?.columns,
      rows: body?.rows,
    });

    registerRioMindArtifactSafely({
      ownerKey,
      artifact,
      source: "direct_pptx_route",
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      artifact,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "pptx_artifact_failed",
      },
      { status: 500 }
    );
  }
}
