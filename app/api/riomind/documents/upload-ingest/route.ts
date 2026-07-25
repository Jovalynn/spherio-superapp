import { NextRequest, NextResponse } from "next/server";
import { ingestRioMindDocument } from "@/lib/riomind/documents/document-ingestion";
import { extractTextFromUploadedFile } from "@/lib/riomind/documents/file-text-extractor";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "file is required" },
        { status: 400 }
      );
    }

    const extracted = await extractTextFromUploadedFile({ file });
    if (!extracted.ok || !extracted.text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: extracted.error || "Could not extract text from uploaded file.",
          extracted,
        },
        { status: 400 }
      );
    }

    const documentId =
      String(form.get("documentId") || form.get("document_id") || file.name)
        .replace(/[^a-zA-Z0-9_.-]+/g, "_")
        .slice(0, 160);

    const result: any = await ingestRioMindDocument({
      aiLayer: form.get("aiLayer") || form.get("ai_layer") || "nexus_ai",
      surface: String(form.get("surface") || "nexus_documents"),
      documentId,
      documentType: String(form.get("documentType") || form.get("document_type") || extracted.parser || "uploaded_text"),
      title: String(form.get("title") || file.name || "Uploaded Document"),
      text: extracted.text,
      ownerUserId: String(form.get("ownerUserId") || form.get("owner_user_id") || "local-user"),
      metadata: {
        upload: true,
        originalFileName: extracted.fileName,
        mimeType: extracted.mimeType,
        size: extracted.size,
        parser: extracted.parser,
      },
    });

    return NextResponse.json({
      ok: true,
      upload: {
        fileName: extracted.fileName,
        mimeType: extracted.mimeType,
        size: extracted.size,
        parser: extracted.parser,
      },
      skipped: result.skipped || false,
      reason: result.reason || null,
      document: {
        documentId,
        learnedSourceId: result.sourceId,
        title: result.title,
        documentType: String(form.get("documentType") || form.get("document_type") || extracted.parser || "uploaded_text"),
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
      { ok: false, error: error instanceof Error ? error.message : "Unknown upload ingestion error" },
      { status: 500 }
    );
  }
}
