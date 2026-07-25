import { recordRioMindGuardrailEvent } from "./permission-layer";
import { normalizeAiLayer } from "../ai-foundation/db";

export type RioMindPermissionAction =
  | "tool:read"
  | "tool:write"
  | "workflow:run"
  | "agent:execute"
  | "agent:orchestrate"
  | "meeting:read"
  | "meeting:write"
  | "memory:read"
  | "memory:write"
  | "kg:read"
  | "kg:write";

export type RioMindPermissionDecision = {
  allowed: boolean;
  action: RioMindPermissionAction;
  reason: string;
  severity: "info" | "warning" | "critical";
  requiresApproval: boolean;
  metadata: Record<string, unknown>;
};

const READ_ONLY_ACTIONS = new Set<RioMindPermissionAction>([
  "tool:read",
  "workflow:run",
  "agent:execute",
  "agent:orchestrate",
  "meeting:read",
  "memory:read",
  "memory:write",
  "kg:read",
  "kg:write",
]);

const BLOCKED_TOOL_PATTERNS = [
  /delete/i,
  /drop/i,
  /truncate/i,
  /transfer/i,
  /send[_-]?funds/i,
  /private[_-]?key/i,
  /seed[_-]?phrase/i,
  /wallet[_-]?sign/i,
  /sudo/i,
  /shell/i,
  /exec/i,
];

export async function evaluateRioMindPermission(input: {
  aiLayer?: unknown;
  surface?: string;
  ownerUserId?: string;
  action: RioMindPermissionAction;
  resource?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}): Promise<RioMindPermissionDecision> {
  const aiLayer = normalizeAiLayer(input.aiLayer);
  const surface = input.surface || "nexus";
  const role = String(input.role || "local-owner").toLowerCase();
  const resource = String(input.resource || "");

  let decision: RioMindPermissionDecision = {
    allowed: true,
    action: input.action,
    reason: "allowed",
    severity: "info",
    requiresApproval: false,
    metadata: {
      aiLayer,
      surface,
      ownerUserId: input.ownerUserId || "local-user",
      role,
      resource,
      ...(input.metadata || {}),
    },
  };

  if (!READ_ONLY_ACTIONS.has(input.action)) {
    decision = {
      ...decision,
      allowed: false,
      reason: "action_not_allowed_in_current_guardrail_phase",
      severity: "warning",
      requiresApproval: true,
    };
  }

  if (input.action.startsWith("tool:") && BLOCKED_TOOL_PATTERNS.some((pattern) => pattern.test(resource))) {
    decision = {
      ...decision,
      allowed: false,
      reason: "tool_matches_blocked_pattern",
      severity: "critical",
      requiresApproval: true,
    };
  }

  if (role === "viewer" && !input.action.endsWith(":read")) {
    decision = {
      ...decision,
      allowed: false,
      reason: "viewer_role_is_read_only",
      severity: "warning",
      requiresApproval: true,
    };
  }

  await recordRioMindGuardrailEvent({
    aiLayer,
    surface,
    eventType: decision.allowed ? "permission_allowed" : "permission_blocked",
    severity: decision.severity,
    allowed: decision.allowed,
    reason: decision.reason,
    metadata: decision.metadata,
  }).catch(() => null);

  return decision;
}
