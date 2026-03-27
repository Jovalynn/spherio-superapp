"use client";

export default function MonetaryStability({
  integrityRatio,
}: {
  integrityRatio: number;
}) {
  let status = "Strong";
  let color = "text-green-400";

  if (integrityRatio < 50) {
    status = "Weak";
    color = "text-red-400";
  } else if (integrityRatio < 70) {
    status = "Moderate";
    color = "text-yellow-400";
  }

  return (
    <div className="p-6 rounded-xl bg-slate-900">
      <h2 className="text-lg mb-2">Monetary Stability</h2>
      <p className={`text-2xl font-bold ${color}`}>
        {status}
      </p>
      <p className="text-sm opacity-60">
        Integrity Ratio: {integrityRatio.toFixed(2)}%
      </p>
    </div>
  );
}

