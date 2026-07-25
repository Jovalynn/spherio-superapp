import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";

export async function registerRioMindTool(input: {
  name: string;
  description?: string;
  aiLayer?: unknown;
  permissionScope?: string;
  schema?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const result = await db.query(
    `INSERT INTO riomind_tools
     (name, description, ai_layer, permission_scope, schema, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (name) DO UPDATE SET
       description = EXCLUDED.description,
       ai_layer = EXCLUDED.ai_layer,
       permission_scope = EXCLUDED.permission_scope,
       schema = EXCLUDED.schema,
       metadata = EXCLUDED.metadata,
       updated_at = now()
     RETURNING *`,
    [
      input.name,
      input.description || "",
      aiLayer,
      input.permissionScope || "read",
      input.schema || {},
      input.metadata || {},
    ]
  );

  return result.rows[0];
}

export async function listRioMindTools() {
  await ensureRioMindAiFoundationSchema();
  const result = await getRioMindAiFoundationPool().query(
    `SELECT * FROM riomind_tools ORDER BY created_at DESC`
  );
  return result.rows;
}
