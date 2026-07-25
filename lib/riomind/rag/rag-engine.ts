import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

function chunkText(content: string, maxChars = 1800) {
  const clean = String(content || "").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += maxChars) chunks.push(clean.slice(i, i + maxChars));
  return chunks;
}

export async function ingestRioMindDocument(input: {
  aiLayer?: unknown;
  surface?: string;
  ownerUserId?: string;
  title: string;
  content: string;
  sourceType?: string;
  sourceUri?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const chunks = chunkText(input.content);

  const doc = await db.query(
    `INSERT INTO riomind_documents
     (ai_layer, surface, owner_user_id, title, content, source_type, source_uri, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      aiLayer,
      input.surface || "nexus",
      input.ownerUserId || "local-user",
      input.title,
      input.content || "",
      input.sourceType || "text",
      input.sourceUri || null,
      input.metadata || {},
    ]
  );

  for (let i = 0; i < chunks.length; i++) {
    await db.query(
      `INSERT INTO riomind_document_chunks
       (document_id, ai_layer, chunk_index, content, token_estimate, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [doc.rows[0].id, aiLayer, i, chunks[i], Math.ceil(chunks[i].length / 4), {}]
    );
  }

  return { document: doc.rows[0], chunks: chunks.length };
}

export async function searchRioMindKnowledge(input: {
  aiLayer?: unknown;
  query: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Math.max(Number(input.limit || 8), 1), 25);

  const result = await db.query(
    `SELECT c.id, c.document_id, d.title, d.source_type, d.source_uri, c.chunk_index, c.content,
            ts_rank(c.search_vector, plainto_tsquery('english', $2)) AS rank
     FROM riomind_document_chunks c
     JOIN riomind_documents d ON d.id = c.document_id
     WHERE ($1 = 'shared' OR c.ai_layer = $1 OR c.ai_layer = 'shared')
       AND c.search_vector @@ plainto_tsquery('english', $2)
     ORDER BY rank DESC, c.created_at DESC
     LIMIT $3`,
    [aiLayer, input.query, limit]
  );

  const session = await db.query(
    `INSERT INTO riomind_retrieval_sessions (ai_layer, query, result_count, metadata)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [aiLayer, input.query, result.rowCount || 0, { mode: "postgres_full_text" }]
  );

  return { session: session.rows[0], results: result.rows };
}
