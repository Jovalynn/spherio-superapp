import { getRioMindDocumentMetricTrends } from "./document-trends";
import { upsertRioMindKgNode } from "../knowledge-graph/kg-engine";
import { ingestRioMindKnowledge } from "../learning/learning-ingestion";

function directionLabel(direction: string) {
  if (direction === "increased") return "Improving";
  if (direction === "decreased") return "Declining";
  if (direction === "unchanged") return "Stable";
  return "New";
}

function formatPercent(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${value.toFixed(2)}%`;
}

export async function getRioMindKpiDashboard(input: {
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  limit?: number;
}) {
  const trends = await getRioMindDocumentMetricTrends({
    aiLayer: input.aiLayer || "nexus_ai",
    limit: input.limit || 1000,
  });

  const cards = (trends.trends || []).map((trend: any) => ({
    metricName: trend.metricName,
    title: `${trend.metricName} Trend`,
    status: directionLabel(trend.directionFromFirst),
    summary: trend.summary,
    current: trend.current,
    first: trend.first,
    previous: trend.previous,
    pointCount: trend.points?.length || 0,
    directionFromFirst: trend.directionFromFirst,
    directionFromPrevious: trend.directionFromPrevious,
    absoluteChangeFromFirst: trend.absoluteChangeFromFirst,
    percentChangeFromFirst: trend.percentChangeFromFirst,
    percentChangeLabel: formatPercent(trend.percentChangeFromFirst),
    chartData: trend.chartData,
  }));

  const improving = cards.filter((card: any) => card.directionFromFirst === "increased");
  const declining = cards.filter((card: any) => card.directionFromFirst === "decreased");
  const stable = cards.filter((card: any) => card.directionFromFirst === "unchanged");

  return {
    ok: true,
    product: "RioMind Nexus",
    surface: "kpi_dashboard",
    aiLayer: trends.aiLayer,
    summary: {
      metricCount: cards.length,
      improvingCount: improving.length,
      decliningCount: declining.length,
      stableCount: stable.length,
    },
    cards,
    groups: {
      improving,
      declining,
      stable,
    },
  };
}


export async function persistRioMindKpiDashboardSummary(input: {
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  limit?: number;
}) {
  const aiLayer = input.aiLayer || "nexus_ai";
  const dashboard = await getRioMindKpiDashboard({
    aiLayer,
    limit: input.limit || 1000,
  });

  const lines = [
    `KPI dashboard status: ${dashboard.summary.improvingCount} improving, ${dashboard.summary.decliningCount} declining, ${dashboard.summary.stableCount} stable, ${dashboard.summary.metricCount} total metrics.`,
    ...dashboard.cards.map((card: any) =>
      `${card.metricName}: ${card.status}. ${card.summary} Change: ${card.percentChangeLabel || "unknown"}.`
    ),
  ];

  const summaryText = lines.join("\n");

  const node = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "kpi_dashboard_summary",
    nodeKey: "kpi_dashboard:latest",
    title: "KPI Dashboard Summary",
    description: summaryText,
    metadata: {
      source: "kpi_dashboard",
      summary: dashboard.summary,
      cards: dashboard.cards,
      updatedAt: new Date().toISOString(),
    },
  });

  const memory = await ingestRioMindKnowledge({
    aiLayer,
    surface: "nexus_documents",
    sourceType: "report",
    sourceId: "kpi_dashboard:latest",
    title: "KPI Dashboard Summary",
    text: summaryText,
    ownerUserId: "local-user",
    metadata: {
      source: "kpi_dashboard",
      nodeId: node.id,
      summary: dashboard.summary,
      cards: dashboard.cards.map((card: any) => ({
        metricName: card.metricName,
        status: card.status,
        summary: card.summary,
        percentChangeLabel: card.percentChangeLabel,
        pointCount: card.pointCount,
      })),
    },
  });

  return {
    ok: true,
    dashboard,
    node,
    memory,
  };
}
