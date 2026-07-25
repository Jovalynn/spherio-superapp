"use client";

import { useMemo, useState } from "react";

function shortValue(value: string, left = 12, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

export default function CopyableValue({
  value,
  left = 12,
  right = 10,
  mono = true,
  label = "Copy",
}: {
  value?: string | null;
  left?: number;
  right?: number;
  mono?: boolean;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const normalized = useMemo(() => String(value || "").trim(), [value]);

  if (!normalized) return <span className="text-white/35">—</span>;

  async function copy() {
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${label}: ${normalized}`}
      className={[
        "group inline-flex max-w-full items-center gap-2 rounded-[10px]",
        "border border-white/10 bg-white/[0.035] px-2.5 py-1.5",
        "text-left text-xs text-white/78 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100",
        mono ? "font-mono" : "",
      ].join(" ")}
    >
      <span className="truncate">{shortValue(normalized, left, right)}</span>
      <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/45 group-hover:text-cyan-100">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
