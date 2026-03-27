"use client";

import * as React from "react";

type Props = {
  height?: number;
  minHeight?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Deterministic chart container:
 * - forces a real height at build/runtime
 * - prevents Recharts width/height -1 warnings
 */
export default function ChartBox({
  height = 260,
  minHeight,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        height,
        minHeight: minHeight ?? height,
      }}
    >
      {children}
    </div>
  );
}
