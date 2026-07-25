import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

function parseMetricText(text: string) {
  const [nameRaw, ...rest] = String(text || "").split(":");
  const name = String(nameRaw || "Metric").trim();
  const valueText = rest.join(":").trim() || String(text || "").trim();

  const match = valueText.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  let valueNumber = match ? Number(match[1]) : null;

  if (valueNumber !== null) {
    if (/\bmillion\b|\bM\b/.test(valueText)) valueNumber *= 1_000_000;
    if (/\bbillion\b|\bB\b/.test(valueText)) valueNumber *= 1_000_000_000;
  }

  return {
    name,
    valueText,
    valueNumber,
    unit: /percent|%/i.test(valueText) ? "percent" : null,
    currency: /\$|usd|dollars/i.test(valueText) ? "USD" : null,
    confidence: 0.78,
  };
}

export async function backfillRioMindMetricProvenanceToKg(input: {
  aiLayer?: unknown;
  sourceId?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Number(input.limit || 500), 2000);

  const rows = await db.query(
    `SELECT *
     FROM riomind_knowledge_provenance
     WHERE ai_layer=$1
       AND knowledge_kind='metric'
       AND ($2::text IS NULL OR source_id=$2)
     ORDER BY source_id ASC, source_version ASC, created_at ASC
     LIMIT $3`,
    [aiLayer, input.sourceId || null, limit]
  );

  const created = [];

  for (const row of rows.rows) {
    const metric = parseMetricText(row.knowledge_text);
    const documentId = row.source_id;
    const documentVersion = Number(row.source_version || 1);
    const documentType = row.metadata?.documentType || "document";
    const sourceTitle = row.source_title || documentId;

    const sourceNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "knowledge_source",
      nodeKey: `document:${documentId}:v${documentVersion}`,
      title: sourceTitle,
      description: `Document source ${documentId} version ${documentVersion}`,
      metadata: {
        sourceType: "document",
        documentId,
        documentVersion,
        documentType,
        backfilled: true,
      },
    });

    const metricKey = `${documentId}:v${documentVersion}:metric:${metric.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}:${String(metric.valueNumber ?? metric.valueText).replace(/[^a-z0-9.]+/gi, "_")}`;

    const metricNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "document_metric",
      nodeKey: metricKey,
      title: `${metric.name}: ${metric.valueText}`,
      description: `${metric.name} extracted from ${sourceTitle}`,
      metadata: {
        documentId,
        documentVersion,
        documentType,
        metric,
        sourceHash: row.source_hash || null,
        provenanceId: row.id,
        backfilled: true,
      },
    });

    await upsertRioMindKgEdge({
      aiLayer,
      fromNodeId: sourceNode.id,
      toNodeId: metricNode.id,
      relation: "has_metric",
      confidence: metric.confidence,
      metadata: {
        documentId,
        documentVersion,
        metricName: metric.name,
        backfilled: true,
      },
    });

    created.push({ provenanceId: row.id, sourceId: documentId, sourceVersion: documentVersion, metricNode });
  }

  return {
    ok: true,
    scanned: rows.rows.length,
    backfilled: created.length,
    created,
  };
}
