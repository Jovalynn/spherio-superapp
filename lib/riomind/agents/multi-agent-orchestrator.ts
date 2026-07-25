import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "../ai-foundation/db";
import { runRioMindAgentWithTools, type RioMindAgentToolStepInput } from "./agent-tool-executor";
import { verifyRioMindAgentTrace } from "./verification-loop";

export type RioMindSpecialistAgentInput = {
  id: string;
  name?: string;
  role?: string;
  goal: string;
  tools: RioMindAgentToolStepInput[];
};

export type RioMindMultiAgentInput = {
  aiLayer?: unknown;
  surface?: string;
  userId?: string;
  goal: string;
  agents: RioMindSpecialistAgentInput[];
  metadata?: Record<string, unknown>;
};

function defaultAgentsForGoal(goal: string): RioMindSpecialistAgentInput[] {
  const lower = goal.toLowerCase();

  if (lower.includes("coreai") || lower.includes("chain") || lower.includes("spherio")) {
    return [
      {
        id: "chain_health_agent",
        name: "Chain Health Agent",
        role: "Checks SpherioChain/CoreAI service health.",
        goal: "Verify SpherioChain indexer health.",
        tools: [{ toolName: "rio_indexer_health", input: {} }],
      },
      {
        id: "usage_agent",
        name: "Nexus Usage Agent",
        role: "Checks RioMind Nexus usage and runtime activity.",
        goal: "Inspect RioMind Nexus usage summary.",
        tools: [{ toolName: "riomind_usage_summary", input: {} }],
      },
    ];
  }

  return [
    {
      id: "nexus_usage_agent",
      name: "Nexus Usage Agent",
      role: "Checks RioMind Nexus usage and runtime activity.",
      goal: "Inspect RioMind Nexus usage summary.",
      tools: [{ toolName: "riomind_usage_summary", input: {} }],
    },
  ];
}

function summarizeAgentRuns(goal: string, specialistResults: any[], verification: any) {
  const lines = [
    "## Multi-Agent Orchestration Report",
    "",
    `Goal: ${goal}`,
    "",
    "## Supervisor Result",
    `- Status: ${verification.status}`,
    `- Confidence: ${verification.confidence.toFixed(2)}`,
    `- Specialist agents: ${specialistResults.length}`,
    `- Successful agents: ${specialistResults.filter((item) => item.ok).length}`,
    `- Agents with issues: ${specialistResults.filter((item) => !item.ok).length}`,
    "",
    "## Specialist Agent Results",
  ];

  for (const item of specialistResults) {
    lines.push(`### ${item.agent.name || item.agent.id}`);
    lines.push(`- Role: ${item.agent.role || "Specialist agent"}`);
    lines.push(`- Status: ${item.result?.run?.status || "unknown"}`);
    lines.push(`- Verification: ${item.result?.verification?.status || "unknown"}`);
    lines.push(`- Confidence: ${typeof item.result?.verification?.confidence === "number" ? item.result.verification.confidence.toFixed(2) : "n/a"}`);
    lines.push("");
  }

  lines.push("## Final Verification");
  lines.push(verification.summary || "No verification summary was produced.");

  return lines.join("\n").trim();
}

