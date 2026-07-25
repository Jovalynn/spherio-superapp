import {
  ensureRioMindAiFoundationSchema,
  getRioMindAiFoundationPool,
  normalizeAiLayer,
} from "../ai-foundation/db";

function normalizeClusterKey(node: any) {
  const key = String(node.node_key || node.title || node.id || "unknown");

  const meetingMatch = key.match(/NX-\d{4}-[A-Z0-9]+/i);
  if (meetingMatch) return `meeting:${meetingMatch[0]}`;

  const docMatch = key.match(/^([^:]+):v\d+/i);
  if (docMatch) return `document:${docMatch[1]}`;

  const metricMatch = key.match(/metric:([^:]+)/i);
  if (metricMatch) return `metric:${metricMatch[1]}`;

  return `${node.node_type || "knowledge"}:${key.slice(0, 80)}`;
}

function clusterTitle(clusterKey: string, nodes: any[]) {
  const primary =
    nodes.find((n) => n.node_type === "meeting") ||
    nodes.find((n) => n.node_type === "meeting_intelligence") ||
    nodes.find((n) => n.node_type === "knowledge_source") ||
    nodes[0];

  if (clusterKey.startsWith("meeting:")) {
    return `Meeting ${clusterKey.replace("meeting:", "")}`;
  }

  if (clusterKey.startsWith("document:")) {
    return `Document ${clusterKey.replace("document:", "")}`;
  }

  if (clusterKey.startsWith("metric:")) {
    const name = clusterKey.replace("metric:", "");
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} Metric`;
  }

  return primary?.title || primary?.node_key || "Knowledge Cluster";
}

function clusterType(clusterKey: string, nodes: any[]) {
  if (clusterKey.startsWith("meeting:")) return "meeting";
  if (clusterKey.startsWith("document:")) return "document";
  if (clusterKey.startsWith("metric:")) return "metric";

  const typeCounts = new Map<string, number>();
  for (const node of nodes) {
    const type = node.node_type || "knowledge";
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }

  return Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "knowledge";
}

function importanceScore(nodes: any[]) {
  let score = 1;

  score += Math.min(nodes.length, 10) * 0.4;

  for (const node of nodes) {
    const type = String(node.node_type || "");
    if (type.includes("decision")) score += 1.5;
    if (type.includes("risk")) score += 1.3;
    if (type.includes("action")) score += 1.1;
    if (type.includes("metric")) score += 1.2;
    if (type.includes("meeting")) score += 0.8;
  }

  return Number(Math.min(score, 10).toFixed(2));
}

function importanceLabel(score: number) {
  if (score >= 8) return "Critical";
  if (score >= 6) return "High";
  if (score >= 4) return "Medium";
  return "Informational";
}

function summarizeCluster(nodes: any[]) {
  const types = Array.from(new Set(nodes.map((n) => n.node_type))).filter(Boolean);

  const decisions = nodes.filter((n) => String(n.node_type).includes("decision")).length;
  const actions = nodes.filter((n) => String(n.node_type).includes("action")).length;
  const risks = nodes.filter((n) => String(n.node_type).includes("risk")).length;
  const metrics = nodes.filter((n) => String(n.node_type).includes("metric")).length;

  const parts = [
    `${nodes.length} connected knowledge nodes`,
    types.length ? `${types.length} node types` : null,
    decisions ? `${decisions} decisions` : null,
    actions ? `${actions} actions` : null,
    risks ? `${risks} risks` : null,
    metrics ? `${metrics} metrics` : null,
  ].filter(Boolean);

  return parts.join(" · ");
}

export async function getRioMindRelationshipClusters(input: {
  aiLayer?: unknown;
  q?: string;
  type?: string;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Number(input.limit || 25), 100);
  const q = String(input.q || "").trim();
  const type = String(input.type || "all");

  const params: any[] = [aiLayer, limit];
  let where = `ai_layer=$1`;

  if (q) {
    params.push(q);
    where += ` AND (
      title ILIKE '%' || $${params.length} || '%'
      OR description ILIKE '%' || $${params.length} || '%'
      OR node_key ILIKE '%' || $${params.length} || '%'
      OR metadata::text ILIKE '%' || $${params.length} || '%'
    )`;
  }

  if (type !== "all") {
    params.push(type);
    where += ` AND node_type ILIKE '%' || $${params.length} || '%'`;
  }

  const result = await db.query(
    `SELECT id, node_type, node_key, title, description, metadata, created_at, updated_at
     FROM riomind_kg_nodes
     WHERE ${where}
     ORDER BY updated_at DESC
     LIMIT $2`,
    params
  );

  const buckets = new Map<string, any[]>();

  for (const node of result.rows || []) {
    const clusterKey = normalizeClusterKey(node);
    const current = buckets.get(clusterKey) || [];
    current.push(node);
    buckets.set(clusterKey, current);
  }

  const clusters = Array.from(buckets.entries()).map(([clusterKey, nodes]) => {
    const score = importanceScore(nodes);
    const memberTypes = Array.from(
      nodes.reduce((map: Map<string, number>, node: any) => {
        const type = node.node_type || "knowledge";
        map.set(type, (map.get(type) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).map(([nodeType, count]) => ({ nodeType, count }));

    return {
      clusterId: clusterKey,
      title: clusterTitle(clusterKey, nodes),
      type: clusterType(clusterKey, nodes),
      summary: summarizeCluster(nodes),
      importance: {
        score,
        label: importanceLabel(score),
      },
      confidence: nodes.length >= 3 ? "High" : nodes.length >= 2 ? "Medium" : "Low",
      counts: {
        nodes: nodes.length,
        decisions: nodes.filter((n) => String(n.node_type).includes("decision")).length,
        actions: nodes.filter((n) => String(n.node_type).includes("action")).length,
        risks: nodes.filter((n) => String(n.node_type).includes("risk")).length,
        metrics: nodes.filter((n) => String(n.node_type).includes("metric")).length,
        meetings: nodes.filter((n) => String(n.node_type).includes("meeting")).length,
      },
      memberTypes,
      previewNodes: nodes.slice(0, 8),
      updatedAt: nodes[0]?.updated_at || null,
    };
  });

  clusters.sort((a, b) => b.importance.score - a.importance.score);

  return {
    ok: true,
    surface: "relationship_clusters",
    aiLayer,
    query: { q, type, limit },
    summary: {
      clusters: clusters.length,
      scannedNodes: result.rows?.length || 0,
      critical: clusters.filter((c) => c.importance.label === "Critical").length,
      high: clusters.filter((c) => c.importance.label === "High").length,
      medium: clusters.filter((c) => c.importance.label === "Medium").length,
    },
    clusters,
  };
}
