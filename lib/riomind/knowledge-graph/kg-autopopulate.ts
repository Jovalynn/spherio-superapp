import { upsertRioMindKgEdge, upsertRioMindKgNode } from "./kg-engine";
import { normalizeAiLayer } from "../ai-foundation/db";

export async function linkAgentRunToKnowledgeGraph(input: {
  aiLayer?: unknown;
  runId: string;
  goal: string;
  surface?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const runNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "agent_run",
    nodeKey: input.runId,
    title: `Agent Run: ${input.goal.slice(0, 80)}`,
    description: input.goal,
    metadata: {
      surface: input.surface || "nexus",
      status: input.status || "unknown",
      ...(input.metadata || {}),
    },
  });

  const surfaceNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "surface",
    nodeKey: input.surface || "nexus",
    title: input.surface || "nexus",
    description: "RioMind execution surface.",
  });

  await upsertRioMindKgEdge({
    aiLayer,
    fromNodeId: surfaceNode.id,
    toNodeId: runNode.id,
    relation: "has_agent_run",
    confidence: 1,
  });

  return runNode;
}

export async function linkToolCallToKnowledgeGraph(input: {
  aiLayer?: unknown;
  runId?: string | null;
  toolName: string;
  status?: string;
  callId?: string;
  metadata?: Record<string, unknown>;
}) {
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const toolNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "tool",
    nodeKey: input.toolName,
    title: input.toolName,
    description: "RioMind executable tool.",
    metadata: {
      status: input.status || "unknown",
      ...(input.metadata || {}),
    },
  });

  if (input.callId) {
    const callNode = await upsertRioMindKgNode({
      aiLayer,
      nodeType: "tool_call",
      nodeKey: input.callId,
      title: `Tool Call: ${input.toolName}`,
      description: `Execution call for ${input.toolName}`,
      metadata: {
        runId: input.runId || null,
        status: input.status || "unknown",
      },
    });

    await upsertRioMindKgEdge({
      aiLayer,
      fromNodeId: callNode.id,
      toNodeId: toolNode.id,
      relation: "called_tool",
      confidence: 1,
    });

    if (input.runId) {
      const runNode = await upsertRioMindKgNode({
        aiLayer,
        nodeType: "agent_run",
        nodeKey: input.runId,
        title: `Agent Run ${input.runId}`,
        description: "RioMind agent run.",
      });

      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: runNode.id,
        toNodeId: callNode.id,
        relation: "has_tool_call",
        confidence: 1,
      });

      await upsertRioMindKgEdge({
        aiLayer,
        fromNodeId: runNode.id,
        toNodeId: toolNode.id,
        relation: "uses_tool",
        confidence: 1,
      });
    }
  }

  return toolNode;
}

export async function linkWorkflowRunToKnowledgeGraph(input: {
  aiLayer?: unknown;
  workflowName: string;
  workflowRunId: string;
  status?: string;
  surface?: string;
  metadata?: Record<string, unknown>;
}) {
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const workflowNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "workflow",
    nodeKey: input.workflowName,
    title: input.workflowName,
    description: "RioMind workflow.",
    metadata: input.metadata || {},
  });

  const runNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "workflow_run",
    nodeKey: input.workflowRunId,
    title: `Workflow Run: ${input.workflowName}`,
    description: `Run of workflow ${input.workflowName}`,
    metadata: {
      status: input.status || "unknown",
      surface: input.surface || "nexus",
    },
  });

  await upsertRioMindKgEdge({
    aiLayer,
    fromNodeId: workflowNode.id,
    toNodeId: runNode.id,
    relation: "has_workflow_run",
    confidence: 1,
  });

  return runNode;
}

export async function linkMemoryToKnowledgeGraph(input: {
  aiLayer?: unknown;
  surface?: string;
  memoryId: string;
  memoryType?: string;
  key: string;
  value?: string;
}) {
  const aiLayer = normalizeAiLayer(input.aiLayer);

  const memoryNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "memory",
    nodeKey: input.memoryId,
    title: `${input.memoryType || "memory"}:${input.key}`,
    description: input.value || "",
    metadata: {
      surface: input.surface || "nexus",
      memoryType: input.memoryType || "project",
      key: input.key,
    },
  });

  const surfaceNode = await upsertRioMindKgNode({
    aiLayer,
    nodeType: "surface",
    nodeKey: input.surface || "nexus",
    title: input.surface || "nexus",
    description: "RioMind memory surface.",
  });

  await upsertRioMindKgEdge({
    aiLayer,
    fromNodeId: surfaceNode.id,
    toNodeId: memoryNode.id,
    relation: "has_memory",
    confidence: 1,
  });

  return memoryNode;
}
