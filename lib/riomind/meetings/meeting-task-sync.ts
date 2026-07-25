import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";
import { queryRioMindKg, upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

function cleanTitle(value: string) {
  return String(value || "")
    .replace(/^(Action Item|Decision|Task):\s*/i, "")
    .trim();
}

function slugify(value: string) {
  return cleanTitle(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "task";
}

export async function syncMeetingActionItemsToWorkflowTasks(input: {
  meetingCode: string;
  aiLayer?: "nexus_ai" | "core_ai" | "shared";
  surface?: string;
}) {
  await ensureRioMindAiFoundationSchema();
  const db = getRioMindAiFoundationPool();

  const aiLayer = input.aiLayer || "nexus_ai";
  const surface = input.surface || "nexus_teams";

  const graph = await queryRioMindKg({
    aiLayer,
    nodeKey: input.meetingCode,
    limit: 200,
  });

  const actionEdges = (graph.edges || []).filter((edge: any) => edge.relation === "has_action_item");

  const synced = [];

  for (const edge of actionEdges) {
    const actionText = cleanTitle(edge.to_title || "");
    if (!actionText) continue;

    const taskKey = `${input.meetingCode}:task:${slugify(actionText)}`;

    const workflowDefinition = {
      source: "meeting_action_item",
      meetingCode: input.meetingCode,
      actionText,
      steps: [
        {
          id: "review_action_item",
          type: "manual",
          title: "Review meeting action item",
          input: { actionText },
        },
        {
          id: "execute_action_item",
          type: "agent_or_human",
          title: "Execute action item",
          input: { actionText },
        },
      ],
    };

    const workflow = await db.query(
      `INSERT INTO riomind_workflows
       (name, ai_layer, definition, enabled)
       VALUES ($1,$2,$3,true)
       ON CONFLICT (name) DO UPDATE SET
         definition = EXCLUDED.definition,
         enabled = true
       RETURNING *`,
      [
        taskKey,
        aiLayer,
        JSON.stringify({
          ...workflowDefinition,
          description: actionText,
          surface,
          metadata: {
            meetingCode: input.meetingCode,
            source: "meeting_action_item",
            actionNodeKey: edge.to_key,
            syncedAt: new Date().toISOString(),
          },
        }),
      ]
    );

    const workflowRun = await db.query(
      `INSERT INTO riomind_workflow_runs
       (workflow_id, status, input, output)
       VALUES ($1,'created',$2,$3)
       RETURNING *`,
      [
        workflow.rows[0].id,
        JSON.stringify({
          meetingCode: input.meetingCode,
          actionText,
          source: "meeting_action_item_sync",
          actionNodeKey: edge.to_key,
        }),
        JSON.stringify({}),
      ]
    );

    const meetingNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "meeting",
      nodeKey: input.meetingCode,
      title: `Meeting ${input.meetingCode}`,
      description: "Nexus Teams meeting.",
    });

    const taskNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "meeting_task",
      nodeKey: taskKey,
      title: `Task: ${actionText.slice(0, 90)}`,
      description: actionText,
      metadata: {
        workflowId: workflow.rows[0].id,
        workflowRunId: workflowRun.rows[0].id,
        meetingCode: input.meetingCode,
        actionNodeKey: edge.to_key,
      },
    });

    await upsertRioMindKgEdge({
      aiLayer,
      fromNodeId: meetingNode.id,
      toNodeId: taskNode.id,
      relation: "has_task",
      confidence: 1,
    });

    synced.push({
      actionText,
      taskKey,
      workflow: workflow.rows[0],
      workflowRun: workflowRun.rows[0],
      taskNode,
    });
  }

  return {
    ok: true,
    meetingCode: input.meetingCode,
    syncedCount: synced.length,
    synced,
  };
}
