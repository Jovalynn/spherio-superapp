import { getRioMindPgPool } from "@/lib/riomind/db";
import { ensureRioMindTeamsSchema } from "./schema";

let ready = false;

export function getRioMindTeamsPool() {
  return getRioMindPgPool();
}

export async function getReadyRioMindTeamsPool() {
  const pool = getRioMindTeamsPool();

  if (!ready) {
    await ensureRioMindTeamsSchema(pool);
    ready = true;
  }

  return pool;
}
