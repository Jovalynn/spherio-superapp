"use client";

export default function StressPanel() {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl">
      <h2 className="mb-6 text-lg">Macro Risk Simulation</h2>

      <div className="space-y-4">

        <div>
          <p>10% Liquidity Shock</p>
          <div className="w-full bg-slate-700 h-3 rounded">
            <div className="bg-green-500 h-3 w-1/3 rounded" />
          </div>
        </div>

        <div>
          <p>25% Liquidity Shock</p>
          <div className="w-full bg-slate-700 h-3 rounded">
            <div className="bg-yellow-500 h-3 w-1/2 rounded" />
          </div>
        </div>

        <div>
          <p>50% Liquidity Shock</p>
          <div className="w-full bg-slate-700 h-3 rounded">
            <div className="bg-red-500 h-3 w-2/3 rounded" />
          </div>
        </div>

      </div>
    </div>
  );
}
