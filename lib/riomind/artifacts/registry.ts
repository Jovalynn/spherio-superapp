import { randomUUID } from "crypto";

import { getRioMindPgPool } from "@/lib/riomind/db";

type AnyArtifact = Record<string, any>;

export type RioMindArtifactRegistryRecord = {
  id: string;
  ownerKey: string;
  artifactId: string | null;
  artifactType: string | null;
  name: string | null;
  title: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  downloadUrl: string | null;
  projectId: string | null;
  conversationId: string | null;
  source: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
};

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function normalizeOwnerKey(value: string) {
  return (
    String(value || "local_dev")
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .slice(0, 120) || "local_dev"
  );
}

function artifactTypeOf(artifact: AnyArtifact) {
  return cleanText(
    artifact.type ||
      artifact.artifactType ||
      artifact.kind ||
      artifact.format ||
      "artifact"
  ).toLowerCase();
}

function artifactNameOf(artifact: AnyArtifact) {
  return cleanText(
    artifact.name ||
      artifact.fileName ||
      artifact.filename ||
      artifact.title ||
      "RioMind Nexus Artifact"
  );
}

function artifactTitleOf(artifact: AnyArtifact) {
  return cleanText(artifact.title || artifact.name || artifact.fileName || artifact.filename || "");
}

function artifactUrlOf(artifact: AnyArtifact) {
  return cleanText(
    artifact.downloadUrl ||
      artifact.downloadURL ||
      artifact.url ||
      artifact.href ||
      artifact.path ||
      ""
  );
}

function artifactFilePathOf(artifact: AnyArtifact, name: string, downloadUrl: string) {
  return cleanText(
    artifact.path ||
      artifact.filePath ||
      artifact.file_path ||
      downloadUrl ||
      name ||
      "RioMind Nexus Artifact"
  );
}

function mimeTypeForArtifactType(type: string) {
  switch (cleanText(type).toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "excel":
    case "xlsx":
    case "spreadsheet":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "docx":
    case "word":
    case "document":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pptx":
    case "powerpoint":
    case "presentation":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    default:
      return "";
  }
}

function artifactMimeOf(artifact: AnyArtifact, artifactType = "") {
  const explicit = cleanText(artifact.mimeType || artifact.mime || artifact.contentType || "");

  if (explicit) {
    return explicit;
  }

  return mimeTypeForArtifactType(
    artifactType ||
      artifact.type ||
      artifact.artifactType ||
      artifact.kind ||
      artifact.format ||
      ""
  );
}

function artifactSizeOf(artifact: AnyArtifact) {
  const size = Number(artifact.sizeBytes ?? artifact.size ?? artifact.bytes ?? 0);
  return Number.isFinite(size) && size > 0 ? Math.round(size) : null;
}

function mapRecord(row: any): RioMindArtifactRegistryRecord {
  const raw = row.raw_row ?? row;

  return {
    id: String(raw.id ?? raw.registry_id ?? ""),
    ownerKey: String(raw.owner_key ?? "local_dev"),
    artifactId: raw.artifact_id ? String(raw.artifact_id) : null,
    artifactType: raw.artifact_type ? String(raw.artifact_type) : raw.type ? String(raw.type) : null,
    name: raw.name ? String(raw.name) : raw.file_name ? String(raw.file_name) : null,
    title: raw.title ? String(raw.title) : null,
    mimeType: raw.mime_type ? String(raw.mime_type) : raw.mimeType ? String(raw.mimeType) : null,
    sizeBytes:
      raw.size_bytes !== undefined && raw.size_bytes !== null
        ? Number(raw.size_bytes)
        : raw.sizeBytes !== undefined && raw.sizeBytes !== null
          ? Number(raw.sizeBytes)
          : null,
    downloadUrl: raw.download_url ? String(raw.download_url) : raw.downloadUrl ? String(raw.downloadUrl) : null,
    projectId: raw.project_id ? String(raw.project_id) : null,
    conversationId: raw.conversation_id ? String(raw.conversation_id) : null,
    source: raw.source ? String(raw.source) : null,
    metadata:
      raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
        ? raw.metadata
        : raw.metadata_json && typeof raw.metadata_json === "object" && !Array.isArray(raw.metadata_json)
          ? raw.metadata_json
          : {},
    createdAt: raw.created_at ? String(raw.created_at) : null,
  };
}

export async function registerRioMindArtifact(input: {
  ownerKey: string;
  artifact: AnyArtifact;
  source?: string;
  projectId?: string | null;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const artifact = input.artifact || {};
  const registryId = randomUUID();

  const artifactId = cleanText(artifact.id || artifact.artifactId || artifact.name || registryId);
  const artifactType = artifactTypeOf(artifact);
  const name = artifactNameOf(artifact);
  const title = artifactTitleOf(artifact) || name;
  const mimeType = artifactMimeOf(artifact, artifactType) || null;
  const sizeBytes = artifactSizeOf(artifact);
  const downloadUrl = artifactUrlOf(artifact) || null;
  const filePath = artifactFilePathOf(artifact, name, downloadUrl || name);
  const source = cleanText(input.source || "artifact_generation") || "artifact_generation";

  const metadata = {
    ...(input.metadata || {}),
    artifact,
  };

  const result = await db.query(
    `
      INSERT INTO riomind_artifacts (
        id,
        owner_key,
        type,
        artifact_id,
        artifact_type,
        name,
        title,
        file_path,
        mime_type,
        size_bytes,
        download_url,
        project_id,
        conversation_id,
        source,
        metadata,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15::jsonb, NOW()
      )
      RETURNING
        id,
        owner_key,
        artifact_id,
        artifact_type,
        name,
        title,
        mime_type,
        size_bytes,
        download_url,
        project_id,
        conversation_id,
        source,
        metadata,
        created_at
    `,
    [
      registryId,
      ownerKey,
      artifactType,
      artifactId,
      artifactType,
      name,
      title,
      filePath,
      mimeType,
      sizeBytes,
      downloadUrl,
      input.projectId || null,
      input.conversationId || null,
      source,
      JSON.stringify(metadata),
    ]
  );

  return mapRecord(result.rows[0]);
}

export function registerRioMindArtifactSafely(input: {
  ownerKey: string;
  artifact: AnyArtifact;
  source?: string;
  projectId?: string | null;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  void registerRioMindArtifact(input).catch((error) => {
    console.warn("[RioMind Artifact Registry] non-blocking register failed", error);
  });
}

export async function listRioMindArtifacts(input: {
  ownerKey: string;
  projectId?: string | null;
  artifactType?: string | null;
  limit?: number;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const limit = Math.min(Math.max(Number(input.limit || 25), 1), 100);
  const projectId = cleanText(input.projectId || "");
  const artifactType = cleanText(input.artifactType || "");

  const params: unknown[] = [ownerKey];
  const where = ["owner_key = $1"];

  if (projectId) {
    params.push(projectId);
    where.push(`project_id = $${params.length}`);
  }

  if (artifactType && artifactType !== "all") {
    params.push(artifactType);
    where.push(`artifact_type = $${params.length}`);
  }

  params.push(limit);

  const result = await db.query(
    `
      SELECT
        id,
        owner_key,
        artifact_id,
        artifact_type,
        name,
        title,
        mime_type,
        size_bytes,
        download_url,
        project_id,
        conversation_id,
        source,
        metadata,
        created_at
      FROM riomind_artifacts
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapRecord);
}
