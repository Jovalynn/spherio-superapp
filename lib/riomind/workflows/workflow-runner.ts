import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { runRioMindTool } from "../tools/tool-runtime";
import { verifyRioMindAgentTrace } from "../agents/verification-loop";
import type { RioMindWorkflowDefinition, RioMindWorkflowRunInput, RioMindWorkflowStep } from "./workflow-types";
import { resolveWorkflowValue, type WorkflowVariableContext } from "./workflow-variables";
import { evaluateWorkflowCondition } from "./workflow-condition";
import { linkWorkflowRunToKnowledgeGraph } from "../knowledge-graph/kg-autopopulate";

function builtInWorkflow(name: string): RioMindWorkflowDefinition | null {
  if (name === "coreai_health_check") {
    return {
      name: "coreai_health_check",
      description: "Check SpherioChain/CoreAI system health using internal read-only tools.",
      aiLayer: "core_ai",
      surface: "spheriochain",
      steps: [
        { id: "indexer_health", type: "tool", toolName: "rio_indexer_health", input: {} },
        { id: "usage_summary", type: "tool", toolName: "riomind_usage_summary", input: {} },
        { id: "verify", type: "verification", input: {} },
      ],
    };
  }

  return null;
}

async function loadWorkflowDefinition(input: RioMindWorkflowRunInput) {
  if (input.definition) return input.definition;

  const name = String(input.workflowName || "").trim();
  const builtIn = builtInWorkflow(name);
  if (builtIn) return builtIn;

  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();

  const result = await db.query(
    `SELECT * FROM riomind_workflows WHERE name = $1 AND enabled = true LIMIT 1`,
    [name]
  );

  if (!result.rowCount) {
    throw new Error(`Workflow not found or disabled: ${name}`);
  }

  return {
    name: result.rows[0].name,
    aiLayer: result.rows[0].ai_layer,
    steps: result.rows[0].definition?.steps || [],
    description: result.rows[0].definition?.description || "",
    surface: result.rows[0].definition?.surface || "nexus",
  } satisfies RioMindWorkflowDefinition;
}


async function executeWorkflowSteps(params: {
  steps: RioMindWorkflowStep[];
  context: WorkflowVariableContext;
  trace: any[];
  aiLayer: "core_ai" | "nexus_ai" | "shared";
  surface: string;
  userId: string;
}) {
  for (let i = 0; i < params.steps.length; i++) {
    const step = params.steps[i];

    if (step.type === "tool") {
      const resolvedInput = resolveWorkflowValue(step.input || {}, params.context) as Record<string, unknown>;

      const result = await runRioMindTool({
        runId: null,
        toolName: step.toolName,
        input: resolvedInput,
        aiLayer: params.aiLayer,
        surface: params.surface,
        ownerUserId: params.userId,
      });

      const item = {
        workflowStepId: step.id,
        stepIndex: params.trace.length + 1,
        type: "tool",
        result: result.result,
        toolCall: result.call,
      };

      params.trace.push(item);
      params.context.steps[step.id] = item;
      continue;
    }

    if (step.type === "memory_write") {
      const key = String(resolveWorkflowValue(step.key, params.context) || "").trim();
      const value = resolveWorkflowValue(step.value, params.context);

      const item = {
        workflowStepId: step.id,
        stepIndex: params.trace.length + 1,
        type: "memory_write",
        result: {
          ok: Boolean(key),
          toolName: "workflow_memory_write",
          status: key ? "completed" : "failed",
          output: { key, value, memoryType: step.memoryType || "workflow" },
          error: key ? undefined : "missing_memory_key",
        },
      };

      params.trace.push(item);
      params.context.steps[step.id] = item;
      continue;
    }

    if (step.type === "condition") {
      const passed = evaluateWorkflowCondition(step.condition, params.context);
      const branch = passed ? step.then || [] : step.else || [];

      const item = {
        workflowStepId: step.id,
        stepIndex: params.trace.length + 1,
        type: "condition",
        result: {
          ok: true,
          toolName: "workflow_condition",
          status: "completed",
          output: { passed, branch: passed ? "then" : "else", condition: step.condition },
        },
      };

      params.trace.push(item);
      params.context.steps[step.id] = item;

      if (branch.length) {
        await executeWorkflowSteps({
          ...params,
          steps: branch,
        });
      }

      continue;
    }

    if (step.type === "verification") {
      const verification = verifyRioMindAgentTrace({
        goal: String(params.context.workflow?.description || params.context.workflow?.name || "Workflow verification"),
        trace: params.trace,
      });

      const item = {
        workflowStepId: step.id,
        stepIndex: params.trace.length + 1,
        type: "verification",
        result: verification,
      };

      params.trace.push(item);
      params.context.steps[step.id] = item;
    }
  }
}

