import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";
import { queryRioMindKg } from "../knowledge-graph/kg-engine";

const GENERIC_TITLES = new Set([
  "risk",
  "task",
  "agent",
  "memory",
  "sprint",
  "theme",
  "security",
  "mainnet",
]);

function normalize(value: string) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function cleanTitle(value: string) {
  return String(value || "")
    .replace(/^(Risk|Decision|Action Item|Fact|Topic|Entity|Task|Source):\s*/i, "")
    .trim();
}

function dedupeResults(results: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];

  for (const result of results) {
    const key = [
      result.type,
      result.source,
      normalize(result.title),
      normalize(result.snippet),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(result);
  }

  return out;
}

function scoreResult(result: any, q: string) {
  const query = normalize(q);
  const title = normalize(cleanTitle(result.title));
  const snippet = normalize(result.snippet);
  const nodeType = result.data?.node_type || result.data?.to_type || "";
  const relation = result.data?.relation || "";

  let score = Number(result.score || 0.5);

  const tokens = queryTokens(q);
  const tokenHitCount = tokens.filter((token) => title.includes(token) || snippet.includes(token)).length;

  if (title === query) score += 2.5;
  else if (title.includes(query)) score += 1.5;
  else if (snippet.includes(query)) score += 0.8;

  if (tokenHitCount) score += Math.min(1.2, tokenHitCount * 0.35);

  if (result.type === "knowledge_graph_node") score += 0.3;
  if (nodeType === "knowledge_source") score += 1.1;
  if (nodeType === "learned_fact") score += 0.9;
  if (nodeType === "learned_decision" || nodeType === "meeting_decision") score += 0.8;
  if (nodeType === "learned_action_item" || nodeType === "meeting_action_item" || nodeType === "meeting_task") score += 0.75;
  if (nodeType === "learned_risk" || nodeType === "meeting_risk") score += 0.7;

  if (result.type === "knowledge_graph_edge") {
    const edgeTitle = normalize(result.title);
    if (!edgeTitle.includes(query)) score -= 1.2;
    else score += 0.2;

    if (["has_fact", "has_decision", "has_action_item", "has_risk", "has_task"].includes(relation)) {
      score += 0.25;
    }
  }

  if (result.type === "memory") score += 0.45;
  if (result.type === "workflow") score += 0.35;
  if (result.type === "workflow_run") score += 0.2;

  if (GENERIC_TITLES.has(title)) score -= 1.0;
  if (title.length < 4) score -= 0.6;

  return Math.max(0, Number(score.toFixed(4)));
}


function queryTokens(q: string) {
  return normalize(q)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !["what","know","about","before","show","find","search","tasks","task"].includes(token))
    .slice(0, 8);
}

function tokenMatchesText(tokens: string[], value: string) {
  const haystack = normalize(value);
  return tokens.some((token) => haystack.includes(token));
}


function tokenHitCount(tokens: string[], ...values: string[]) {
  const haystack = normalize(values.join(" "));
  return tokens.filter((token) => haystack.includes(token)).length;
}

function workflowResultIsRelevant(result: any, q: string) {
  if (result.source !== "workflow_engine") return true;

  const query = normalize(q);
  const tokens = queryTokens(q);
  const title = String(result.title || "");
  const snippet = String(result.snippet || "");
  const payload = JSON.stringify(result.data || {});

  if (normalize(title).includes(query) || normalize(snippet).includes(query) || normalize(payload).includes(query)) {
    return true;
  }

  return tokenHitCount(tokens, title, snippet, payload) >= Math.min(2, tokens.length || 2);
}

function groupResults(results: any[]) {
  return {
    knowledge: results.filter((r) => r.source === "knowledge_graph"),
    workflows: results.filter((r) => r.source === "workflow_engine"),
    memory: results.filter((r) => r.source === "enterprise_memory"),
  };
}

