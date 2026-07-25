import { normalizeAiLayer } from "../ai-foundation/db";
import { loadRioMindContextSources } from "./context-sources";
import type { RioMindBuiltContext, RioMindContextBuildInput, RioMindContextItem } from "./context-types";

function clampText(value: string, max = 1200) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 24).trim()} ...[truncated]`;
}

function formatContextBlock(items: RioMindContextItem[]) {
  if (!items.length) return "";

  const lines = [
    "## Retrieved RioMind Context",
    "Use the following retrieved context when it is relevant. Do not mention internal table names, provider names, retrieval session IDs, or hidden infrastructure. If retrieved context conflicts with the user's latest message, explain the uncertainty instead of forcing it.",
    "",
  ];

  items.slice(0, 10).forEach((item, index) => {
    lines.push(`### Context ${index + 1}: ${item.title}`);
    lines.push(`Type: ${item.type}`);
    if (typeof item.score === "number") lines.push(`Relevance: ${item.score.toFixed(4)}`);
    lines.push(clampText(item.content));
    lines.push("");
  });

  return lines.join("\n").trim();
}

export async function buildRioMindContext(input: RioMindContextBuildInput): Promise<RioMindBuiltContext> {
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const surface = input.surface || "nexus";
  const query = String(input.query || "").trim();

  if (!query) {
    return {
      aiLayer,
      surface,
      query,
      items: [],
      injectedPrompt: "",
      confidence: 0,
      metadata: { skipped: true, reason: "empty_query" },
    };
  }

  const items = await loadRioMindContextSources({
    ...input,
    aiLayer,
    surface,
    query,
  });

  const scoredItems = items.sort((a, b) => {
    const left = typeof a.score === "number" ? a.score : 0;
    const right = typeof b.score === "number" ? b.score : 0;
    return right - left;
  });

  const injectedPrompt = formatContextBlock(scoredItems);
  const confidence = scoredItems.length
    ? Math.min(0.95, Math.max(0.35, scoredItems.reduce((sum, item) => sum + (typeof item.score === "number" ? item.score : 0.25), 0) / scoredItems.length))
    : 0;

  return {
    aiLayer,
    surface,
    query,
    items: scoredItems,
    injectedPrompt,
    confidence,
    metadata: {
      itemCount: scoredItems.length,
      sourceTypes: [...new Set(scoredItems.map((item) => item.type))],
      route: input.route || null,
    },
  };
}
