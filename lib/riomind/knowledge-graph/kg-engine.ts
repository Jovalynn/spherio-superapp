import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export async function upsertRioMindKgNode(input: {
  aiLayer?: unknown;
  nodeType: string;
  nodeKey: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const result = await db.query(
    `INSERT INTO riomind_kg_nodes
     (ai_layer, node_type, node_key, title, description, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (ai_layer, node_type, node_key)
     DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       metadata = riomind_kg_nodes.metadata || EXCLUDED.metadata,
       updated_at = now()
     RETURNING *`,
    [
      aiLayer,
      input.nodeType,
      input.nodeKey,
      input.title,
      input.description || "",
      JSON.stringify(input.metadata || {}),
    ]
  );

  return result.rows[0];
}

export async function upsertRioMindKgEdge(input: {
  aiLayer?: unknown;
  fromNodeId?: string;
  toNodeId?: string;
  from?: { nodeType: string; nodeKey: string; title?: string; description?: string; metadata?: Record<string, unknown> };
  to?: { nodeType: string; nodeKey: string; title?: string; description?: string; metadata?: Record<string, unknown> };
  relation: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  let fromNodeId = input.fromNodeId;
  let toNodeId = input.toNodeId;

  if (!fromNodeId && input.from) {
    const node = await upsertRioMindKgNode({
      aiLayer,
      nodeType: input.from.nodeType,
      nodeKey: input.from.nodeKey,
      title: input.from.title || input.from.nodeKey,
      description: input.from.description || "",
      metadata: input.from.metadata || {},
    });
    fromNodeId = node.id;
  }

  if (!toNodeId && input.to) {
    const node = await upsertRioMindKgNode({
      aiLayer,
      nodeType: input.to.nodeType,
      nodeKey: input.to.nodeKey,
      title: input.to.title || input.to.nodeKey,
      description: input.to.description || "",
      metadata: input.to.metadata || {},
    });
    toNodeId = node.id;
  }

  if (!fromNodeId || !toNodeId) {
    throw new Error("fromNodeId/toNodeId or from/to node objects are required");
  }

  const result = await db.query(
    `INSERT INTO riomind_kg_edges
     (ai_layer, from_node_id, to_node_id, relation, confidence, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (ai_layer, from_node_id, to_node_id, relation)
     DO UPDATE SET
       confidence = EXCLUDED.confidence,
       metadata = riomind_kg_edges.metadata || EXCLUDED.metadata
     RETURNING *`,
    [
      aiLayer,
      fromNodeId,
      toNodeId,
      input.relation,
      Math.max(0, Math.min(1, Number(input.confidence ?? 1))),
      JSON.stringify(input.metadata || {}),
    ]
  );

  return result.rows[0];
}

export async function queryRioMindKg(input: {
  aiLayer?: unknown;
  nodeType?: string;
  nodeKey?: string;
  q?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Math.max(Number(input.limit || 25), 1), 100);

  const nodes = await db.query(
    `SELECT *
     FROM riomind_kg_nodes
     WHERE ai_layer = $1
       AND ($2::text IS NULL OR node_type = $2)
       AND ($3::text IS NULL OR node_key = $3)
       AND ($4::text IS NULL OR title ILIKE '%' || $4 || '%' OR description ILIKE '%' || $4 || '%' OR node_key ILIKE '%' || $4 || '%')
     ORDER BY updated_at DESC
     LIMIT $5`,
    [
      aiLayer,
      input.nodeType || null,
      input.nodeKey || null,
      input.q || null,
      limit,
    ]
  );

  const nodeIds = nodes.rows.map((node: any) => node.id);

  const edges = nodeIds.length
    ? await db.query(
        `SELECT
           e.*,
           from_node.title AS from_title,
           from_node.node_type AS from_type,
           from_node.node_key AS from_key,
           to_node.title AS to_title,
           to_node.node_type AS to_type,
           to_node.node_key AS to_key
         FROM riomind_kg_edges e
         JOIN riomind_kg_nodes from_node ON from_node.id = e.from_node_id
         JOIN riomind_kg_nodes to_node ON to_node.id = e.to_node_id
         WHERE e.ai_layer = $1
           AND (e.from_node_id = ANY($2::uuid[]) OR e.to_node_id = ANY($2::uuid[]))
         ORDER BY e.created_at DESC
         LIMIT $3`,
        [aiLayer, nodeIds, limit * 3]
      )
    : { rows: [] };

  return {
    nodes: nodes.rows,
    edges: edges.rows,
  };
}

export async function seedCoreAiKnowledgeGraph() {
  const spherio = await upsertRioMindKgNode({
    aiLayer: "core_ai",
    nodeType: "platform",
    nodeKey: "spheriochain",
    title: "SpherioChain",
    description: "SpherioChain sovereign Cosmos SDK L1 ecosystem.",
  });

  const indexer = await upsertRioMindKgNode({
    aiLayer: "core_ai",
    nodeType: "service",
    nodeKey: "spherio_indexer",
    title: "Spherio Indexer",
    description: "Indexer service for chain, market, and RioMind data.",
    metadata: { healthUrl: "http://indexer:4000/health" },
  });

  const nexus = await upsertRioMindKgNode({
    aiLayer: "nexus_ai",
    nodeType: "platform",
    nodeKey: "riomind_nexus",
    title: "RioMind Nexus",
    description: "Public RioMind Nexus AI product and workspace.",
  });

  const workflow = await upsertRioMindKgNode({
    aiLayer: "core_ai",
    nodeType: "workflow",
    nodeKey: "coreai_health_check",
    title: "CoreAI Health Check",
    description: "Workflow that checks CoreAI/SpherioChain system health.",
  });

  const a = await upsertRioMindKgEdge({
    aiLayer: "core_ai",
    fromNodeId: spherio.id,
    toNodeId: indexer.id,
    relation: "has_service",
    confidence: 1,
  });

  const b = await upsertRioMindKgEdge({
    aiLayer: "core_ai",
    fromNodeId: spherio.id,
    toNodeId: workflow.id,
    relation: "has_workflow",
    confidence: 1,
  });

  return { nodes: [spherio, indexer, nexus, workflow], edges: [a, b] };
}
