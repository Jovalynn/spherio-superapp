"use client";

import ClientOnly from "@/components/ClientOnly";
import { fmtCompact } from "@/lib/format";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import ChartBox from "./ChartBox";

export default function MonetaryHistoryChart({ data }: { data: any[] }) {
  const rows = Array.isArray(data) ? data : [];

  return (
    <ChartBox height={288} className="rounded-xl">
      <div className="h-full w-full min-w-0">
        <ClientOnly
          fallback={
            <div className="h-full w-full rounded-xl border border-slate-800 bg-slate-950/40" />
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="height" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => fmtCompact(Number(v))} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="circulating" dot={false} />
              <Line type="monotone" dataKey="bonded" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </ChartBox>
  );
}
