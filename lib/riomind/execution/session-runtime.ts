import { RIOMIND_MEMORY_REGISTRY } from "@/lib/riomind/memory/registry";

export type RioMindSessionExecutionPlan = {
  requestedMemory: string[];
  availableMemory: string[];
  status: "memory_connection_pending";
};

export function createSessionExecutionPlan(
  requestedMemory = ["session", "workspace", "project"]
): RioMindSessionExecutionPlan {
  return {
    requestedMemory,
    availableMemory: requestedMemory.filter((memory) =>
      RIOMIND_MEMORY_REGISTRY.includes(memory)
    ),
    status: "memory_connection_pending",
  };
}
