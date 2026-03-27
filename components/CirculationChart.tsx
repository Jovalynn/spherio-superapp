"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function CirculationChart({
  circulating,
  locked
}: {
  circulating: number;
  locked: number;
}) {

  const data = [
    { name: "Circulating", value: circulating },
    { name: "Locked", value: locked },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl">
      <h2 className="mb-6 text-lg">Circulation vs Locked</h2>

      <PieChart width={350} height={350}>
        <Pie
          data={data}
          dataKey="value"
          outerRadius={120}
        >
          <Cell fill="#22c55e" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
