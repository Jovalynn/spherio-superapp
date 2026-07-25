import { resolveWorkflowValue, type WorkflowVariableContext } from "./workflow-variables";

export type WorkflowCondition = {
  left: unknown;
  op?: "exists" | "equals" | "not_equals" | "contains" | "gt" | "gte" | "lt" | "lte";
  right?: unknown;
};

export function evaluateWorkflowCondition(condition: WorkflowCondition, context: WorkflowVariableContext) {
  const op = condition.op || "exists";
  const left = resolveWorkflowValue(condition.left, context);
  const right = resolveWorkflowValue(condition.right, context);

  if (op === "exists") return left !== undefined && left !== null && left !== "";
  if (op === "equals") return left === right;
  if (op === "not_equals") return left !== right;
  if (op === "contains") return String(left ?? "").includes(String(right ?? ""));
  if (op === "gt") return Number(left) > Number(right);
  if (op === "gte") return Number(left) >= Number(right);
  if (op === "lt") return Number(left) < Number(right);
  if (op === "lte") return Number(left) <= Number(right);

  return false;
}
