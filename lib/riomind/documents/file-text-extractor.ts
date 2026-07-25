function extensionOf(name: string) {
  return String(name || "").toLowerCase().split(".").pop() || "";
}

function bufferPreview(buffer: ArrayBuffer, max = 16000) {
  const bytes = new Uint8Array(buffer);
  let out = "";

  for (let i = 0; i < Math.min(bytes.length, max); i++) {
    const c = bytes[i];
    if (c >= 32 && c <= 126) out += String.fromCharCode(c);
    else if (c === 10 || c === 13 || c === 9) out += " ";
  }

  return out.replace(/\s+/g, " ").trim();
}

function safePreviewMessage(fileName: string, kind: string, rawPreview: string) {
  const preview = rawPreview.slice(0, 6000);

  return [
    `Uploaded ${kind}: ${fileName}.`,
    preview ? `Safe extracted preview: ${preview}` : "No readable preview text was extracted by the v1 adapter.",
    "Parser note: this is a safe v1 intake adapter. Full structured parsing will be added with dedicated PDF/DOCX/XLSX/PPTX parsers.",
  ].join("\n\n");
}

export async function extractTextFromUploadedFile(input: {
  file: File;
}) {
  const file = input.file;
  const name = file.name || "uploaded-file";
  const type = file.type || "application/octet-stream";
  const lower = name.toLowerCase();
  const ext = extensionOf(name);

  if (
    type.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".log")
  ) {
    const text = await file.text();
    return {
      ok: true,
      text,
      parser: "native_text",
      unsupported: false,
      fileName: name,
      mimeType: type,
      size: file.size,
    };
  }

  const officeOrPdf =
    ext === "pdf" ||
    ext === "docx" ||
    ext === "doc" ||
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "pptx" ||
    ext === "ppt";

  if (officeOrPdf) {
    const buffer = await file.arrayBuffer();
    const preview = bufferPreview(buffer);

    const kind =
      ext === "pdf" ? "PDF document" :
      ext === "docx" || ext === "doc" ? "Word document" :
      ext === "xlsx" || ext === "xls" ? "spreadsheet" :
      ext === "pptx" || ext === "ppt" ? "presentation" :
      "document";

    return {
      ok: true,
      text: safePreviewMessage(name, kind, preview),
      parser: `${ext}_safe_preview_v1`,
      unsupported: false,
      previewOnly: true,
      fileName: name,
      mimeType: type,
      size: file.size,
    };
  }

  return {
    ok: false,
    text: "",
    parser: "unsupported_v1",
    unsupported: true,
    fileName: name,
    mimeType: type,
    size: file.size,
    error: "File parser not yet enabled for this format in v1. Supported now: txt, md, csv, json, log, pdf, doc/docx, xls/xlsx, ppt/pptx safe preview.",
  };
}
