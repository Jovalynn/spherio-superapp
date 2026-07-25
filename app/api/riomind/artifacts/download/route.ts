import { readFile, stat } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey } from "@/lib/riomind/db";

export const runtime = "nodejs";

const ALLOWED_ARTIFACT_EXTENSIONS = /\.(xlsx|csv|pdf|docx|pptx|md|txt)$/i;

function safeArtifactName(value: string) {
  const baseName = path.basename(value || "").trim();

  if (!baseName || baseName.includes("..")) {
    return null;
  }

  if (!ALLOWED_ARTIFACT_EXTENSIONS.test(baseName)) {
    return null;
  }

  return baseName;
}

function contentTypeForFile(name: string) {
  if (/\.xlsx$/i.test(name)) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  if (/\.csv$/i.test(name)) {
    return "text/csv; charset=utf-8";
  }

  if (/\.pdf$/i.test(name)) {
    return "application/pdf";
  }

  if (/\.docx$/i.test(name)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (/\.pptx$/i.test(name)) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  if (/\.md$/i.test(name)) {
    return "text/markdown; charset=utf-8";
  }

  return "text/plain; charset=utf-8";
}

export async function GET(request: NextRequest) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const name = safeArtifactName(request.nextUrl.searchParams.get("name") || "");

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "valid_artifact_name_required",
        },
        { status: 400 }
      );
    }

    const uploadRoot = process.env.RIOMIND_UPLOAD_DIR || "/app/.riomind_uploads";
    const ownerDir = ownerKey.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const artifactDir = path.join(uploadRoot, ownerDir, "artifacts");
    const filePath = path.join(artifactDir, name);

    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "artifact_not_found",
        },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentTypeForFile(name),
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "artifact_download_failed",
      },
      { status: 500 }
    );
  }
}
