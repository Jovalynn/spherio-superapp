import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { getRioMindDocumentMetricTrends } from "../documents/document-trends";
import { getRioMindKpiDashboard } from "../documents/kpi-dashboard";

function confidenceLabel(score: number) {
  if (score >= 0.82) return "High";
  if (score >= 0.58) return "Medium";
  return "Low";
}

function dedupeByKey(items: any[], keyFn: (item: any) => string) {
  const seen = new Set<string>();
  const out = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

async function safeRows(db: any, sql: string, params: any[]) {
  try {
    const result = await db.query(sql, params);
    return result.rows || [];
  } catch {
    return [];
  }
}

export async function getRioMindEvidenceBundle(input: {
  aiLayer?: unknown;
  metric?: string;
  q?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const metric = String(input.metric || input.q || "Revenue").trim();
  const limit = Math.min(Number(input.limit || 12), 50);

  const trendResult = await getRioMindDocumentMetricTrends({
    aiLayer: aiLayer as any,
    metric,
    limit: 1000,
  }).catch(() => null);

  const trend = trendResult?.trends?.[0] || null;

  const dashboard = await getRioMindKpiDashboard({
    aiLayer: aiLayer as any,
    limit: 1000,
  }).catch(() => null);

  const relatedCards = (dashboard?.cards || [])
    .filter((card: any) => card.metricName !== metric)
    .slice(0, 6);

  const metricNodes = await safeRows(
    db,
    `SELECT id, node_type, node_key, title, description, metadata, created_at, updated_at
     FROM riomind_kg_nodes
     WHERE ai_layer=$1
       AND node_type='document_metric'
       AND (
         title ILIKE '%' || $2 || '%'
         OR node_key ILIKE '%' || $2 || '%'
         OR metadata::text ILIKE '%' || $2 || '%'
       )
     ORDER BY updated_at DESC
     LIMIT $3`,
    [aiLayer, metric, limit]
  );

  const documentsFromTrend = (trend?.points || []).map((point: any) => ({
    type: "document",
    title: point.documentId,
    sourceId: point.documentId,
    version: point.documentVersion || 1,
    documentType: point.documentType || "document",
    valueText: point.valueText,
    valueNumber: point.valueNumber,
    trace: {
      source: "document_metric",
      nodeId: point.id,
      nodeKey: point.nodeKey,
      contentHash: point.contentHash || null,
    },
  }));

  const documentsFromRegistry = await safeRows(
    db,
    `SELECT document_id, title, document_type, version, status, content_hash, updated_at
     FROM riomind_document_registry
     WHERE ai_layer=$1
       AND (
         title ILIKE '%' || $2 || '%'
         OR document_id ILIKE '%' || $2 || '%'
       )
     ORDER BY updated_at DESC
     LIMIT $3`,
    [aiLayer, metric, limit]
  );

  const memories = await safeRows(
    db,
    `SELECT key, value, memory_type, surface, metadata, updated_at
     FROM riomind_memory
     WHERE ai_layer=$1
       AND (
         key ILIKE '%' || $2 || '%'
         OR value ILIKE '%' || $2 || '%'
         OR metadata::text ILIKE '%' || $2 || '%'
       )
     ORDER BY updated_at DESC
     LIMIT $3`,
    [aiLayer, metric, limit]
  );

  const decisions = await safeRows(
    db,
    `SELECT id, node_type, node_key, title, description, metadata, updated_at
     FROM riomind_kg_nodes
     WHERE ai_layer=$1
       AND (
         node_type ILIKE '%decision%'
         OR title ILIKE '%decided%'
         OR description ILIKE '%decided%'
       )
       AND (
         title ILIKE '%' || $2 || '%'
         OR description ILIKE '%' || $2 || '%'
         OR metadata::text ILIKE '%' || $2 || '%'
       )
     ORDER BY updated_at DESC
     LIMIT $3`,
    [aiLayer, metric, limit]
  );

  const risks = await safeRows(
    db,
    `SELECT id, node_type, node_key, title, description, metadata, updated_at
     FROM riomind_kg_nodes
     WHERE ai_layer=$1
       AND (
         node_type ILIKE '%risk%'
         OR title ILIKE '%risk%'
         OR description ILIKE '%risk%'
       )
     ORDER BY updated_at DESC
     LIMIT $2`,
    [aiLayer, Math.min(limit, 8)]
  );

  const supportingMetrics = [
    ...metricNodes.map((node: any) => ({
      type: "metric",
      title: node.title,
      summary: node.description || node.title,
      nodeId: node.id,
      nodeKey: node.node_key,
      metadata: node.metadata,
      trace: {
        source: "knowledge_graph",
        nodeType: node.node_type,
        nodeId: node.id,
        nodeKey: node.node_key,
      },
    })),
    ...relatedCards.map((card: any) => ({
      type: "related_metric",
      title: `${card.metricName}: ${card.status}`,
      summary: card.summary,
      percentChangeLabel: card.percentChangeLabel,
      trace: {
        source: "kpi_dashboard",
        metricName: card.metricName,
      },
    })),
  ];

  const supportingDocuments = dedupeByKey(
    [
      ...documentsFromTrend,
      ...documentsFromRegistry.map((doc: any) => ({
        type: "document",
        title: doc.title || doc.document_id,
        sourceId: doc.document_id,
        version: doc.version,
        documentType: doc.document_type,
        status: doc.status,
        trace: {
          source: "document_registry",
          contentHash: doc.content_hash,
          updatedAt: doc.updated_at,
        },
      })),
    ],
    (item) => `${item.sourceId}:v${item.version || 1}`
  );

  const supportingMemories = memories.map((memory: any) => ({
    type: "memory",
    title: memory.key,
    summary: memory.value,
    memoryType: memory.memory_type,
    surface: memory.surface,
    trace: {
      source: "enterprise_memory",
      key: memory.key,
      updatedAt: memory.updated_at,
    },
  }));

  const supportingDecisions = decisions.map((node: any) => ({
    type: "decision",
    title: node.title,
    summary: node.description,
    trace: {
      source: "knowledge_graph",
      nodeType: node.node_type,
      nodeId: node.id,
      nodeKey: node.node_key,
      updatedAt: node.updated_at,
    },
  }));

  const supportingRisks = risks.map((node: any) => ({
    type: "risk",
    title: node.title,
    summary: node.description,
    trace: {
      source: "knowledge_graph",
      nodeType: node.node_type,
      nodeId: node.id,
      nodeKey: node.node_key,
      updatedAt: node.updated_at,
    },
  }));

  const evidenceCount =
    supportingDocuments.length +
    supportingMetrics.length +
    supportingMemories.length +
    supportingDecisions.length +
    supportingRisks.length;

  const independentSourceCount = [
    supportingDocuments.length ? "documents" : null,
    supportingMetrics.length ? "metrics" : null,
    supportingMemories.length ? "memory" : null,
    supportingDecisions.length ? "decisions" : null,
    supportingRisks.length ? "risks" : null,
  ].filter(Boolean).length;

  const confidenceScore = Math.min(
    0.98,
    0.35 +
      Math.min(supportingDocuments.length, 3) * 0.12 +
      Math.min(supportingMetrics.length, 4) * 0.08 +
      Math.min(supportingMemories.length, 2) * 0.07 +
      Math.min(independentSourceCount, 4) * 0.08
  );

  const conclusion = trend
    ? `${trend.metricName} ${trend.directionFromFirst} from ${trend.first?.valueText || "first observed value"} to ${trend.current?.valueText || "current observed value"}.`
    : `RioMind found evidence related to ${metric}.`;

  return {
    ok: true,
    product: "RioMind Nexus",
    surface: "explainable_intelligence",
    aiLayer,
    target: {
      type: "metric",
      name: metric,
    },
    conclusion,
    confidence: {
      score: Number(confidenceScore.toFixed(2)),
      label: confidenceLabel(confidenceScore),
      evidenceCount,
      independentSourceCount,
    },
    evidence: {
      documents: supportingDocuments,
      metrics: supportingMetrics,
      decisions: supportingDecisions,
      risks: supportingRisks,
      memories: supportingMemories,
    },
    traceability: {
      trendAvailable: Boolean(trend),
      trendSummary: trend?.summary || null,
      generatedAt: new Date().toISOString(),
    },
  };
}
