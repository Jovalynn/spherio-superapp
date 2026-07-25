import { getRioMindDocumentMetricTrends } from "../documents/document-trends";
import { getRioMindKpiDashboard } from "../documents/kpi-dashboard";

function pct(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
  return `${value.toFixed(2)}%`;
}

function compact(value: unknown, unit?: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  let out = String(n);
  if (Math.abs(n) >= 1_000_000_000) out = `${(n / 1_000_000_000).toFixed(1)}B`;
  else if (Math.abs(n) >= 1_000_000) out = `${(n / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(n) >= 1_000) out = `${(n / 1_000).toFixed(1)}K`;

  return unit === "percent" ? `${out}%` : out;
}

function forecastRange(current: number, percentChange: number | null, unit?: string | null) {
  if (!Number.isFinite(current)) return null;

  const growthRate = typeof percentChange === "number" && Number.isFinite(percentChange)
    ? Math.max(Math.min(percentChange / 100, 0.35), -0.25)
    : 0.08;

  const low = current * (1 + growthRate * 0.45);
  const high = current * (1 + growthRate * 0.75);

  return {
    low,
    high,
    label: `${compact(low, unit)} – ${compact(high, unit)}`,
    assumption: "Based on the observed trend continuing with conservative smoothing.",
  };
}

export async function getRioMindMetricBriefing(input: {
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  metricName: string;
}) {
  const aiLayer = input.aiLayer || "nexus_ai";
  const metricName = input.metricName;

  const trendResult = await getRioMindDocumentMetricTrends({
    aiLayer,
    metric: metricName,
    limit: 1000,
  });

  const dashboard = await getRioMindKpiDashboard({
    aiLayer,
    limit: 1000,
  }).catch(() => null);

  const trend = trendResult.trends?.[0] || null;
  const relatedCards = (dashboard?.cards || []).filter((card: any) => card.metricName !== metricName);

  if (!trend) {
    return {
      ok: true,
      aiLayer,
      metricName,
      briefing: null,
      message: `No AI briefing is available yet for ${metricName}.`,
    };
  }

  const current = trend.current;
  const first = trend.first;
  const previous = trend.previous || trend.first;
  const currentValue = compact(current?.valueNumber, current?.unit) || current?.valueText || "unknown";
  const previousValue = compact(previous?.valueNumber, previous?.unit) || previous?.valueText || "unknown";
  const changeLabel = pct(trend.percentChangeFromFirst);
  const direction = trend.directionFromFirst || "unchanged";
  const confidence = trend.points?.length >= 2 ? "High" : "Medium";

  const supportingSignals = relatedCards.slice(0, 4).map((card: any) => ({
    metricName: card.metricName,
    status: card.status,
    summary: card.summary,
    percentChangeLabel: card.percentChangeLabel,
  }));

  const recommendations = [
    direction === "increased"
      ? `Continue monitoring ${metricName} because the current trend is improving.`
      : direction === "decreased"
        ? `Review drivers behind the ${metricName} decline.`
        : `Keep watching ${metricName}; the current movement is stable.`,
    supportingSignals.length ? "Compare this metric with related KPI movements before making decisions." : "Add more source documents to improve context.",
    "Review source documents and decisions connected to this metric.",
  ];

  if (/revenue/i.test(metricName)) {
    recommendations.unshift("Validate whether customer and EBITDA growth are contributing to revenue improvement.");
  }

  const forecast = forecastRange(
    Number(current?.valueNumber),
    typeof trend.percentChangeFromPrevious === "number" ? trend.percentChangeFromPrevious : trend.percentChangeFromFirst,
    current?.unit
  );

  const narrative = [
    `${metricName} ${direction} from ${previousValue} to ${currentValue}.`,
    `The observed change from the first recorded value is ${changeLabel}.`,
    supportingSignals.length
      ? `Related KPI signals also show: ${supportingSignals.map((s: any) => `${s.metricName} ${String(s.status || "").toLowerCase()}`).join(", ")}.`
      : "No additional related KPI signals were found yet.",
    `Confidence is ${confidence.toLowerCase()} because RioMind has ${trend.points?.length || 0} observed data points for this metric.`,
  ].join(" ");

  return {
    ok: true,
    aiLayer,
    metricName,
    briefing: {
      title: `${metricName} AI Executive Brief`,
      narrative,
      confidence,
      direction,
      currentValue,
      previousValue,
      changeLabel,
      observedPoints: trend.points?.length || 0,
      supportingSignals,
      forecast,
      recommendations,
      trend,
    },
  };
}
