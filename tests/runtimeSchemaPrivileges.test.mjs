import test from "node:test";
import assert from "node:assert/strict";
import { ensureRioMindTeamsSchema } from "../lib/riomind/teams/schema.ts";
test("runtime schema readiness uses SELECT and retries after failure", async () => {
  const seen = []; let fail = true;
  const pool = { query: async (sql) => { seen.push(sql); assert.match(sql, /^SELECT .* LIMIT 0$/); if (fail) throw new Error("schema missing"); } };
  await assert.rejects(ensureRioMindTeamsSchema(pool), /schema missing/);
  fail = false;
  await Promise.all([ensureRioMindTeamsSchema(pool), ensureRioMindTeamsSchema(pool)]);
  const count = seen.length;
  await ensureRioMindTeamsSchema(pool);
  assert.equal(seen.length, count);
  assert.ok(count > 2);
});
