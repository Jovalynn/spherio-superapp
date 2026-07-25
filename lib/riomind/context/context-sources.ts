import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { searchRioMindKnowledge } from "../rag/rag-engine";
import type { RioMindContextBuildInput, RioMindContextItem } from "./context-types";

export async function loadRagContextItems(input: RioMindContextBuildInput): Promise<RioMindContextItem[]> {
  const result = await searchRioMindKnowledge({
    aiLayer: input.aiLayer,
    query: input.query,
    limit: input.limit || 6,
  });

  return result.results.map((row: any) => ({
    id: String(row.id),
    type: "rag_document",
    title: String(row.title || "Retrieved document"),
    content: String(row.content || ""),
    score: typeof row.rank === "number" ? row.rank : Number(row.rank || 0),
    metadata: {
      documentId: row.document_id,
      sourceType: row.source_type,
      sourceUri: row.source_uri,
      chunkIndex: row.chunk_index,
      retrievalSessionId: result.session?.id,
    },
  }));
}

export async function loadMemoryContextItems(input: RioMindContextBuildInput): Promise<RioMindContextItem[]> {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const result = await db.query(
    `SELECT id, memory_type, key, value, metadata, updated_at
     FROM riomind_memory
     WHERE (ai_layer = $1 OR ai_layer = 'shared')
       AND surface = $2
       AND owner_user_id = $3
     ORDER BY updated_at DESC
     LIMIT 8`,
    [aiLayer, input.surface || "nexus", input.ownerUserId || "local-user"]
  );

  return result.rows.map((row: any) => ({
    id: String(row.id),
    type: "memory",
    title: `${row.memory_type || "memory"}:${row.key || "item"}`,
    content: String(row.value || ""),
    score: null,
    metadata: {
      memoryType: row.memory_type,
      key: row.key,
      updatedAt: row.updated_at,
      ...(row.metadata || {}),
    },
  }));
}

export async function loadRioMindContextSources(input: RioMindContextBuildInput): Promise<RioMindContextItem[]> {
  const [ragItems, memoryItems] = await Promise.all([
    loadRagContextItems(input).catch(() => []),
    loadMemoryContextItems(input).catch(() => []),
  ]);

  const seen = new Set<string>();
  const combined: RioMindContextItem[] = [];

  for (const item of [...memoryItems, ...ragItems]) {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(item);
  }

  return combined;
}
