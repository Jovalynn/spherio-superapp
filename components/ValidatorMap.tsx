"use client";

export default function ValidatorMap() {
  const validators = [
    { name: "Val1", stake: 14_000_000 },
    { name: "Val2", stake: 14_000_000 },
    { name: "Val3", stake: 14_000_000 },
    { name: "Val4", stake: 14_000_000 },
    { name: "Val5", stake: 14_000_000 },
    { name: "Val6", stake: 14_000_000 },
    { name: "Val7", stake: 2_000_000 },
  ];

  return (
    <div className="p-6 bg-slate-900 rounded-xl">
      <h2 className="text-lg mb-4">Validator Staking Map</h2>

      <div className="space-y-3">
        {validators.map((v) => (
          <div key={v.name}>
            <div className="flex justify-between text-sm">
              <span>{v.name}</span>
              <span>{v.stake.toLocaleString()} RIO</span>
            </div>
            <div className="bg-gray-700 h-3 rounded">
              <div
                className="bg-amber-500 h-3 rounded"
                style={{ width: `${(v.stake / 88_000_000) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

