import { NextResponse } from "next/server";
import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "@/lib/riomind/ai-foundation/db";
import { queryRioMindKg } from "@/lib/riomind/knowledge-graph/kg-engine";

export async function GET(
  _req: Request,
  context: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await context.params;

    await ensureRioMindAiFoundationSchema();
    const db = getRioMindAiFoundationPool();

    const workflows = await db.query(
      `SELECT id,name,ai_layer,definition,enabled,created_at
       FROM riomind_workflows
       WHERE name LIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [`${meetingCode}:task:%`]
    );

    const workflowIds = workflows.rows.map((row: any) => row.id);

    const runs = workflowIds.length
      ? await db.query(
          `SELECT id,workflow_id,status,input,output,created_at
           FROM riomind_workflow_runs
           WHERE workflow_id = ANY($1::uuid[])
           ORDER BY created_at DESC
           LIMIT 200`,
          [workflowIds]
        )
      : { rows: [] };

    const graph = await queryRioMindKg({
      aiLayer: "nexus_ai",
      nodeKey: meetingCode,
      limit: 200,
    });

    const taskEdges = (graph.edges || []).filter((edge: any) => edge.relation === "has_task");

    const tasks = workflows.rows.map((workflow: any) => {
      const workflowRuns = runs.rows.filter((run: any) => run.workflow_id === workflow.id);
      const definition = workflow.definition || {};
      const metadata = definition.metadata || {};
      const actionText = definition.actionText || definition.description || workflow.name;
      const taskNode = taskEdges.find((edge: any) => edge.to_key === workflow.name);

      return {
        id: workflow.id,
        taskKey: workflow.name,
        title: `Task: ${String(actionText).slice(0, 90)}`,
        actionText,
        aiLayer: workflow.ai_layer,
        enabled: workflow.enabled,
        status: workflowRuns[0]?.status || "created",
        workflow,
        workflowRuns,
        graphNode: taskNode || null,
        metadata,
        createdAt: workflow.created_at,
      };
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      meetingCode,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown meeting tasks error" },
      { status: 500 }
    );
  }
}
