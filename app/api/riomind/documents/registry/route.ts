import { NextRequest, NextResponse } from "next/server";
import { listRioMindDocumentRegistry } from "@/lib/riomind/documents/document-registry";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = await listRioMindDocumentRegistry({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      documentId: url.searchParams.get("documentId") || undefined,
      q: url.searchParams.get("q") || undefined,
      limit: Number(url.searchParams.get("limit") || 50),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown document registry query error" },
      { status: 500 }
    );
  }
}