export async function orchestrateRioMindAgents(input: RioMindMultiAgentInput) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const surface = input.surface || "nexus";
  const userId = input.userId || "local-user";
  const agents = input.agents?.length ? input.agents : defaultAgentsForGoal(input.goal);

  const supervisorRun = await db.query(
    `INSERT INTO riomind_agent_runs
     (ai_layer, surface, user_id, goal, status, plan, metadata)
     VALUES ($1,$2,$3,$4,'running',$5,$6)
     RETURNING *`,
    [
      aiLayer,
      surface,
      userId,
      input.goal,
      JSON.stringify(
        agents.map((agent, index) => ({
          step: index + 1,
          agentId: agent.id,
          name: agent.name || agent.id,
          role: agent.role || "specialist",
          goal: agent.goal,
          tools: agent.tools,
        }))
      ),
      JSON.stringify({
        ...(input.metadata || {}),
        runtime: "multi_agent_orchestrator",
        agentCount: agents.length,
      }),
    ]
  );

  const specialistResults = [];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];

    await db.query(
      `INSERT INTO riomind_agent_steps
       (run_id, step_index, kind, status, input, output)
       VALUES ($1,$2,'specialist_agent','running',$3,$4)`,
      [
        supervisorRun.rows[0].id,
        i + 1,
        JSON.stringify({ agent }),
        JSON.stringify({}),
      ]
    );

    const result = await runRioMindAgentWithTools({
      aiLayer,
      surface,
      userId,
      goal: agent.goal,
      tools: agent.tools,
      metadata: {
        supervisorRunId: supervisorRun.rows[0].id,
        specialistAgentId: agent.id,
        specialistAgentName: agent.name || agent.id,
        specialistRole: agent.role || "specialist",
      },
    });

    await db.query(
      `UPDATE riomind_agent_steps
       SET status = $3, output = $4, error = $5
       WHERE run_id = $1 AND step_index = $2 AND kind = 'specialist_agent'
       RETURNING *`,
      [
        supervisorRun.rows[0].id,
        i + 1,
        result.ok ? "completed" : "completed_with_errors",
        JSON.stringify({
          agentId: agent.id,
          specialistRunId: result.run?.id,
          specialistStatus: result.run?.status,
          verification: result.verification,
          finalAnswer: result.finalAnswer,
        }),
        result.ok ? null : "specialist_agent_not_fully_verified",
      ]
    );

    specialistResults.push({
      agent,
      ok: result.ok,
      result,
    });
  }

  const supervisorTrace = specialistResults.map((item) => ({
    result: {
      ok: item.ok,
      toolName: item.agent.id,
      status: item.result?.run?.status || "unknown",
      output: {
        specialistRunId: item.result?.run?.id,
        verificationStatus: item.result?.verification?.status,
        confidence: item.result?.verification?.confidence,
      },
      error: item.ok ? undefined : "specialist_agent_not_fully_verified",
    },
  }));

  const supervisorVerification = verifyRioMindAgentTrace({
    goal: input.goal,
    trace: supervisorTrace,
  });

  await db.query(
    `INSERT INTO riomind_agent_steps
     (run_id, step_index, kind, status, input, output)
     VALUES ($1,$2,'supervisor_verification',$3,$4,$5)`,
    [
      supervisorRun.rows[0].id,
      agents.length + 1,
      supervisorVerification.status,
      JSON.stringify({ goal: input.goal, specialistCount: agents.length }),
      JSON.stringify(supervisorVerification),
    ]
  );

  const finalStatus =
    supervisorVerification.status === "verified"
      ? "completed"
      : supervisorVerification.status === "partially_verified"
        ? "completed_with_errors"
        : "needs_review";

  const finalAnswer = summarizeAgentRuns(input.goal, specialistResults, supervisorVerification);

  await db.query(
    `INSERT INTO riomind_reasoning_logs
     (run_id, ai_layer, summary, metadata)
     VALUES ($1,$2,$3,$4)`,
    [
      supervisorRun.rows[0].id,
      aiLayer,
      finalAnswer,
      JSON.stringify({
        runtime: "multi_agent_orchestrator",
        verificationStatus: supervisorVerification.status,
        confidence: supervisorVerification.confidence,
        agentCount: agents.length,
      }),
    ]
  );

  const updatedSupervisorRun = await db.query(
    `UPDATE riomind_agent_runs
     SET status = $2, updated_at = now(), metadata = metadata || $3::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      supervisorRun.rows[0].id,
      finalStatus,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        verificationStatus: supervisorVerification.status,
        verificationConfidence: supervisorVerification.confidence,
        specialistAgents: agents.length,
        successfulAgents: specialistResults.filter((item) => item.ok).length,
        failedAgents: specialistResults.filter((item) => !item.ok).length,
      }),
    ]
  );

  return {
    ok: finalStatus === "completed",
    supervisorRun: updatedSupervisorRun.rows[0],
    agents: specialistResults,
    verification: supervisorVerification,
    finalAnswer,
  };
}
