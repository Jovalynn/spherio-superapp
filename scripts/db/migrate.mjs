// Use only during the authorized database change window.
import fs from "node:fs/promises";
import { Pool } from "pg";
const url = process.env.SPHERIO_MIGRATION_DATABASE_URL;
if (!url) throw new Error("SPHERIO_MIGRATION_DATABASE_URL is required");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("SET ROLE spherio_schema_owner");
  await client.query("SELECT pg_advisory_lock(720260011)");
  for (const file of ["scripts/db/migrations/001_teams.sql", "scripts/db/migrations/002_message_metadata.sql", "scripts/db/migrations/003_request_schema.sql", "lib/riomind/ai-foundation/schema.sql"]) {
    await client.query(await fs.readFile(file, "utf8"));
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(720260011)").catch(() => {});
  client.release(); await pool.end();
}
