"use client";

export default function MacroTelemetry({ rio }: { rio: any }) {
  const securityRatio =
    ((Number(rio.dead_locked) + Number(rio.bonded)) /
      Number(rio.total_supply)) *
    100;

  return (
    <div className="p-6 bg-slate-950 rounded-xl border border-slate-700">
      <h2 className="text-lg mb-4">Macro Monetary Telemetry</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">

        <div>
          <p className="opacity-60">Security Ratio</p>
          <p className="text-xl font-bold text-green-400">
            {securityRatio.toFixed(2)}%
          </p>
        </div>

        <div>
          <p className="opacity-60">Circulating Supply</p>
          <p className="text-xl font-bold text-white">
            {Number(rio.circulating).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="opacity-60">Locked Capital</p>
          <p className="text-xl font-bold text-amber-400">
            {Number(rio.dead_locked).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="opacity-60">Bonded Stake</p>
          <p className="text-xl font-bold text-blue-400">
            {Number(rio.bonded).toLocaleString()}
          </p>
        </div>

      </div>
    </div>
  );
}
