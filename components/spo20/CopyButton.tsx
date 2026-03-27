"use client";

import { useState } from "react";

export default function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-xl border border-spherio-border bg-spherio-panel/60 px-3 py-1.5 text-xs font-semibold text-spherio-text hover:bg-spherio-panel/80"
      title={value}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
