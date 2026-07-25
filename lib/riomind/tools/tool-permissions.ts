import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool } from "../ai-foundation/db";
import { recordRioMindGuardrailEvent } from "../guardrails/permission-layer";
import { evaluateRioMindPermission } from "../guardrails/policy-engine";

export type RioMindToolPermissionInput = {
  toolName: string;
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  surface?: string;
  ownerUserId?: string;
};

export async function checkRioMindToolPermission(input: RioMindToolPermissionInput) {
  await ensureRioMindAiFoundationSchema();

  const db = getRioMindAiFoundationPool();
  const tool = await db.query(
    `SELECT * FROM riomind_tools WHERE name = $1 LIMIT 1`,
    [input.toolName]
  );

  if (!tool.rowCount) {
    await recordRioMindGuardrailEvent({
      aiLayer: input.aiLayer || "shared",
      surface: input.surface || "nexus",
      eventType: "tool_not_registered",
      severity: "warning",
      allowed: false,
      reason: `Tool is not registered: ${input.toolName}`,
      metadata: { toolName: input.toolName },
    });

    return {
      allowed: false,
      reason: "tool_not_registered",
      tool: null,
    };
  }

  const row = tool.rows[0];

  if (!row.enabled) {
    await recordRioMindGuardrailEvent({
      aiLayer: input.aiLayer || row.ai_layer || "shared",
      surface: input.surface || "nexus",
      eventType: "tool_disabled",
      severity: "warning",
      allowed: false,
      reason: `Tool is disabled: ${input.toolName}`,
      metadata: { toolName: input.toolName },
    });

    return {
      allowed: false,
      reason: "tool_disabled",
      tool: row,
    };
  }

  const centralDecision = await evaluateRioMindPermission({
    aiLayer: input.aiLayer || row.ai_layer || "shared",
    surface: input.surface || "nexus",
    ownerUserId: input.ownerUserId || "local-user",
    action: "tool:read",
    resource: input.toolName,
    role: "local-owner",
    metadata: {
      permissionScope: row.permission_scope || "read",
      toolName: input.toolName,
    },
  });

  if (!centralDecision.allowed) {
    return {
      allowed: false,
      reason: centralDecision.reason,
      tool: row,
    };
  }

  const safeScopes = new Set(["read", "readonly", "inspect", "public_read"]);
  const scope = String(row.permission_scope || "read").toLowerCase();

  if (!safeScopes.has(scope)) {
    await recordRioMindGuardrailEvent({
      aiLayer: input.aiLayer || row.ai_layer || "shared",
      surface: input.surface || "nexus",
      eventType: "tool_permission_scope_blocked",
      severity: "warning",
      allowed: false,
      reason: `Tool permission scope is not allowed in Phase 1: ${scope}`,
      metadata: { toolName: input.toolName, permissionScope: scope },
    });

    return {
      allowed: false,
      reason: "permission_scope_blocked",
      tool: row,
    };
  }

  await recordRioMindGuardrailEvent({
    aiLayer: input.aiLayer || row.ai_layer || "shared",
    surface: input.surface || "nexus",
    eventType: "tool_permission_allowed",
    severity: "info",
    allowed: true,
    reason: `Tool permission allowed: ${input.toolName}`,
    metadata: { toolName: input.toolName, permissionScope: scope },
  });

  return {
    allowed: true,
    reason: "allowed",
    tool: row,
  };
}
