"use client";

export default function StakingHeatmap({
  bonded,
  total,
}: {
  bonded: number;
  total: number;
}) {
  const percent = (bonded / total) * 100;

  return (
    <div className="space-y-2">
      <div className="bg-gray-700 h-4 rounded">
        <div
          className="bg-amber-500 h-4 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm opacity-70">
        {percent.toFixed(2)}% of supply staked
      </p>
    </div>
  );
}

