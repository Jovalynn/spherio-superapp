export type RioMindWorkflowStep =
  | {
      id: string;
      type: "tool";
      toolName: string;
      input?: Record<string, unknown>;
    }
  | {
      id: string;
      type: "verification";
      input?: Record<string, unknown>;
    }
  | {
      id: string;
      type: "condition";
      condition: {
        left: unknown;
        op?: "exists" | "equals" | "not_equals" | "contains" | "gt" | "gte" | "lt" | "lte";
        right?: unknown;
      };
      then?: RioMindWorkflowStep[];
      else?: RioMindWorkflowStep[];
    }
  | {
      id: string;
      type: "memory_write";
      key: string;
      value: unknown;
      memoryType?: string;
    };

export type RioMindWorkflowDefinition = {
  name: string;
  description?: string;
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  surface?: string;
  steps: RioMindWorkflowStep[];
};

export type RioMindWorkflowRunInput = {
  workflowName?: string;
  definition?: RioMindWorkflowDefinition;
  aiLayer?: unknown;
  surface?: string;
  userId?: string;
  input?: Record<string, unknown>;
};
