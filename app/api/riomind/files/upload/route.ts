import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const BLOCKED_FILE_EXTENSIONS = /\.(exe|bat|cmd|msi|dll|scr|com|ps1|vbs|jar|sh)$/i;

function isBlockedUploadName(name: string) {
  return BLOCKED_FILE_EXTENSIONS.test(name || "");
}

function safeFileName(name: string) {
  return (
    name
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "uploaded-file"
  );
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 20000);
}

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxTextPreview(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  const isDocx =
    /\.docx$/i.test(originalName) ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isDocx) {
    return null;
  }

  try {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default ?? mammothModule;
    const result = await mammoth.extractRawText({ buffer });
    const extracted = cleanExtractedText(result.value || "");
    return extracted || null;
  } catch (error) {
    console.warn("[RioMind Nexus] DOCX extraction failed", error);
    return null;
  }
}

async function extractSpreadsheetTextPreview(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  const isSpreadsheet =
    /\.(xlsx|xls)$/i.test(originalName) ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel";

  if (!isSpreadsheet) {
    return null;
  }

  try {
    const xlsxModule = await import("xlsx");
    const XLSX = xlsxModule.default ?? xlsxModule;
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sections: string[] = [];

    for (const sheetName of workbook.SheetNames.slice(0, 8)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as unknown[][];

      if (!rows.length) {
        sections.push(`Sheet: ${sheetName}\n(empty)`);
        continue;
      }

      const previewRows = rows.slice(0, 40).map((row) =>
        row
          .slice(0, 12)
          .map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim())
          .join(" | ")
      );

      sections.push([`Sheet: ${sheetName}`, ...previewRows].join("\n"));
    }

    const extracted = cleanExtractedText(sections.join("\n\n"));
    return extracted || null;
  } catch (error) {
    console.warn("[RioMind Nexus] Spreadsheet extraction failed", error);
    return null;
  }
}


async function extractPdfTextPreview(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  const isPdf =
    /\.pdf$/i.test(originalName) ||
    mimeType === "application/pdf";

  if (!isPdf) {
    return null;
  }

  try {
    const pdfParseModule = await import("pdf-parse");

    let extractedText = "";
    let pageCount: number | null = null;

    const legacyDefault =
      "default" in pdfParseModule
        ? (pdfParseModule as { default?: unknown }).default
        : null;

    if (typeof legacyDefault === "function") {
      const result = await legacyDefault(buffer);
      extractedText = typeof result?.text === "string" ? result.text : "";
      pageCount = typeof result?.numpages === "number" ? result.numpages : null;
    } else {
      const PDFParseCtor = (pdfParseModule as {
        PDFParse?: new (input: { data: Buffer }) => {
          getText: () => Promise<{ text?: string; total?: number; pages?: unknown[] }>;
          destroy?: () => Promise<void> | void;
        };
      }).PDFParse;

      if (!PDFParseCtor) {
        return null;
      }

      const parser = new PDFParseCtor({ data: buffer });

      try {
        const result = await parser.getText();
        extractedText = typeof result?.text === "string" ? result.text : "";
        pageCount =
          typeof result?.total === "number"
            ? result.total
            : Array.isArray(result?.pages)
              ? result.pages.length
              : null;
      } finally {
        await parser.destroy?.();
      }
    }

    const extracted = cleanExtractedText(extractedText);

    if (!extracted) {
      return null;
    }

    return pageCount
      ? `PDF pages: ${pageCount}\n\n${extracted}`
      : extracted;
  } catch (error) {
    console.warn("[RioMind Nexus] PDF extraction failed", error);
    return null;
  }
}


async function extractPptxTextPreview(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  const isPptx =
    /\.pptx$/i.test(originalName) ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation";

  if (!isPptx) {
    return null;
  }

  try {
    const jszipModule = await import("jszip");
    const JSZip = jszipModule.default;
    const zip = await JSZip.loadAsync(buffer);

    const slidePaths = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const aNum = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
        const bNum = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
        return aNum - bNum;
      })
      .slice(0, 100);

    const sections: string[] = [];

    for (const slidePath of slidePaths) {
      const slideFile = zip.file(slidePath);
      if (!slideFile) continue;

      const xml = await slideFile.async("text");
      const slideNumber = Number(slidePath.match(/slide(\d+)\.xml/i)?.[1] || sections.length + 1);

      const textRuns = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g))
        .map((match) => decodeXmlText(match[1] || ""))
        .filter(Boolean);

      const uniqueRuns = textRuns.filter(
        (item, index) => textRuns.indexOf(item) === index
      );

      if (uniqueRuns.length) {
        sections.push([`Slide ${slideNumber}`, ...uniqueRuns].join("\n"));
      }
    }

    const extracted = cleanExtractedText(sections.join("\n\n"));
    return extracted || null;
  } catch (error) {
    console.warn("[RioMind Nexus] PPTX extraction failed", error);
    return null;
  }
}


