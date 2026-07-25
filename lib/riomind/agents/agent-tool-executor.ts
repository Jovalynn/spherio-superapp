import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { createRioMindAgentRun } from "./agent-runtime";
import { runRioMindTool } from "../tools/tool-runtime";
import { linkAgentRunToKnowledgeGraph } from "../knowledge-graph/kg-autopopulate";
import { verifyRioMindAgentTrace } from "./verification-loop";

export type RioMindAgentToolStepInput = {
  toolName: string;
  tool_name?: string;
  name?: string;
  input?: Record<string, unknown>;
};



function normalizeToolStep(tool: any) {
  return {
    toolName: String(tool?.toolName || tool?.tool_name || tool?.name || tool?.id || "unknown_tool"),
    input: tool?.input || tool?.args || tool?.arguments || {},
  };
}


export type RunRioMindAgentWithToolsInput = {
  aiLayer?: unknown;
  surface?: string;
  userId?: string;
  goal: string;
  tools: RioMindAgentToolStepInput[];
  metadata?: Record<string, unknown>;
};

export async function runRioMindAgentWithTools(input: RunRioMindAgentWithToolsInput) {
  await ensureRioMindAiFoundationSchema();

  const aiLayer = normalizeAiLayer(input.aiLayer);
  const db = getRioMindAiFoundationPool();

  const plan = input.tools.map((tool, index) => {
    const normalizedTool = normalizeToolStep(tool);

    return {
      step: index + 1,
      kind: "tool",
      toolName: normalizedTool.toolName,
      input: normalizedTool.input,
    };
  });

  const run = await createRioMindAgentRun({
    aiLayer,
    surface: input.surface || "nexus",
    userId: input.userId || "local-user",
    goal: input.goal,
    plan,
    metadata: {
      ...(input.metadata || {}),
      runtime: "agent_tool_executor",
      toolCount: input.tools.length,
    },
  });

  await linkAgentRunToKnowledgeGraph({
    aiLayer,
    runId: run.id,
    goal: input.goal,
    surface: input.surface || "nexus",
    status: "running",
    metadata: input.metadata || {},
  }).catch(() => null);

  const trace = [];

  for (let i = 0; i < input.tools.length; i++) {
    const step = normalizeToolStep(input.tools[i]);

    const startedStep = await db.query(
      `INSERT INTO riomind_agent_steps
       (run_id, step_index, kind, status, input, output)
       VALUES ($1,$2,'tool','running',$3,$4)
       RETURNING *`,
      [
        run.id,
        i + 1,
        JSON.stringify({ toolName: step.toolName, input: step.input || {} }),
        JSON.stringify({}),
      ]
    );

    const toolResult = await runRioMindTool({
      runId: run.id,
      toolName: step.toolName,
      input: step.input || {},
      aiLayer,
      surface: input.surface || "nexus",
      ownerUserId: input.userId || "local-user",
    });

    const completedStep = await db.query(
      `UPDATE riomind_agent_steps
       SET status = $2, output = $3, error = $4
       WHERE id = $1
       RETURNING *`,
      [
        startedStep.rows[0].id,
        toolResult.ok ? "completed" : "failed",
        JSON.stringify(toolResult.result || {}),
        toolResult.ok ? null : toolResult.result?.error || "tool_failed",
      ]
    );

    trace.push({
      step: completedStep.rows[0],
      toolCall: toolResult.call,
      result: toolResult.result,
    });
  }

  const verification = verifyRioMindAgentTrace({
    goal: input.goal,
    trace,
  });

  await db.query(
    `INSERT INTO riomind_agent_steps
     (run_id, step_index, kind, status, input, output)
     VALUES ($1,$2,'verification',$3,$4,$5)`,
    [
      run.id,
      input.tools.length + 1,
      verification.status,
      JSON.stringify({ goal: input.goal, traceCount: trace.length }),
      JSON.stringify(verification),
    ]
  );

  await db.query(
    `INSERT INTO riomind_reasoning_logs
     (run_id, ai_layer, summary, metadata)
     VALUES ($1,$2,$3,$4)`,
    [
      run.id,
      aiLayer,
      verification.summary,
      JSON.stringify({
        verificationStatus: verification.status,
        confidence: verification.confidence,
        passed: verification.passed,
        failed: verification.failed,
      }),
    ]
  );

  const finalStatus =
    verification.status === "verified"
      ? "completed"
      : verification.status === "partially_verified"
        ? "completed_with_errors"
        : "needs_review";

  const updatedRun = await db.query(
    `UPDATE riomind_agent_runs
     SET status = $2, updated_at = now(), metadata = metadata || $3::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      run.id,
      finalStatus,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        traceCount: trace.length,
        successfulTools: verification.passed,
        failedTools: verification.failed,
        verificationStatus: verification.status,
        verificationConfidence: verification.confidence,
      }),
    ]
  );

  await linkAgentRunToKnowledgeGraph({
    aiLayer,
    runId: run.id,
    goal: input.goal,
    surface: input.surface || "nexus",
    status: finalStatus,
    metadata: {
      verificationStatus: verification.status,
      verificationConfidence: verification.confidence,
    },
  }).catch(() => null);

  return {
    ok: finalStatus === "completed",
    run: updatedRun.rows[0],
    trace,
    verification,
    finalAnswer: verification.summary,
  };
}
