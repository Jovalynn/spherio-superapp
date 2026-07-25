import { NextRequest, NextResponse } from "next/server";
import { compareRioMindDocumentVersions } from "@/lib/riomind/documents/document-diff";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const documentId = url.searchParams.get("documentId") || "";

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: "documentId is required" },
        { status: 400 }
      );
    }

    const fromVersionParam = url.searchParams.get("fromVersion");
    const toVersionParam = url.searchParams.get("toVersion");

    const result = await compareRioMindDocumentVersions({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      documentId,
      fromVersion: fromVersionParam ? Number(fromVersionParam) : undefined,
      toVersion: toVersionParam ? Number(toVersionParam) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown document diff error" },
      { status: 500 }
    );
  }
}