export async function POST(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const form = await request.formData();

    const file = form.get("file");
    const conversationIdRaw = String(form.get("conversationId") || "").trim();
    const conversationId = conversationIdRaw || null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "file_required" },
        { status: 400 }
      );
    }

    if (isBlockedUploadName(file.name || "")) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "blocked_executable_file",
          message:
            "This file type is not supported for document analysis. Please upload a document such as PDF, DOCX, XLSX, CSV, TXT, MD, or PPTX.",
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "file_too_large",
          limitBytes: MAX_FILE_BYTES,
        },
        { status: 413 }
      );
    }

    if (conversationId) {
      const conversationResult = await db.query(
        `
          SELECT id
          FROM riomind_conversations
          WHERE id = $1 AND owner_key = $2
          LIMIT 1
        `,
        [conversationId, ownerKey]
      );

      if (!conversationResult.rowCount) {
        return NextResponse.json(
          { ok: false, product: "RioMind Nexus", error: "conversation_not_found" },
          { status: 404 }
        );
      }
    }

    const id = randomUUID();
    const originalName = safeFileName(file.name || "uploaded-file");
    const extension = path.extname(originalName).slice(0, 24);
    const storedName = `${id}${extension}`;
    const uploadRoot = process.env.RIOMIND_UPLOAD_DIR || "/app/.riomind_uploads";
    const ownerDir = ownerKey.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storageDir = path.join(uploadRoot, ownerDir);
    const storagePath = path.join(storageDir, storedName);

    await mkdir(storageDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(storagePath, buffer);

    const textLikeExtensions = /\\.(txt|md|markdown|csv|json|log|js|jsx|ts|tsx|py|go|rs|sol|sql|html|css|xml|yaml|yml)$/i;
    const isTextLike =
      (file.type || "").startsWith("text/") ||
      file.type === "application/json" ||
      textLikeExtensions.test(originalName);

    let textPreview = isTextLike
      ? cleanExtractedText(buffer.toString("utf8")).slice(0, 12000)
      : null;

    let textExtractionKind = textPreview ? "text_like" : null;

    if (!textPreview) {
      const docxPreview = await extractDocxTextPreview(
        buffer,
        originalName,
        file.type || ""
      );

      if (docxPreview) {
        textPreview = docxPreview;
        textExtractionKind = "docx_mammoth";
      }
    }

    if (!textPreview) {
      const spreadsheetPreview = await extractSpreadsheetTextPreview(
        buffer,
        originalName,
        file.type || ""
      );

      if (spreadsheetPreview) {
        textPreview = spreadsheetPreview;
        textExtractionKind = "spreadsheet_xlsx";
      }
    }

    if (!textPreview) {
      const pdfPreview = await extractPdfTextPreview(
        buffer,
        originalName,
        file.type || ""
      );

      if (pdfPreview) {
        textPreview = pdfPreview;
        textExtractionKind = "pdf_parse";
      }
    }

    if (!textPreview) {
      const pptxPreview = await extractPptxTextPreview(
        buffer,
        originalName,
        file.type || ""
      );

      if (pptxPreview) {
        textPreview = pptxPreview;
        textExtractionKind = "pptx_jszip";
      }
    }

    const result = await db.query(
      `
        INSERT INTO riomind_files (
          id,
          owner_key,
          conversation_id,
          original_name,
          stored_name,
          storage_path,
          mime_type,
          size_bytes,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'uploaded', $9::jsonb)
        RETURNING
          id,
          conversation_id,
          original_name,
          mime_type,
          size_bytes,
          status,
          created_at
      `,
      [
        id,
        ownerKey,
        conversationId,
        originalName,
        storedName,
        storagePath,
        file.type || "application/octet-stream",
        file.size,
        JSON.stringify({
          source: "nexus_chat_upload",
          textPreview,
          textPreviewChars: textPreview?.length ?? 0,
          textExtracted: Boolean(textPreview),
          textExtractionKind,
        }),
      ]
    );

    const row = result.rows[0];

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      file: {
        id: row.id,
        conversationId: row.conversation_id,
        name: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        status: row.status,
        createdAt: row.created_at,
        textPreview,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "file_upload_failed",
      },
      { status: 500 }
    );
  }
}
