import { NextRequest, NextResponse } from "next/server";
import { ingestRioMindDocument } from "@/lib/riomind/documents/document-ingestion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const text = String(body.text || body.content || "").trim();
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "text or content is required" },
        { status: 400 }
      );
    }

    const result: any = await ingestRioMindDocument({
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      surface: body.surface || "nexus_documents",
      documentId: body.documentId || body.document_id,
      documentType: body.documentType || body.document_type || "text",
      title: body.title || "Untitled Document",
      text,
      ownerUserId: body.ownerUserId || body.owner_user_id || "local-user",
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      ok: true,
      skipped: result.skipped || false,
      reason: result.reason || null,
      document: {
        documentId: body.documentId || body.document_id || result.sourceId,
        learnedSourceId: result.sourceId,
        title: result.title,
        documentType: body.documentType || body.document_type || "text",
      },
      registry: result.registry || null,
      provenance: result.provenance || null,
      structuredDocument: result.structuredDocument || null,
      metricNodes: result.metricNodes || [],
      knowledge: result.knowledge,
      graph: result.graph,
      memory: result.memory,
      searchable: result.searchable,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown document ingestion error" },
      { status: 500 }
    );
  }
}
