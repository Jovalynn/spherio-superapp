"use client";

import { useMemo } from "react";

export default function MiniTrendChart({ data }: { data?: Array<any> }) {
  const points = useMemo(() => {
    const values = (data || []).map((d) => Number(d.value || 0));
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    return values
      .map((value, index) => {
        const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
        const y = 80 - ((value - min) / span) * 60;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full overflow-visible">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" className="text-cyan-300" />
    </svg>
  );
}
