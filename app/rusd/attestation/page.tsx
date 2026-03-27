import { getLatestRusdAttestation } from "@/lib/riodex";

type AttestationView = {
  report_date?: string | null;
  attestation_period?: string | null;
  rusd_supply?: string | number | null;
  reserve_value_usd?: string | number | null;
  collateral_ratio?: string | number | null;
  target_ratio?: string | number | null;
  reserve_asset_class?: string | null;
  auditor?: string | null;
  auditor_name?: string | null;
  opinion?: string | null;
  statement_url?: string | null;
  signature_url?: string | null;
  published_at?: string | null;
};

export default async function RusdAttestationPage() {
  const a = (await getLatestRusdAttestation()) as AttestationView | null;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">
            RUSD
          </div>
          <h1 className="text-4xl font-semibold mt-2">Attestation</h1>
          <p className="text-zinc-400 mt-2">
            Reserve transparency and backing credibility for RUSD.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
          {!a ? (
            <div className="text-zinc-400">No attestation published yet.</div>
          ) : (
            <div className="grid gap-4 text-sm">
              <div><span className="text-zinc-400">Report date:</span> {a?.report_date ?? "—"}</div>
              <div><span className="text-zinc-400">Attestation period:</span> {a?.attestation_period ?? "—"}</div>
              <div><span className="text-zinc-400">RUSD supply:</span> {a?.rusd_supply ?? "—"}</div>
              <div><span className="text-zinc-400">Reserve value:</span> {a?.reserve_value_usd ?? "—"}</div>
              <div><span className="text-zinc-400">Collateral ratio:</span> {a?.collateral_ratio ?? "—"}</div>
              <div><span className="text-zinc-400">Target ratio:</span> {a?.target_ratio ?? "—"}</div>
              <div><span className="text-zinc-400">Reserve class:</span> {a?.reserve_asset_class ?? "—"}</div>
              <div><span className="text-zinc-400">Auditor:</span> {a?.auditor_name ?? a?.auditor ?? "Pending"}</div>

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
