import { NextRequest, NextResponse } from "next/server";
import { createDocxArtifact } from "@/lib/riomind/artifacts/docx";
import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ownerKey = getRioMindOwnerKey(req.headers);

    const artifact = await createDocxArtifact({
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
      source: "direct_docx_route",
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
        error: error instanceof Error ? error.message : "docx_artifact_failed",
      },
      { status: 500 }
    );
  }
}
