import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { runRioMindTool } from "../tools/tool-runtime";
import { runRioMindWorkflow } from "../workflows/workflow-runner";
import { orchestrateRioMindAgents } from "../agents/multi-agent-orchestrator";

export type RioMindEvaluationTargetType = "tool" | "workflow" | "multi_agent";

function scoreResult(result: any) {
  const ok = Boolean(result?.ok);
  const verificationStatus = result?.verification?.status || result?.workflowRun?.status || result?.result?.status;
  const confidence = Number(result?.verification?.confidence ?? 0);

  let score = ok ? 0.75 : 0.2;
  if (verificationStatus === "verified") score = Math.max(score, 0.92);
  if (verificationStatus === "partially_verified") score = Math.max(score, 0.58);
  if (confidence) score = Math.max(score, confidence);

  const passed = ok && score >= 0.75;

  return {
    passed,
    score,
    verificationStatus: verificationStatus || "unknown",
    summary: passed ? "Evaluation passed." : "Evaluation needs review.",
  };
}

export async function runRioMindEvaluation(input: {
  aiLayer?: unknown;
  targetType: RioMindEvaluationTargetType;
  targetId?: string;
  target?: any;
  metadata?: Record<string, unknown>;
}) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);

  let result: any;

  if (input.targetType === "tool") {
    const toolName = input.target?.toolName || input.targetId;
    result = await runRioMindTool({
      toolName,
      input: input.target?.input || {},
      aiLayer,
      surface: input.target?.surface || "nexus",
      ownerUserId: input.target?.ownerUserId || "local-user",
    });
  } else if (input.targetType === "workflow") {
    result = await runRioMindWorkflow({
      workflowName: input.target?.workflowName || input.targetId,
      definition: input.target?.definition,
      aiLayer,
      surface: input.target?.surface || "nexus",
      userId: input.target?.userId || "local-user",
      input: input.target?.input || {},
    });
  } else if (input.targetType === "multi_agent") {
    result = await orchestrateRioMindAgents({
      aiLayer,
      surface: input.target?.surface || "nexus",
      userId: input.target?.userId || "local-user",
      goal: input.target?.goal || input.targetId || "Evaluate multi-agent orchestration.",
      agents: input.target?.agents || [],
      metadata: input.metadata || {},
    });
  } else {
    throw new Error(`Unsupported evaluation target type: ${input.targetType}`);
  }

  const scoring = scoreResult(result);

  const evaluation = await db.query(
    `INSERT INTO riomind_evaluations
     (ai_layer, target_type, target_id, score, result)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      aiLayer,
      input.targetType,
      input.targetId || input.target?.workflowName || input.target?.toolName || input.target?.goal || "unknown_target",
      scoring.score,
      JSON.stringify({
        scoring,
        target: input.target || {},
        metadata: input.metadata || {},
        result,
      }),
    ]
  );

  return {
    ok: scoring.passed,
    evaluation: evaluation.rows[0],
    scoring,
    result,
  };
}

export async function listRioMindEvaluations(input: {
  aiLayer?: unknown;
  limit?: number;
}) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer);
  const limit = Math.min(Math.max(Number(input.limit || 25), 1), 100);

  const result = await getRioMindAiFoundationPool().query(
    `SELECT * FROM riomind_evaluations
     WHERE ai_layer = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [aiLayer, limit]
  );

  return result.rows;
}
