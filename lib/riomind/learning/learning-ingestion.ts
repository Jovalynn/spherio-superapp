import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { extractKnowledgeFromText } from "./knowledge-extractor";

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "knowledge";
}

export async function ingestRioMindKnowledge(input: {
  aiLayer?: unknown;
  surface?: string;
  sourceType: "document" | "chat" | "artifact" | "meeting" | "report" | "research" | "manual";
  sourceId?: string;
  title?: string;
  text: string;
  ownerUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const surface = input.surface || "nexus";
  const sourceId = input.sourceId || `${input.sourceType}:${Date.now()}`;
  const title = input.title || sourceId;
  const knowledge = extractKnowledgeFromText({ title, text: input.text });

  const sourceNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "knowledge_source",
    nodeKey: `${input.sourceType}:${sourceId}`,
    title,
    description: knowledge.summary,
    metadata: {
      sourceType: input.sourceType,
      sourceId,
      surface,
      ...(input.metadata || {}),
      extractedAt: new Date().toISOString(),
    },
  });

  const created = {
    entities: [] as any[],
    facts: [] as any[],
    topics: [] as any[],
    decisions: [] as any[],
    actionItems: [] as any[],
    risks: [] as any[],
  };

  async function addLinkedNode(kind: keyof typeof created, nodeType: string, relation: string, label: string, description = "") {
    const key = `${input.sourceType}:${sourceId}:${nodeType}:${slugify(label)}`;
    const node = await upsertRioMindKgNode({
      aiLayer,
      nodeType,
      nodeKey: key,
      title: label,
      description: description || label,
      metadata: { sourceType: input.sourceType, sourceId, surface },
    });

    await upsertRioMindKgEdge({
      aiLayer,
      fromNodeId: sourceNode.id,
      toNodeId: node.id,
      relation,
      confidence: 0.78,
      metadata: { sourceType: input.sourceType, sourceId },
    });

    created[kind].push(node);
  }

  for (const entity of knowledge.entities) await addLinkedNode("entities", "learned_entity", "mentions_entity", entity);
  for (const topic of knowledge.topics) await addLinkedNode("topics", "learned_topic", "has_topic", topic);
  for (const fact of knowledge.facts) await addLinkedNode("facts", "learned_fact", "has_fact", fact);
  for (const decision of knowledge.decisions) await addLinkedNode("decisions", "learned_decision", "has_decision", decision);
  for (const action of knowledge.actionItems) await addLinkedNode("actionItems", "learned_action_item", "has_action_item", action);
  for (const risk of knowledge.risks) await addLinkedNode("risks", "learned_risk", "has_risk", risk);

  const memory = await db.query(
    `INSERT INTO riomind_memory
     (ai_layer, surface, owner_user_id, memory_type, key, value, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (ai_layer, surface, owner_user_id, memory_type, key)
     DO UPDATE SET value=EXCLUDED.value, metadata=EXCLUDED.metadata, updated_at=now()
     RETURNING *`,
    [
      aiLayer,
      surface,
      input.ownerUserId || "local-user",
      "knowledge",
      `${input.sourceType}:${sourceId}`,
      knowledge.summary,
      JSON.stringify({
        sourceType: input.sourceType,
        sourceId,
        title,
        topics: knowledge.topics,
        entities: knowledge.entities,
        facts: knowledge.facts,
        decisions: knowledge.decisions,
        actionItems: knowledge.actionItems,
        risks: knowledge.risks,
        factCount: knowledge.facts.length,
        decisionCount: knowledge.decisions.length,
        actionItemCount: knowledge.actionItems.length,
        riskCount: knowledge.risks.length,
        ...(input.metadata || {}),
      }),
    ]
  );

  return {
    ok: true,
    aiLayer,
    surface,
    sourceType: input.sourceType,
    sourceId,
    title,
    knowledge,
    graph: {
      sourceNode,
      createdCounts: {
        entities: created.entities.length,
        topics: created.topics.length,
        facts: created.facts.length,
        decisions: created.decisions.length,
        actionItems: created.actionItems.length,
        risks: created.risks.length,
      },
    },
    memory: memory.rows[0],
    searchable: true,
  };
}
