import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export async function createRioMindAgentRun(input: {
  aiLayer?: unknown;
  surface?: string;
  userId?: string;
  goal: string;
  plan?: unknown[];
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const run = await db.query(
    `INSERT INTO riomind_agent_runs
     (ai_layer, surface, user_id, goal, status, plan, metadata)
     VALUES ($1,$2,$3,$4,'created',$5,$6)
     RETURNING *`,
    [
      aiLayer,
      input.surface || "nexus",
      input.userId || "local-user",
      input.goal,
      JSON.stringify(input.plan || []),
      JSON.stringify(input.metadata || {}),
    ]
  );

  await db.query(
    `INSERT INTO riomind_agent_steps
     (run_id, step_index, kind, status, input, output)
     VALUES ($1,0,'planning','created',$2,$3)`,
    [run.rows[0].id, JSON.stringify({ goal: input.goal }), JSON.stringify({ plan: input.plan || [] })]
  );

  return run.rows[0];
}
