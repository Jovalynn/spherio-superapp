export type ExtractedKnowledge = {
  title: string;
  summary: string;
  entities: string[];
  facts: string[];
  topics: string[];
  decisions: string[];
  actionItems: string[];
  risks: string[];
};

function cleanLabel(value: string) {
  return String(value || "")
    .replace(/^(Risk|Decision|Action Item|Fact|Topic|Entity):\s*/i, "")
    .trim();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = cleanLabel(raw).replace(/\s+/g, " ").trim();
    const key = value.toLowerCase();

    if (!value || seen.has(key)) continue;

    seen.add(key);
    out.push(value);
  }

  return out.slice(0, 40);
}

function sentenceSplit(text: string) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isDecision(sentence: string) {
  return /\b(decided|decision|approved|agreed|confirmed|we will|finalized|accepted)\b/i.test(sentence);
}

function isAction(sentence: string) {
  return /\b(next|todo|action|should|must|need to|follow up|assign|build|connect|integrate|ship|create|implement)\b/i.test(sentence);
}

function isRisk(sentence: string) {
  return /\b(risk|blocked|blocker|issue|problem|failure|warning|pending|missing|not configured|latency|security)\b/i.test(sentence);
}

function isFact(sentence: string) {
  return /\b(is|are|was|were|has|have|equals|=|growth|revenue|count|status|enabled|created|connected|linked|indexed)\b/i.test(sentence);
}

export function extractKnowledgeFromText(input: {
  title?: string;
  text: string;
}): ExtractedKnowledge {
  const text = String(input.text || "").trim();
  const sentences = sentenceSplit(text);

  const classified = {
    decisions: [] as string[],
    actionItems: [] as string[],
    risks: [] as string[],
    facts: [] as string[],
  };

  for (const sentence of sentences) {
    // Priority order prevents the same sentence becoming everything.
    if (isDecision(sentence)) {
      classified.decisions.push(sentence);
      continue;
    }

    if (isRisk(sentence)) {
      classified.risks.push(sentence);
      continue;
    }

    if (isAction(sentence)) {
      classified.actionItems.push(sentence);
      continue;
    }

    if (isFact(sentence)) {
      classified.facts.push(sentence);
      continue;
    }
  }

  const rawEntities = text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,}){0,4}\b/g) || [];

  const topics = unique([
    ...Array.from(text.matchAll(/\b(Nexus|RioMind|SpherioChain|Teams|Deepgram|OpenAI|Workflow|Knowledge Graph|Enterprise Search|Memory|Agent|Task|Mainnet|Subscription|Security|Theme|Authentication|RBAC|Continuous Learning|Planning Agents|Multi-Agent Collaboration)\b/gi)).map((m) => m[0]),
  ]);

  return {
    title: input.title || "Untitled Knowledge Source",
    summary: sentences.slice(0, 3).join(" ") || text.slice(0, 500),
    entities: unique(rawEntities).slice(0, 30),
    facts: unique(classified.facts).slice(0, 20),
    topics,
    decisions: unique(classified.decisions).slice(0, 12),
    actionItems: unique(classified.actionItems).slice(0, 12),
    risks: unique(classified.risks).slice(0, 12),
  };
}
