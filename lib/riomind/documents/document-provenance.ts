import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export async function ensureRioMindKnowledgeProvenanceSchema() {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS riomind_knowledge_provenance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_layer text NOT NULL DEFAULT 'nexus_ai',
      source_type text NOT NULL,
      source_id text NOT NULL,
      source_title text,
      source_version integer,
      source_hash text,
      knowledge_kind text NOT NULL,
      knowledge_text text NOT NULL,
      node_key text,
      confidence numeric NOT NULL DEFAULT 0.78,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(ai_layer, source_type, source_id, source_version, knowledge_kind, knowledge_text)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_riomind_knowledge_provenance_source
    ON riomind_knowledge_provenance(ai_layer, source_type, source_id, source_version)
  `);
}

export async function recordRioMindKnowledgeProvenance(input: {
  aiLayer?: unknown;
  sourceType: string;
  sourceId: string;
  sourceTitle?: string;
  sourceVersion?: number;
  sourceHash?: string;
  extracted?: {
    facts?: string[];
    decisions?: string[];
    actionItems?: string[];
    risks?: string[];
    topics?: string[];
    entities?: string[];
    financialMetrics?: Array<{
      name: string;
      valueText: string;
      valueNumber?: number | null;
      unit?: string | null;
      currency?: string | null;
      confidence?: number;
    }>;
  };
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindKnowledgeProvenanceSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const extracted = input.extracted || {};

  const rows: Array<{ kind: string; text: string }> = [];

  for (const value of extracted.facts || []) rows.push({ kind: "fact", text: value });
  for (const value of extracted.decisions || []) rows.push({ kind: "decision", text: value });
  for (const value of extracted.actionItems || []) rows.push({ kind: "action_item", text: value });
  for (const value of extracted.risks || []) rows.push({ kind: "risk", text: value });
  for (const value of extracted.topics || []) rows.push({ kind: "topic", text: value });
  for (const value of extracted.entities || []) rows.push({ kind: "entity", text: value });
  for (const metric of extracted.financialMetrics || []) {
    rows.push({
      kind: "metric",
      text: `${metric.name}: ${metric.valueText}`,
    });
  }

  const inserted = [];

  for (const row of rows) {
    const result = await db.query(
      `INSERT INTO riomind_knowledge_provenance
       (ai_layer,source_type,source_id,source_title,source_version,source_hash,knowledge_kind,knowledge_text,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (ai_layer, source_type, source_id, source_version, knowledge_kind, knowledge_text)
       DO UPDATE SET metadata=EXCLUDED.metadata
       RETURNING *`,
      [
        aiLayer,
        input.sourceType,
        input.sourceId,
        input.sourceTitle || null,
        input.sourceVersion || null,
        input.sourceHash || null,
        row.kind,
        row.text,
        JSON.stringify(input.metadata || {}),
      ]
    );

    inserted.push(result.rows[0]);
  }

  return {
    ok: true,
    count: inserted.length,
    rows: inserted,
  };
}

export async function listRioMindKnowledgeProvenance(input: {
  aiLayer?: unknown;
  sourceId?: string;
  q?: string;
  limit?: number;
}) {
  await ensureRioMindKnowledgeProvenanceSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Number(input.limit || 50), 200);

  const result = await db.query(
    `SELECT *
     FROM riomind_knowledge_provenance
     WHERE ai_layer=$1
       AND ($2::text IS NULL OR source_id=$2)
       AND ($3::text IS NULL OR knowledge_text ILIKE '%' || $3 || '%' OR source_title ILIKE '%' || $3 || '%')
     ORDER BY created_at DESC
     LIMIT $4`,
    [aiLayer, input.sourceId || null, input.q || null, limit]
  );

  return {
    ok: true,
    count: result.rows.length,
    provenance: result.rows,
  };
}
