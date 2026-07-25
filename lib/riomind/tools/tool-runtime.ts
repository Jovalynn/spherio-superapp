import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { checkRioMindToolPermission } from "./tool-permissions";
import { executeInternalRioMindTool } from "./internal-tools";
import { linkToolCallToKnowledgeGraph } from "../knowledge-graph/kg-autopopulate";
import { executeMeetingGraphTool } from "./meeting-graph-tool";

export type RunRioMindToolInput = {
  runId?: string | null;
  toolName: string;
  input?: Record<string, unknown>;
  aiLayer?: unknown;
  surface?: string;
  ownerUserId?: string;
};

export async function runRioMindTool(input: RunRioMindToolInput) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const toolName = String(input.toolName || "").trim();

  if (input.toolName === "riomind_meeting_graph_query") {
    return {
      ok: true,
      toolName: input.toolName,
      output: await executeMeetingGraphTool(input.input || {}),
      status: "completed",
    };
  }
  const toolInput = input.input || {};

  const call = await db.query(
    `INSERT INTO riomind_tool_calls
     (run_id, tool_name, input, status)
     VALUES ($1,$2,$3,'created')
     RETURNING *`,
    [input.runId || null, toolName, JSON.stringify(toolInput)]
  );

  const callId = call.rows[0].id;

  const permission = await checkRioMindToolPermission({
    toolName,
    aiLayer,
    surface: input.surface || "nexus",
    ownerUserId: input.ownerUserId || "local-user",
  });

  if (!permission.allowed) {
    const result = await db.query(
      `UPDATE riomind_tool_calls
       SET status = 'permission_denied', error = $2, output = $3
       WHERE id = $1
       RETURNING *`,
      [callId, permission.reason, JSON.stringify({ permission })]
    );

    return {
      ok: false,
      call: result.rows[0],
      result: {
        ok: false,
        toolName,
        status: "permission_denied",
        error: permission.reason,
      },
    };
  }

  const execution = await executeInternalRioMindTool({
    runId: input.runId,
    toolName,
    input: toolInput,
    ownerUserId: input.ownerUserId || "local-user",
    aiLayer,
    surface: input.surface || "nexus",
  });

  const updated = await db.query(
    `UPDATE riomind_tool_calls
     SET status = $2, output = $3, error = $4
     WHERE id = $1
     RETURNING *`,
    [
      callId,
      execution.status,
      JSON.stringify(execution.output || {}),
      execution.error || null,
    ]
  );

  await linkToolCallToKnowledgeGraph({
    aiLayer,
    runId: input.runId || null,
    toolName,
    status: execution.status,
    callId: updated.rows[0].id,
  }).catch(() => null);

  return {
    ok: execution.ok,
    call: updated.rows[0],
    result: execution,
  };
}