export async function searchRioMindEnterprise(input: {
  q: string;
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const q = String(input.q || "").trim();
  const aiLayer = input.aiLayer || "nexus_ai";
  const limit = Math.min(Number(input.limit || 20), 100);

  if (!q) {
    return {
      ok: false,
      error: "q is required",
      results: [],
      groups: { knowledge: [], workflows: [], memory: [] },
    };
  }

  const graph = await queryRioMindKg({
    aiLayer,
    q,
    limit: Math.max(limit * 3, 50),
  });

  const tokens = queryTokens(q);
  const tokenLike = tokens.map((token) => `%${token}%`);

  const workflowRows = await db.query(
    `SELECT id,name,ai_layer,definition,enabled,created_at
     FROM riomind_workflows
     WHERE name ILIKE $1
        OR definition::text ILIKE $1
        OR EXISTS (
          SELECT 1 FROM unnest($3::text[]) AS token
          WHERE name ILIKE token OR definition::text ILIKE token
        )
     ORDER BY created_at DESC
     LIMIT $2`,
    [`%${q}%`, limit, tokenLike]
  );

  const workflowRunRows = await db.query(
    `SELECT wr.id,wr.workflow_id,wr.status,wr.input,wr.output,wr.created_at,w.name
     FROM riomind_workflow_runs wr
     LEFT JOIN riomind_workflows w ON w.id=wr.workflow_id
     WHERE wr.input::text ILIKE $1
        OR wr.output::text ILIKE $1
        OR w.name ILIKE $1
        OR EXISTS (
          SELECT 1 FROM unnest($3::text[]) AS token
          WHERE wr.input::text ILIKE token OR wr.output::text ILIKE token OR w.name ILIKE token
        )
     ORDER BY wr.created_at DESC
     LIMIT $2`,
    [`%${q}%`, limit, tokenLike]
  );

  const memoryRows = await db.query(
    `SELECT id,ai_layer,surface,memory_type,key,value,metadata,created_at,updated_at
     FROM riomind_memory
     WHERE ai_layer=$1
       AND (
         key ILIKE $2 OR value ILIKE $2 OR metadata::text ILIKE $2
         OR EXISTS (
           SELECT 1 FROM unnest($4::text[]) AS token
           WHERE key ILIKE token OR value ILIKE token OR metadata::text ILIKE token
         )
       )
     ORDER BY updated_at DESC
     LIMIT $3`,
    [aiLayer, `%${q}%`, limit, tokenLike]
  );

  const rawResults = [
    ...(graph.nodes || []).map((node: any) => ({
      type: "knowledge_graph_node",
      title: cleanTitle(node.title),
      snippet: node.description || node.node_key,
      source: "knowledge_graph",
      score: 0.9,
      data: node,
    })),
    ...(graph.edges || []).map((edge: any) => ({
      type: "knowledge_graph_edge",
      title: `${cleanTitle(edge.from_title)} → ${edge.relation} → ${cleanTitle(edge.to_title)}`,
      snippet: edge.relation,
      source: "knowledge_graph",
      score: 0.55,
      data: edge,
    })),
    ...workflowRows.rows.map((workflow: any) => ({
      type: "workflow",
      title: workflow.definition?.description || workflow.definition?.actionText || workflow.name,
      snippet: workflow.name,
      source: "workflow_engine",
      score: 0.76,
      data: workflow,
    })),
    ...workflowRunRows.rows.map((run: any) => ({
      type: "workflow_run",
      title: run.input?.actionText || run.name || run.id,
      snippet: run.status,
      source: "workflow_engine",
      score: 0.72,
      data: run,
    })),
    ...memoryRows.rows.map((memory: any) => ({
      type: "memory",
      title: memory.metadata?.title || memory.key,
      snippet: memory.value,
      source: "enterprise_memory",
      score: 0.7,
      data: memory,
    })),
  ];

  const ranked = dedupeResults(rawResults)
    .map((result) => ({
      ...result,
      score: scoreResult(result, q),
    }))
    .filter((result) => result.score >= 0.45)
    .filter((result) => workflowResultIsRelevant(result, q))
    .sort((a, b) => b.score - a.score);

  // Keep edge flood under control. Nodes/memory/workflows stay primary.
  const primary = ranked.filter((r) => r.type !== "knowledge_graph_edge");
  const edges = ranked.filter((r) => r.type === "knowledge_graph_edge").slice(0, Math.max(3, Math.floor(limit * 0.35)));
  const finalResults = [...primary, ...edges]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const groups = groupResults(finalResults);

  return {
    ok: true,
    q,
    aiLayer,
    count: finalResults.length,
    totalBeforeFiltering: rawResults.length,
    sources: {
      graphNodes: graph.nodes?.length || 0,
      graphEdges: graph.edges?.length || 0,
      workflows: workflowRows.rows.length,
      workflowRuns: workflowRunRows.rows.length,
      memory: memoryRows.rows.length,
    },
    groupCounts: {
      knowledge: groups.knowledge.length,
      workflows: groups.workflows.length,
      memory: groups.memory.length,
    },
    groups,
    results: finalResults,
  };
}
