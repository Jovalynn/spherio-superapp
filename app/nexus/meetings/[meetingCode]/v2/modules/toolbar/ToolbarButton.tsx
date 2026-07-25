"use client";

import React from "react";

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ToolbarButton({
  icon,
  label,
  active = false,
  onClick,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5
      ${
        active
          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
          : "border-white/10 bg-[#050b12]/[0.04]"
      } ${className}`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
