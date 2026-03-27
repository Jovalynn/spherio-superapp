"use client";

export default function RUSDBacking({
  rusdSupply,
}: {
  rusdSupply: number;
}) {
  const backingRatio = 120; // 120% overcollateralization

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <h2 className="text-lg mb-2">RUSD Backing Ratio</h2>

      <p className="text-2xl font-bold text-blue-400">
        {backingRatio}%
      </p>

      <p className="text-sm opacity-60">
        Overcollateralized by RWA T-Bills (120%)
      </p>

      <p className="text-sm mt-2">
        Total Supply: {rusdSupply.toLocaleString()} RUSD
      </p>
    </div>
  );
}

