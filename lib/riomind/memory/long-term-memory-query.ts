import { searchRioMindEnterprise } from "../search/enterprise-search";

function clean(value: string) {
  return String(value || "")
    .replace(/^(Risk|Decision|Action Item|Fact|Topic|Entity|Task|Source):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = clean(raw);
    const key = value.toLowerCase();

    if (!value || seen.has(key)) continue;

    seen.add(key);
    out.push(value);
  }

  return out;
}

function inferMode(question: string) {
  const q = String(question || "").toLowerCase();

  if (/\b(decision|decisions|decided|agreed|approved)\b/.test(q)) return "decisions";
  if (/\b(action|actions|task|tasks|next|todo|follow up|workflow|should|do before)\b/.test(q)) return "actions";
  if (/\b(risk|risks|blocker|blockers|issue|warning|pending)\b/.test(q)) return "risks";
  if (/\b(topic|topics|theme|themes)\b/.test(q)) return "topics";
  if (/\b(memory|learned|know|knowledge|recall|remember)\b/.test(q)) return "knowledge";

  return "general";
}

function metadataList(result: any, key: string) {
  const metadata = result?.data?.metadata || {};
  const value = metadata?.[key];

  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];

  return [];
}

function extractSentencesByMode(text: string, mode: string) {
  const sentences = String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => clean(s))
    .filter(Boolean);

  if (mode === "risks") return sentences.filter((s) => /\b(risk|pending|blocked|blocker|issue|warning|missing|private|over-indexed)\b/i.test(s));
  if (mode === "decisions") return sentences.filter((s) => /\b(decided|decision|agreed|approved|confirmed)\b/i.test(s));
  if (mode === "actions") return sentences.filter((s) => /\b(should|must|need to|next|build|connect|create|implement|before mainnet)\b/i.test(s));
  if (mode === "topics") return sentences.filter((s) => /\b(topic|theme|mainnet|enterprise search|continuous learning|memory|workflow|agent|security|rbac|authentication)\b/i.test(s));

  return sentences;
}

function memoryText(result: any) {
  return clean(result?.data?.value || result?.snippet || result?.title || "");
}

function extractItemsByMode(mode: string, results: any[]) {
  const items: string[] = [];

  for (const result of results) {
    const nodeType = String(result?.data?.node_type || "");
    const relation = String(result?.data?.relation || "");
    const source = String(result?.source || "");
    const title = clean(result?.title || "");
    const snippet = clean(result?.snippet || "");

    if (source === "enterprise_memory") {
      if (mode === "risks") items.push(...metadataList(result, "risks"));
      if (mode === "decisions") items.push(...metadataList(result, "decisions"));
      if (mode === "actions") items.push(...metadataList(result, "actionItems"));
      if (mode === "topics") items.push(...metadataList(result, "topics"));

      if (mode === "knowledge" || mode === "general") {
        items.push(...metadataList(result, "facts"));
        items.push(...metadataList(result, "decisions"));
        items.push(...metadataList(result, "actionItems"));
        items.push(...metadataList(result, "risks"));
      }

      const fallbackSentences = extractSentencesByMode(memoryText(result), mode);
      if (fallbackSentences.length) {
        items.push(...fallbackSentences);
      } else if (mode === "knowledge" || mode === "general") {
        items.push(memoryText(result));
      }

      continue;
    }

    if (mode === "risks" && (/risk/i.test(nodeType) || /has_risk/i.test(relation) || /risk/i.test(title))) {
      items.push(title || snippet);
      continue;
    }

    if (mode === "decisions" && (/decision/i.test(nodeType) || /has_decision/i.test(relation))) {
      items.push(title || snippet);
      continue;
    }

    if (mode === "actions" && (/action|task|workflow/i.test(`${nodeType} ${relation} ${result?.type}`))) {
      items.push(title || snippet);
      continue;
    }

    if (mode === "topics" && (/topic/i.test(nodeType) || /has_topic/i.test(relation))) {
      items.push(title || snippet);
      continue;
    }

    if (mode === "knowledge" || mode === "general") {
      items.push(snippet || title);
    }
  }

  return unique(items).slice(0, 10);
}


