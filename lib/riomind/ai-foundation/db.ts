import { Pool } from "pg";

let pool: Pool | null = null;
let schemaReady = false;

export type RioMindAiLayer = "core_ai" | "nexus_ai" | "shared";

export function normalizeAiLayer(value: unknown): RioMindAiLayer {
  if (value === "core_ai" || value === "nexus_ai" || value === "shared") return value;
  return "shared";
}

export function getRioMindAiFoundationPool() {
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST || process.env.PGHOST || "postgres",
    port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
    database: process.env.POSTGRES_DB || process.env.PGDATABASE || "spherio_indexer",
    user: process.env.POSTGRES_USER || process.env.PGUSER || "spherio",
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || "spherio",
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

export async function ensureRioMindAiFoundationSchema() {
  if (schemaReady) return;

  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_agent_runs LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_agent_steps LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_document_chunks LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_documents LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_embeddings LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_evaluations LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_guardrail_events LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_kg_edges LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_kg_nodes LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_memory LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_reasoning_logs LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_retrieval_sessions LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_tool_calls LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_tools LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_voice_events LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_voice_sessions LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_voice_transcripts LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_workflow_runs LIMIT 0");
  await getRioMindAiFoundationPool().query("SELECT * FROM riomind_workflows LIMIT 0");
  schemaReady = true;
}