export async function runRioMindWorkflow(input: RioMindWorkflowRunInput) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const definition = await loadWorkflowDefinition(input);
  const aiLayer = normalizeAiLayer(input.aiLayer || definition.aiLayer);
  const surface = input.surface || definition.surface || "nexus";

  const workflowRow = await db.query(
    `INSERT INTO riomind_workflows (name, ai_layer, definition, enabled)
     VALUES ($1,$2,$3,true)
     ON CONFLICT (name) DO UPDATE SET
       ai_layer = EXCLUDED.ai_layer,
       definition = EXCLUDED.definition,
       enabled = true
     RETURNING *`,
    [definition.name, aiLayer, JSON.stringify(definition)]
  );

  const runRow = await db.query(
    `INSERT INTO riomind_workflow_runs
     (workflow_id, status, input, output)
     VALUES ($1,'running',$2,$3)
     RETURNING *`,
    [workflowRow.rows[0].id, JSON.stringify(input.input || {}), JSON.stringify({})]
  );

  const workflowRun = runRow.rows[0];

  await linkWorkflowRunToKnowledgeGraph({
    aiLayer,
    workflowName: definition.name,
    workflowRunId: workflowRun.id,
    status: "running",
    surface,
    metadata: { description: definition.description || "" },
  }).catch(() => null);

  const trace: any[] = [];
  const context: WorkflowVariableContext = {
    input: input.input || {},
    steps: {},
    workflow: {
      name: definition.name,
      description: definition.description || "",
      aiLayer,
      surface,
    },
  };

  await executeWorkflowSteps({
    steps: definition.steps,
    context,
    trace,
    aiLayer,
    surface,
    userId: input.userId || "local-user",
  });

  const verificationStep = [...trace].reverse().find((item) => item.type === "verification");
  const verification =
    verificationStep?.result?.status
      ? verificationStep.result
      : verifyRioMindAgentTrace({
          goal: definition.description || definition.name,
          trace,
        });

  const finalStatus =
    verification.status === "verified"
      ? "completed"
      : verification.status === "partially_verified"
        ? "completed_with_errors"
        : "needs_review";

  const output = {
    workflow: {
      name: definition.name,
      description: definition.description || "",
      aiLayer,
      surface,
    },
    trace,
    verification,
    finalAnswer: verification.summary,
  };

  const updated = await db.query(
    `UPDATE riomind_workflow_runs
     SET status = $2, output = $3
     WHERE id = $1
     RETURNING *`,
    [workflowRun.id, finalStatus, JSON.stringify(output)]
  );

  await linkWorkflowRunToKnowledgeGraph({
    aiLayer,
    workflowName: definition.name,
    workflowRunId: workflowRun.id,
    status: finalStatus,
    surface,
    metadata: {
      verificationStatus: verification.status,
      verificationConfidence: verification.confidence,
    },
  }).catch(() => null);

  await db.query(
    `INSERT INTO riomind_reasoning_logs
     (run_id, ai_layer, summary, metadata)
     VALUES ($1,$2,$3,$4)`,
    [
      null,
      aiLayer,
      verification.summary,
      JSON.stringify({
        workflowRunId: workflowRun.id,
        workflowName: definition.name,
        verificationStatus: verification.status,
        confidence: verification.confidence,
      }),
    ]
  );

  return {
    ok: finalStatus === "completed",
    workflowRun: updated.rows[0],
    ...output,
  };
}
