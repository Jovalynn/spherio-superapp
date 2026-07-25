import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { getRioMindKpiDashboard } from "../documents/kpi-dashboard";

async function safeCount(db: any, sql: string, params: any[] = []) {
  try {
    const result = await db.query(sql, params);
    return Number(result.rows?.[0]?.count || 0);
  } catch {
    return 0;
  }
}

async function safeRows(db: any, sql: string, params: any[] = []) {
  try {
    const result = await db.query(sql, params);
    return result.rows || [];
  } catch {
    return [];
  }
}

export async function getRioMindIntelligenceOverview(input: {
  aiLayer?: unknown;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Number(input.limit || 8), 25);

  const [
    knowledgeNodes,
    knowledgeEdges,
    enterpriseMemory,
    documents,
    metricNodes,
    trendNodes,
    decisions,
    risks,
    actionItems,
  ] = await Promise.all([
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_edges WHERE ai_layer=$1`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_memory WHERE ai_layer=$1`, [aiLayer]),
    safeCount(db, `SELECT count(DISTINCT document_id) FROM riomind_document_registry WHERE ai_layer=$1`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1 AND node_type='document_metric'`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1 AND node_type='document_metric_trend'`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1 AND node_type ILIKE '%decision%'`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1 AND node_type ILIKE '%risk%'`, [aiLayer]),
    safeCount(db, `SELECT count(*) FROM riomind_kg_nodes WHERE ai_layer=$1 AND node_type ILIKE '%action%'`, [aiLayer]),
  ]);

  const kpiDashboard = await getRioMindKpiDashboard({
    aiLayer: aiLayer as any,
    limit: 1000,
  }).catch(() => null);

  const recentDocuments = await safeRows(
    db,
    `SELECT document_id, title, document_type, version, status, updated_at
     FROM riomind_document_registry
     WHERE ai_layer=$1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [aiLayer, limit]
  );

  const memoryHighlights = await safeRows(
    db,
    `SELECT key, value, memory_type, surface, metadata, updated_at
     FROM riomind_memory
     WHERE ai_layer=$1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [aiLayer, limit]
  );

  const latestNodes = await safeRows(
    db,
    `SELECT node_type, title, description, metadata, updated_at
     FROM riomind_kg_nodes
     WHERE ai_layer=$1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [aiLayer, limit]
  );

  const latestIntelligence = [
    ...(kpiDashboard?.cards || []).slice(0, 4).map((card: any) => ({
      type: "kpi_trend",
      title: `${card.metricName}: ${card.status}`,
      summary: card.summary,
      importance: "high",
      updatedAt: new Date().toISOString(),
    })),
    ...latestNodes.slice(0, 6).map((node: any) => ({
      type: node.node_type,
      title: node.title,
      summary: node.description,
      importance: node.node_type === "kpi_dashboard_summary" ? "high" : "normal",
      updatedAt: node.updated_at,
    })),
  ].slice(0, limit);

  return {
    ok: true,
    product: "RioMind Nexus",
    surface: "intelligence_overview",
    aiLayer,
    generatedAt: new Date().toISOString(),
    summary: {
      knowledgeNodes,
      knowledgeEdges,
      enterpriseMemory,
      documents,
      kpis: metricNodes,
      trends: trendNodes,
      decisions,
      risks,
      actionItems,
      improvingKpis: kpiDashboard?.summary?.improvingCount || 0,
      decliningKpis: kpiDashboard?.summary?.decliningCount || 0,
      stableKpis: kpiDashboard?.summary?.stableCount || 0,
    },
    kpiDashboard,
    latestIntelligence,
    recentDocuments,
    memoryHighlights,
  };
}
