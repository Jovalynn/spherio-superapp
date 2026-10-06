import { getRioMindPgPool } from "@/lib/riomind/db";
import { ensureRioMindTeamsSchema } from "./schema";

let schemaReady: Promise<void> | null = null;

export function getRioMindTeamsPool() {
  return getRioMindPgPool();
}

export async function getReadyRioMindTeamsPool() {
  const pool = getRioMindTeamsPool();

  if (!schemaReady) {
    schemaReady = ensureRioMindTeamsSchema(pool).catch(
      (error) => {
        schemaReady = null;
        throw error;
      }
    );
  }

  await schemaReady;

  return pool;
}
