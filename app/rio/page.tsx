// app/rio/page.tsx

import type { ReactNode } from "react";
import { apiUrl } from "@/lib/apiBase";
import {
  RIO_APPROVED_ALLOCATIONS,
  RIO_APPROVED_NOMINAL_TOTAL,
} from "@/lib/rioAllocationPolicy.mjs";

type RioState = {
  height?: string | number;
  total_supply?: string | number;
  circulating?: string | number;
  bonded?: string | number;
  protocol_reserves?: string | number;
  authoritative_monetary_truth?: boolean;
  authority?: string;
  source?: string;
};

const RIO_LOGO =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";

async function getRioState(): Promise<RioState | null> {
  try {
    const res = await fetch(apiUrl("/api/rio/state"), { cache: "no-store" });
    if (!res.ok) return null;

    const state = (await res.json()) as RioState;
    return state.authoritative_monetary_truth === true ? state : null;
  } catch {
    return null;
  }
}

function fmt(v?: string | number | null) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("en-US").format(n);
}

const accentLabel = "text-[11px] uppercase tracking-[0.24em] text-[#f0c58a]";

export default async function RioPage() {
  const state = await getRioState();
  const rioStateAvailable = state !== null;

  return (
    <div className="relative space-y-8 overflow-hidden">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1015] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:p-12">
        <div
          className="pointer-events-none absolute right-6 top-6 h-52 w-52 bg-contain bg-center bg-no-repeat opacity-[0.08]"
          style={{ backgroundImage: `url('${RIO_LOGO}')` }}
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <img src={RIO_LOGO} alt="RIO logo" width={40} height={40} className="h-10 w-10 object-contain" />
              </div>
              <div className="min-w-0">
                <div className={accentLabel}>RIO monetary terminal</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  RIO policy and ledger status
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
                  Approved allocation targets are shown separately from observed chain state.
                  The terminal displays current monetary figures only when their source
                  explicitly identifies canonical monetary truth.
                </p>
              </div>
            </div>

            {!rioStateAvailable ? (
              <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100" role="status">
                Live RIO monetary state is unavailable from a verified chain-derived source.
                Current supply, circulation, bonded amount, and protocol custody are withheld.
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total Supply" value={fmt(state?.total_supply)} />
              <Metric label="Circulating" value={fmt(state?.circulating)} />
              <Metric label="Bonded Security" value={fmt(state?.bonded)} />
              <Metric label="Protocol Reserves" value={fmt(state?.protocol_reserves)} />
            </div>
          </div>

          <div className="rounded-[24px] border border-[#f4a261]/20 bg-[linear-gradient(180deg,rgba(20,33,53,0.96),rgba(18,24,37,0.96))] p-6">
            <div className={accentLabel}>Authority boundary</div>
            <h2 className="mt-3 text-2xl text-white">Targets are not balances</h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              The allocation model is policy evidence. It does not establish account
              ownership, custody, vesting, spendability, staking, or current supply.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill>Approved policy target</Pill>
              <Pill>Live observation unavailable</Pill>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,19,24,0.96),rgba(10,14,20,0.98))] p-8 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={accentLabel}>Approved RIO allocation model</div>
            <h2 className="mt-2 text-2xl text-white">Nominal policy targets</h2>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/65">Nominal total</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-50">
              {formatRioAmount(RIO_APPROVED_NOMINAL_TOTAL)} RIO
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
          These figures represent the approved allocation model and are not current
          account balances or release authority. The former 161M Forever Lock category
          is abolished; historical ecosystem custody is classified under Ecosystem
          Protocol, with the former 1M excess tracked separately.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {RIO_APPROVED_ALLOCATIONS.map((allocation) => (
            <PolicyAllocationCard
              key={allocation.key}
              label={allocation.label}
              amount={allocation.amount}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-amber-400/20 bg-amber-400/[0.045] p-8 md:p-9">
        <div className={accentLabel}>Live reconciliation</div>
        <h2 className="mt-2 text-2xl text-white">Account and validator state</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/70">
          Current account custody, vesting and spendability, validator registration,
          bonded and jailed state, and governance weight are not verified by the
          available monetary endpoint. This terminal therefore makes no live position
          or validator eligibility claim.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
          Reconciliation unavailable
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.025] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-[#f0c58a]">{label}</div>
      <div className="mt-2 break-words text-xl leading-tight text-white">{value ?? "—"}</div>
    </div>
  );
}

function PolicyAllocationCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">Approved target</div>
      <h3 className="mt-3 min-h-12 text-base font-semibold text-white">{label}</h3>
      <div className="mt-4 text-2xl font-semibold tabular-nums text-[#ffe2bd]">
        {formatRioAmount(amount)} RIO
      </div>
    </div>
  );
}

function formatRioAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-flex rounded-full border px-3 py-2 text-xs shadow-[0_0_14px_rgba(242,133,0,0.08)]"
      style={{
        borderColor: "rgba(244,162,97,0.24)",
        background: "rgba(242,133,0,0.10)",
        color: "#fff0e2",
      }}
    >
      {children}
    </div>
  );
}
