import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { ingestRioMindKnowledge } from "../learning/learning-ingestion";

function percentChange(fromValue: number, toValue: number) {
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === 0) return null;
  return ((toValue - fromValue) / fromValue) * 100;
}

function trendDirection(fromValue: number, toValue: number) {
  if (toValue > fromValue) return "increased";
  if (toValue < fromValue) return "decreased";
  return "unchanged";
}


function chartLabelForPoint(point: any, index: number) {
  const version = point.documentVersion ? `v${point.documentVersion}` : `p${index + 1}`;
  const doc = point.documentId ? String(point.documentId).replace(/^structured_metric_kg_test_?/i, "").toUpperCase() : "";
  return doc && doc !== point.documentId ? doc : version;
}

function buildTrendChartData(trend: any) {
  return {
    chartType: "line",
    xKey: "label",
    series: [
      {
        dataKey: "value",
        label: trend.metricName,
        axisLabel: trend.metricName,
        valueFormat: "compact",
        valueSuffix: trend.current?.unit === "percent" ? "%" : "",
      },
    ],
    data: (trend.points || []).map((point: any, index: number) => ({
      label: chartLabelForPoint(point, index),
      value: point.valueNumber,
      valueText: point.valueText,
      documentId: point.documentId,
      documentVersion: point.documentVersion,
    })),
  };
}

export async function getRioMindDocumentMetricTrends(input: {
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  metric?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const metric = input.metric ? String(input.metric).trim() : "";
  const limit = Math.min(Number(input.limit || 500), 3000);

  const rows = await db.query(
    `SELECT id, ai_layer, node_type, node_key, title, description, metadata, created_at, updated_at
     FROM riomind_kg_nodes
     WHERE ai_layer=$1
       AND node_type='document_metric'
       AND (
         $2::text = ''
         OR title ILIKE '%' || $2 || '%'
         OR node_key ILIKE '%' || $2 || '%'
         OR metadata::text ILIKE '%' || $2 || '%'
       )
     ORDER BY created_at ASC
     LIMIT $3`,
    [aiLayer, metric, limit]
  );

  const metricNodes = rows.rows
    .map((node: any) => {
      const m = node.metadata?.metric || {};
      const metricName = m.name || String(node.title || "").split(":")[0]?.trim() || "Metric";

      return {
        id: node.id,
        nodeKey: node.node_key,
        title: node.title,
        metricName,
        valueText: m.valueText || node.title,
        valueNumber: typeof m.valueNumber === "number" ? m.valueNumber : null,
        unit: m.unit || null,
        currency: m.currency || null,
        documentId: node.metadata?.documentId || null,
        documentVersion: node.metadata?.documentVersion || null,
        documentType: node.metadata?.documentType || null,
        contentHash: node.metadata?.contentHash || node.metadata?.sourceHash || null,
        backfilled: Boolean(node.metadata?.backfilled),
        createdAt: node.created_at || null,
        updatedAt: node.updated_at || null,
      };
    })
    .filter((m: any) => typeof m.valueNumber === "number");

  const groups = new Map<string, any[]>();
  for (const item of metricNodes) {
    const key = item.metricName.toLowerCase();
    groups.set(key, [...(groups.get(key) || []), item]);
  }

  const trends = [];

  for (const [, values] of groups.entries()) {
    const sorted = values.sort((a, b) => {
      const docCompare = String(a.documentId || "").localeCompare(String(b.documentId || ""));
      const av = Number(a.documentVersion || 0);
      const bv = Number(b.documentVersion || 0);

      if (docCompare !== 0 && av === bv) return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      if (av !== bv) return av - bv;

      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });

    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const trend: any = {
      metricName: first.metricName,
      points: sorted,
      current: latest,
      first,
      previous,
      directionFromFirst: trendDirection(first.valueNumber, latest.valueNumber),
      directionFromPrevious: previous ? trendDirection(previous.valueNumber, latest.valueNumber) : "new",
      absoluteChangeFromFirst: latest.valueNumber - first.valueNumber,
      percentChangeFromFirst: percentChange(first.valueNumber, latest.valueNumber),
      absoluteChangeFromPrevious: previous ? latest.valueNumber - previous.valueNumber : null,
      percentChangeFromPrevious: previous ? percentChange(previous.valueNumber, latest.valueNumber) : null,
      summary:
        sorted.length > 1
          ? `${first.metricName} ${trendDirection(first.valueNumber, latest.valueNumber)} from ${first.valueText} to ${latest.valueText}.`
          : `${first.metricName} currently recorded as ${latest.valueText}.`,
    };

    trend.chartData = buildTrendChartData(trend);
    trends.push(trend);
  }

  trends.sort((a, b) => String(a.metricName).localeCompare(String(b.metricName)));

  return {
    ok: true,
    aiLayer,
    metric: metric || null,
    scanned: rows.rows.length,
    count: trends.length,
    trends,
  };
}


export async function persistRioMindDocumentMetricTrends(input: {
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  metric?: string;
  limit?: number;
}) {
  const aiLayer = input.aiLayer || "nexus_ai";
  const trendsResult = await getRioMindDocumentMetricTrends(input);

  const persisted = [];

  for (const trend of trendsResult.trends || []) {
    if (!trend.points || trend.points.length < 2) continue;

    const trendKey = `document_trend:${trend.metricName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    const trendText = `${trend.metricName} trend: ${trend.summary} Direction: ${trend.directionFromFirst}. Percent change: ${trend.percentChangeFromFirst === null ? "unknown" : Number(trend.percentChangeFromFirst).toFixed(2) + "%."}`;

    const trendNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "document_metric_trend",
      nodeKey: trendKey,
      title: `${trend.metricName} Trend`,
      description: trendText,
      metadata: {
        source: "document_metric_trend_engine",
        metricName: trend.metricName,
        summary: trend.summary,
        directionFromFirst: trend.directionFromFirst,
        directionFromPrevious: trend.directionFromPrevious,
        absoluteChangeFromFirst: trend.absoluteChangeFromFirst,
        percentChangeFromFirst: trend.percentChangeFromFirst,
        absoluteChangeFromPrevious: trend.absoluteChangeFromPrevious,
        percentChangeFromPrevious: trend.percentChangeFromPrevious,
        points: trend.points,
        current: trend.current,
        first: trend.first,
        previous: trend.previous,
      },
    });

    for (const point of trend.points) {
      if (!point.id) continue;

      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: trendNode.id,
        toNodeId: point.id,
        relation: "summarizes_metric_point",
        confidence: 0.84,
        metadata: {
          metricName: trend.metricName,
          documentId: point.documentId,
          documentVersion: point.documentVersion,
        },
      });
    }

    const memory = await ingestRioMindKnowledge({
      aiLayer,
      surface: "nexus_documents",
      sourceType: "document",
      sourceId: trendKey,
      title: `${trend.metricName} Trend`,
      text: trendText,
      ownerUserId: "local-user",
      metadata: {
        source: "document_metric_trend_engine",
        metricName: trend.metricName,
        trendNodeId: trendNode.id,
        directionFromFirst: trend.directionFromFirst,
        percentChangeFromFirst: trend.percentChangeFromFirst,
        points: trend.points.map((point: any) => ({
          documentId: point.documentId,
          documentVersion: point.documentVersion,
          valueText: point.valueText,
          valueNumber: point.valueNumber,
        })),
      },
    });

    persisted.push({
      metricName: trend.metricName,
      trendNode,
      memory,
      summary: trend.summary,
    });
  }

  return {
    ok: true,
    trendsScanned: trendsResult.count,
    persistedCount: persisted.length,
    persisted,
  };
}
