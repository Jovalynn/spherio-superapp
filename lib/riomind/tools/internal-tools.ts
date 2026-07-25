export type RioMindToolExecutionInput = {
  runId?: string | null;
  toolName: string;
  input?: Record<string, unknown>;
  ownerUserId?: string;
  aiLayer?: "core_ai" | "nexus_ai" | "shared";
  surface?: string;
};

export type RioMindToolExecutionResult = {
  ok: boolean;
  toolName: string;
  output?: Record<string, unknown>;
  error?: string;
  status: "completed" | "failed" | "permission_denied" | "not_found";
};

async function fetchJson(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    let json: unknown = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    return {
      ok: res.ok,
      status: res.status,
      url,
      data: json,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeInternalRioMindTool(input: RioMindToolExecutionInput): Promise<RioMindToolExecutionResult> {
  const toolName = String(input.toolName || "").trim();

  if (toolName === "rio_indexer_health") {
    try {
      const output = await fetchJson(process.env.RIOMIND_INDEXER_HEALTH_URL || "http://indexer:4000/health");
      return {
        ok: output.ok,
        toolName,
        output,
        status: output.ok ? "completed" : "failed",
      };
    } catch (error) {
      return {
        ok: false,
        toolName,
        error: error instanceof Error ? error.message : "Unknown indexer health error",
        status: "failed",
      };
    }
  }

  if (toolName === "riomind_usage_summary") {
    try {
      const baseUrl = process.env.RIOMIND_INTERNAL_BASE_URL || "http://localhost:3000";
      const output = await fetchJson(`${baseUrl}/api/riomind/usage/summary`);
      return {
        ok: output.ok,
        toolName,
        output,
        status: output.ok ? "completed" : "failed",
      };
    } catch (error) {
      return {
        ok: false,
        toolName,
        error: error instanceof Error ? error.message : "Unknown usage summary error",
        status: "failed",
      };
    }
  }

  return {
    ok: false,
    toolName,
    error: `Tool not implemented: ${toolName}`,
    status: "not_found",
  };
}
