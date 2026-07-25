export type WorkflowVariableContext = {
  input: Record<string, unknown>;
  steps: Record<string, unknown>;
  workflow?: Record<string, unknown>;
};

function getPath(source: any, path: string) {
  return path.split(".").reduce((value, key) => {
    if (value == null) return undefined;
    return value[key];
  }, source);
}

export function resolveWorkflowValue(value: unknown, context: WorkflowVariableContext): unknown {
  if (typeof value === "string") {
    const exact = value.match(/^\$\{([^}]+)\}$/);
    if (exact) return getPath(context, exact[1].trim());

    return value.replace(/\$\{([^}]+)\}/g, (_, rawPath) => {
      const found = getPath(context, String(rawPath).trim());
      if (found == null) return "";
      return typeof found === "string" ? found : JSON.stringify(found);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveWorkflowValue(item, context));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        resolveWorkflowValue(val, context),
      ])
    );
  }

  return value;
}