function queryTokens(question: string) {
  return String(question || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter((t) => ![
      "what","remember","about","before","after","from","with","that","this","know","learned","risks","risk","decisions","decision"
    ].includes(t))
    .slice(0, 10);
}

function memoryMatchScore(result: any, question: string) {
  const tokens = queryTokens(question);
  const haystack = [
    result?.title,
    result?.snippet,
    result?.data?.key,
    result?.data?.value,
    JSON.stringify(result?.data?.metadata || {}),
  ].join(" ").toLowerCase();

  const hits = tokens.filter((token) => haystack.includes(token)).length;
  const exactPhrase = String(question || "").toLowerCase().replace(/[^a-z0-9\s_-]+/g, " ").trim();

  let score = hits;
  if (exactPhrase && haystack.includes(exactPhrase)) score += 5;

  // Prefer uploaded/document memories when query mentions file/document/pdf/upload.
  if (/\b(pdf|file|upload|document|doc)\b/i.test(question)) {
    if (/\b(pdf|file|upload|document|doc)\b/i.test(haystack)) score += 2;
  }

  return score;
}


function isBroadMemoryQuestion(question: string) {
  return /\b(all|everything|across|overall|summary|summarize|mainnet|sprint|risks|decisions|tasks)\b/i.test(String(question || ""));
}

function restrictToTopMemorySource(results: any[], question: string) {
  if (isBroadMemoryQuestion(question)) return results;

  const memoryResults = results
    .filter((r) => r.source === "enterprise_memory")
    .map((r) => ({ result: r, memoryScore: memoryMatchScore(r, question) }))
    .sort((a, b) => b.memoryScore - a.memoryScore);

  if (!memoryResults.length) return results;

  const top = memoryResults[0];
  const topKey = top.result?.data?.key || top.result?.title;

  return results.filter((r) => {
    if (r.source !== "enterprise_memory") return false;
    return (r.data?.key || r.title) === topKey;
  });
}

function filterAndRankMemoryResults(results: any[], question: string) {
  const tokens = queryTokens(question);
  const minHits = tokens.length >= 3 ? 2 : 1;

  return results
    .map((result) => ({ result, memoryScore: memoryMatchScore(result, question) }))
    .filter((item) => item.memoryScore >= minHits || item.result.source !== "enterprise_memory")
    .sort((a, b) => {
      if (a.result.source === "enterprise_memory" && b.result.source === "enterprise_memory") {
        return b.memoryScore - a.memoryScore;
      }
      return (b.result.score || 0) - (a.result.score || 0);
    })
    .map((item) => item.result);
}

function summarizeResults(mode: string, search: any) {
  const rawResults = Array.isArray(search?.results) ? search.results : [];
  const rankedResults = filterAndRankMemoryResults(rawResults, search?.q || "");
  const results = restrictToTopMemorySource(rankedResults, search?.q || "");
  const items = extractItemsByMode(mode, results);

  if (mode === "decisions") {
    return items.length ? `Long-term decisions found: ${items.join("; ")}.` : "No matching long-term decisions found yet.";
  }

  if (mode === "actions") {
    return items.length ? `Long-term actions/tasks found: ${items.join("; ")}.` : "No matching long-term action items or tasks found yet.";
  }

  if (mode === "risks") {
    return items.length ? `Long-term risks found: ${items.join("; ")}.` : "No matching long-term risks found yet.";
  }

  if (mode === "topics") {
    return items.length ? `Long-term topics found: ${items.join("; ")}.` : "No matching long-term topics found yet.";
  }

  if (mode === "knowledge") {
    return items.length ? `RioMind remembers: ${items.join("; ")}.` : "No matching long-term memory found yet.";
  }

  return items.length ? `RioMind Core found: ${items.join("; ")}.` : "No matching long-term knowledge found yet.";
}

export async function queryRioMindLongTermMemory(input: {
  question: string;
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  limit?: number;
}) {
  const question = String(input.question || "").trim();
  const aiLayer = input.aiLayer || "nexus_ai";
  const limit = Math.min(Number(input.limit || 20), 50);

  if (!question) {
    return {
      ok: false,
      error: "question is required",
    };
  }

  const mode = inferMode(question);
  const search = await searchRioMindEnterprise({
    q: question,
    aiLayer,
    limit,
  });

  return {
    ok: true,
    mode,
    question,
    answer: summarizeResults(mode, search),
    search,
    memory: {
      resultCount: search.count,
      groupCounts: search.groupCounts,
      sources: search.sources,
    },
  };
}
