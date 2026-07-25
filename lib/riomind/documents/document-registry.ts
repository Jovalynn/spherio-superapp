import crypto from "crypto";
import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export function hashDocumentText(text: string) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

export async function ensureRioMindDocumentRegistrySchema() {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS riomind_document_registry (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_layer text NOT NULL DEFAULT 'nexus_ai',
      surface text NOT NULL DEFAULT 'nexus_documents',
      document_id text NOT NULL,
      title text NOT NULL,
      document_type text NOT NULL DEFAULT 'text',
      content_hash text NOT NULL,
      version integer NOT NULL DEFAULT 1,
      status text NOT NULL DEFAULT 'learned',
      source_type text NOT NULL DEFAULT 'document',
      source_key text NOT NULL,
      owner_user_id text NOT NULL DEFAULT 'local-user',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(ai_layer, document_id, content_hash)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_riomind_document_registry_doc
    ON riomind_document_registry(ai_layer, document_id, updated_at DESC)
  `);
}

export async function registerRioMindDocument(input: {
  aiLayer?: unknown;
  surface?: string;
  documentId: string;
  title: string;
  documentType?: string;
  text: string;
  ownerUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindDocumentRegistrySchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const surface = input.surface || "nexus_documents";
  const documentType = String(input.documentType || "text").toLowerCase();
  const contentHash = hashDocumentText(input.text);

  const latest = await db.query(
    `SELECT * FROM riomind_document_registry
     WHERE ai_layer=$1 AND document_id=$2
     ORDER BY version DESC, updated_at DESC
     LIMIT 1`,
    [aiLayer, input.documentId]
  );

  const latestDoc = latest.rows[0] || null;

  if (latestDoc?.content_hash === contentHash) {
    return {
      alreadySeen: true,
      changed: false,
      version: latestDoc.version,
      contentHash,
      registry: latestDoc,
      previous: latestDoc,
    };
  }

  const nextVersion = latestDoc ? Number(latestDoc.version || 1) + 1 : 1;
  const sourceKey = `document:${input.documentId}:v${nextVersion}`;

  const inserted = await db.query(
    `INSERT INTO riomind_document_registry
     (ai_layer,surface,document_id,title,document_type,content_hash,version,status,source_type,source_key,owner_user_id,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'learned','document',$8,$9,$10)
     RETURNING *`,
    [
      aiLayer,
      surface,
      input.documentId,
      input.title,
      documentType,
      contentHash,
      nextVersion,
      sourceKey,
      input.ownerUserId || "local-user",
      JSON.stringify({
        ...(input.metadata || {}),
        previousContentHash: latestDoc?.content_hash || null,
        previousVersion: latestDoc?.version || null,
      }),
    ]
  );

  return {
    alreadySeen: false,
    changed: Boolean(latestDoc),
    version: nextVersion,
    contentHash,
    registry: inserted.rows[0],
    previous: latestDoc,
  };
}

export async function listRioMindDocumentRegistry(input: {
  aiLayer?: unknown;
  documentId?: string;
  q?: string;
  limit?: number;
}) {
  await ensureRioMindDocumentRegistrySchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Number(input.limit || 50), 200);

  const result = await db.query(
    `SELECT *
     FROM riomind_document_registry
     WHERE ai_layer=$1
       AND ($2::text IS NULL OR document_id=$2)
       AND ($3::text IS NULL OR title ILIKE '%' || $3 || '%' OR document_id ILIKE '%' || $3 || '%')
     ORDER BY document_id ASC, version DESC, updated_at DESC
     LIMIT $4`,
    [aiLayer, input.documentId || null, input.q || null, limit]
  );

  return {
    ok: true,
    count: result.rows.length,
    documents: result.rows,
  };
}
