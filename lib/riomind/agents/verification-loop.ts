export type RioMindVerificationInput = {
  goal: string;
  trace: Array<{
    result?: {
      ok?: boolean;
      toolName?: string;
      status?: string;
      output?: any;
      error?: string;
    };
  }>;
};

function stringifySafe(value: unknown, max = 1200) {
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}...[truncated]` : text;
  } catch {
    return String(value || "");
  }
}

export function verifyRioMindAgentTrace(input: RioMindVerificationInput) {
  const trace = Array.isArray(input.trace) ? input.trace : [];
  const total = trace.length;
  const passed = trace.filter((item: any) => {
    const result = item.result?.result || item.result || {};
    return Boolean(
      result.ok ||
      item.result?.ok ||
      item.toolCall?.status === "completed" ||
      item.step?.status === "completed"
    );
  }).length;
  const failed = total - passed;

  const observations = trace.map((item: any, index) => {
    const result = item.result?.result || item.result || {};
    const stepInput = typeof item.step?.input === "string"
      ? (() => {
          try { return JSON.parse(item.step.input); } catch { return {}; }
        })()
      : item.step?.input || {};

    return {
      step: index + 1,
      toolName:
        result.toolName ||
        result.tool_name ||
        item.toolCall?.tool_name ||
        item.toolCall?.toolName ||
        stepInput.toolName ||
        stepInput.tool_name ||
        "unknown_tool",
      ok: Boolean(result.ok || item.toolCall?.status === "completed" || item.step?.status === "completed"),
      status: result.status || item.toolCall?.status || item.step?.status || "unknown",
      error: result.error || item.toolCall?.error || item.step?.error || null,
      outputPreview: stringifySafe(result.output || item.result?.output || result, 900),
    };
  });

  const confidence =
    total === 0 ? 0 :
    failed === 0 ? 0.92 :
    passed > 0 ? 0.58 :
    0.18;

  const status =
    total === 0 ? "needs_review" :
    failed === 0 ? "verified" :
    passed > 0 ? "partially_verified" :
    "failed_verification";

  const summaryLines = [
    "## Verified Agent Summary",
    "",
    `Goal: ${input.goal}`,
    "",
    "## Verification Result",
    `- Status: ${status}`,
    `- Tools executed: ${total}`,
    `- Successful tools: ${passed}`,
    `- Failed tools: ${failed}`,
    `- Confidence: ${confidence.toFixed(2)}`,
    "",
    "## Observations",
    ...observations.flatMap((item) => [
      `### Step ${item.step}: ${item.toolName}`,
      `- Status: ${item.status}`,
      `- OK: ${item.ok ? "yes" : "no"}`,
      item.error ? `- Error: ${item.error}` : "- Error: none",
      item.outputPreview ? `- Output preview: ${item.outputPreview}` : "- Output preview: none",
      "",
    ]),
  ];

  return {
    status,
    confidence,
    passed,
    failed,
    observations,
    summary: summaryLines.join("\n").trim(),
  };
}
