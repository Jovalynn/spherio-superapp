import { Pool } from "pg";
import fs from "fs";
import path from "path";

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

  const schemaPath = path.join(process.cwd(), "lib/riomind/ai-foundation/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await getRioMindAiFoundationPool().query(sql);
  schemaReady = true;
}
