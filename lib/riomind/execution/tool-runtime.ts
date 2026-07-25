import { RIOMIND_TOOL_REGISTRY } from "@/lib/riomind/tools/registry";

export type RioMindToolExecutionPlan = {
  requestedTools: string[];
  availableTools: string[];
  missingTools: string[];
  status: "ready_for_contract" | "missing_registered_tools";
};

export function createToolExecutionPlan(requestedTools: string[]): RioMindToolExecutionPlan {
  const availableTools = requestedTools.filter((tool) =>
    RIOMIND_TOOL_REGISTRY.includes(tool)
  );

  const missingTools = requestedTools.filter((tool) =>
    !RIOMIND_TOOL_REGISTRY.includes(tool)
  );

  return {
    requestedTools,
    availableTools,
    missingTools,
    status: missingTools.length === 0 ? "ready_for_contract" : "missing_registered_tools",
  };
}
