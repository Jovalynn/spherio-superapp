// app/rio/page.tsx

import { apiUrl } from "@/lib/apiBase";

type RioState = {
  height?: string;
  total_supply?: string;
  circulating?: string;
  bonded?: string;
  treasury?: string;
  protocol_reserves?: string;
  dead_locked?: string;
};

type ValidatorPolicyResponse = {
  count: number;
  live_height?: number;
  compliance_summary?: {
    compliant_count: number;
    pending_normalization_count: number;
    live_bonded_total_rio: string;
    target_allocation_total_rio: string;
    coverage_ratio: string;
    coverage_percent: string;
  };
  validators?: Array<{
    validator_label: string;
    wallet_address?: string | null;
    operator_address?: string | null;
    target_allocation_rio?: string;
    funding_source?: string | null;
    current_vesting_status?: string | null;
    policy_status?: string | null;
    live_bonded_amount_rio?: string | null;
  }>;
};

type ClassifiedAccount = {
  address: string;
  label: string;
  category: string;
  subcategory?: string | null;
  is_protocol_owned: boolean;
  is_circulating: boolean;
  is_permanently_locked: boolean;
  is_validator_related: boolean;
  notes?: string | null;
  target_notes?: string | null;
  funding_source?: string | null;
  current_vesting_status?: string | null;
  policy_status?: string | null;
  height?: number | null;
  time?: string | null;
  target_balance_urio: string;
  live_wallet_balance_urio: string;
  live_bonded_urio: string;
  effective_live_balance_urio: string;
  spendable_balance_urio: string;
  vested_balance_urio: string;
  vesting_balance_urio: string;
  delegated_balance_urio: string;
  unbonding_balance_urio: string;
  rewards_balance_urio: string;
  delta_urio: string;
  truth_state: string;
};

type ClassifiedCategorySummary = {
  category: string;
  count: number;
  target_balance_urio: string;
  live_wallet_balance_urio: string;
  live_bonded_urio: string;
  effective_live_balance_urio: string;
  vested_balance_urio: string;
  vesting_balance_urio: string;
  delegated_balance_urio: string;
};

type ClassifiedAccountsResponse = {
  overview_summary: {
    count: number;
    target_visible_count: number;
    live_wallet_visible_count: number;
    staking_visible_count: number;
  };
  accounts: ClassifiedAccount[];
  category_summary: ClassifiedCategorySummary[];
};

async function getRioState(): Promise<RioState> {
  const res = await fetch(apiUrl("/api/rio/state"), { cache: "no-store" });
  if (!res.ok) throw new Error("RIO state fetch failed");
  return res.json();
}

async function getValidatorPolicy(): Promise<ValidatorPolicyResponse | null> {
  try {
    const res = await fetch(apiUrl("/api/rio/validators/policy"), {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getClassifiedAccounts(): Promise<ClassifiedAccountsResponse | null> {
  try {
    const res = await fetch(apiUrl("/api/rio/accounts/classified"), {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
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

function urioToRioString(v?: string | null) {
  if (!v) return "—";
  const n = Number(v) / 1_000_000;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(n);
}

function prettyCategory(category?: string) {
  switch (category) {
    case "treasury":
      return "Treasury";
    case "forever_lock":
      return "Forever Lock";
    case "core_contributor":
      return "Core Contributor";
    case "validator_wallet":
      return "Validator Wallets";
    case "ecosystem_reserve":
      return "Ecosystem Reserve";
    case "protocol_reserve":
      return "Protocol Reserve";
    case "module_account":
      return "Module Accounts";
    case "public_circulating":
      return "Public Circulating";
    default:
      return category ? category.replace(/_/g, " ") : "Unknown";
  }
}

function truthStateLabel(state?: string) {
  switch (state) {
    case "target_and_live_visible":
      return "Target + Live Visible";
    case "staking_visible":
      return "Staking Visible";
    case "policy_allocated_not_live":
      return "Policy Allocated / Not Live";
    case "target_not_live_visible":
      return "Target / Not Live Visible";
    case "live_noncanonical":
      return "Live / Noncanonical";
    case "live_zero":
      return "Live Zero";
    default:
      return "Canonical Only";
  }
}

function truthStateStyle(state?: string) {
  switch (state) {
    case "target_and_live_visible":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    case "staking_visible":
      return "border-sky-500/25 bg-sky-500/10 text-sky-200";
    case "policy_allocated_not_live":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    case "target_not_live_visible":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "live_noncanonical":
      return "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-200";
    case "live_zero":
      return "border-white/10 bg-white/5 text-white/70";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

const accentLabel = "text-[11px] uppercase tracking-[0.24em] text-[#f0c58a]";

export default async function RioPage() {
  const [state, policy, classified] = await Promise.all([
    getRioState(),
    getValidatorPolicy(),
    getClassifiedAccounts(),
  ]);

  const summary = policy?.compliance_summary;
  const overview = classified?.overview_summary;

  const featuredCategories =
    classified?.category_summary?.filter((x) =>
      [
        "treasury",
        "protocol_reserve",
        "forever_lock",
        "core_contributor",
        "validator_wallet",
        "module_account",
      ].includes(x.category)
    ) ?? [];

  return (
    <div className="relative space-y-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px]">
        <div className="absolute left-[-8%] top-[-8%] h-[260px] w-[260px] rounded-full blur-3xl bg-[rgba(40,90,170,0.14)]" />
        <div className="absolute right-[10%] top-[0%] h-[240px] w-[240px] rounded-full blur-3xl bg-[rgba(242,133,0,0.10)]" />
        <div className="absolute left-[30%] top-[16%] h-[180px] w-[180px] rounded-full blur-3xl bg-[rgba(244,162,97,0.08)]" />
      </div>

      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0d1015] p-10 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div
          className="absolute right-6 top-6 h-52 w-52 bg-contain bg-no-repeat bg-center opacity-[0.08]"
          style={{
            backgroundImage:
              "url('https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4')",
          }}
        />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.9fr]">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[#fff0e2] shadow-[0_0_24px_rgba(242,133,0,0.12)]"
              style={{
                borderColor: "rgba(244,162,97,0.28)",
                background:
                  "linear-gradient(180deg, rgba(242,133,0,0.16), rgba(244,162,97,0.10))",
              }}
            >
              RIO Terminal
            </div>

            <h1 className="mt-4 text-4xl font-semibold text-white leading-tight">
              Real-World Interconnected Onchain
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              RIO is the sovereign monetary asset powering the Spherio ecosystem.
              This terminal presents supply, security, policy, and institutional
              account telemetry in one premium monetary surface.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total Supply" value={fmt(state?.total_supply)} />
              <Metric label="Circulating" value={fmt(state?.circulating)} />
              <Metric label="Bonded Security" value={fmt(state?.bonded)} />
              <Metric label="Protocol Reserves" value={fmt(state?.protocol_reserves)} />
            </div>
          </div>

          <div
            className="rounded-[24px] border p-6 shadow-[0_0_24px_rgba(242,133,0,0.08)]"
            style={{
              borderColor: "rgba(244,162,97,0.22)",
              background:
                "linear-gradient(180deg, rgba(20,33,53,0.96), rgba(18,24,37,0.96))",
            }}
          >
            <div className={accentLabel}>What this terminal shows</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Target vs Live Allocation Truth
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              This page now distinguishes canonical allocation targets, wallet-visible
              balances, staking-visible balances, and effective live amounts. It is
              designed to show the true position of the chain rather than only the
              subset visible as liquid wallet balances.
            </p>

            <div className="mt-6 grid gap-3">
              <Pill>Canonical target balances</Pill>
              <Pill>Wallet-visible live balances</Pill>
              <Pill>Staking-visible validator allocations</Pill>
              <Pill>Truth-state interpretation per account</Pill>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#0f1217] p-8">
        <div className={accentLabel}>Classified Accounts Summary</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
  This policy layer reflects the intended RIO tokenomics structure where some
  allocations are defined institutionally rather than exposed cleanly as wallet
  balances. The indexed account truth table remains below.
</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Classified Accounts" value={fmt(overview?.count)} />
          <Metric label="Target Visible" value={fmt(overview?.target_visible_count)} />
          <Metric label="Wallet Visible" value={fmt(overview?.live_wallet_visible_count)} />
          <Metric label="Staking Visible" value={fmt(overview?.staking_visible_count)} />
          <Metric label="Bonded Total" value={summary ? `${summary.live_bonded_total_rio} RIO` : "—"} />
          <Metric label="Coverage" value={summary ? `${summary.coverage_percent}%` : "—"} />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#101318] p-8">
        <div className={accentLabel}>Indexed Allocation Layers</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Category-Level Truth
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
          Each category now shows target allocation, effective live balance, and
          delta. This is more truthful than the earlier placeholder cards.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <TokenomicsCard
    title="Protocol Reserve"
    target="51,000,000 RIO"
    live="41,000,000 RIO"
    delta="-10,000,000 RIO"
    note="Treasury-funded validator expansion reduced treasury from its earlier policy level. Reserve composition remains Treasury ~19.9M, Liquidity 10M, Emergency 11M."
  />

  <TokenomicsCard
    title="Forever Lock"
    target="161,000,000 RIO"
    live="0 RIO spendable"
    delta="Non-spendable"
    note="Permanent protocol dead lock. Economically present, but not live for spending."
  />

  <TokenomicsCard
    title="Core Contributor"
    target="2,000,000 RIO"
    live="2,000,000 RIO"
    delta="0 RIO"
    note="Liquid allocation. Not staked and not part of protocol reserve."
  />

  <TokenomicsCard
    title="Validator Allocations"
    target="94,000,000 RIO"
    live="0 RIO wallet-visible"
    delta="Policy / staking visible"
    note="Validator allocations are expected to be staked by design, so wallet balances do not tell the full truth."
  />

  <TokenomicsCard
    title="Deployment"
    target="1,000 RIO"
    live="1,000 RIO"
    delta="0 RIO"
    note="Operational deployment allocation used for infrastructure and development stack actions."
  />
</div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#101318] p-8">
          <div className={accentLabel}>Account Truth Table</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Canonical vs Live vs Staking
          </h2>

          <div className="mt-6 space-y-3">
            {(classified?.accounts ?? []).map((acc) => (
              <div
                key={acc.address}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{acc.label}</div>
                    <div className="mt-1 text-xs text-white/45">
                      {prettyCategory(acc.category)}
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-white/35 break-all">
                      {acc.address}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${truthStateStyle(
                        acc.truth_state
                      )}`}
                    >
                      {truthStateLabel(acc.truth_state)}
                    </span>

                    {acc.subcategory ? (
                      <span
                        className="inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[#fff0e2]"
                        style={{
                          borderColor: "rgba(244,162,97,0.22)",
                          background: "rgba(242,133,0,0.10)",
                        }}
                      >
                        {acc.subcategory}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <TerminalField
                    label="Target"
                    value={`${urioToRioString(acc.target_balance_urio)} RIO`}
                  />
                  <TerminalField
                    label="Live Wallet"
                    value={`${urioToRioString(acc.live_wallet_balance_urio)} RIO`}
                  />
                  <TerminalField
                    label="Live Bonded"
                    value={`${urioToRioString(acc.live_bonded_urio)} RIO`}
                  />
                  <TerminalField
                    label="Effective Live"
                    value={`${urioToRioString(acc.effective_live_balance_urio)} RIO`}
                  />
                  <TerminalField
                    label="Delta"
                    value={`${urioToRioString(acc.delta_urio)} RIO`}
                  />
                  <TerminalField
                    label="Vesting"
                    value={`${urioToRioString(acc.vesting_balance_urio)} RIO`}
                  />
                  <TerminalField
                    label="Vested"
                    value={`${urioToRioString(acc.vested_balance_urio)} RIO`}
                  />
                  <TerminalField
                    label="Delegated"
                    value={`${urioToRioString(acc.delegated_balance_urio)} RIO`}
                  />
                </div>

                {(acc.target_notes || acc.notes || acc.current_vesting_status || acc.policy_status) ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white/70">
                    {acc.target_notes ? <div>{acc.target_notes}</div> : null}
                    {acc.notes ? <div className="mt-1">{acc.notes}</div> : null}
                    {acc.current_vesting_status ? (
                      <div className="mt-1">
                        Vesting status: <span className="text-white/90">{acc.current_vesting_status}</span>
                      </div>
                    ) : null}
                    {acc.policy_status ? (
                      <div className="mt-1">
                        Policy status: <span className="text-white/90">{acc.policy_status}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-[28px] border p-8 shadow-[0_0_28px_rgba(242,133,0,0.06)]"
          style={{
            borderColor: "rgba(244,162,97,0.22)",
            background:
              "linear-gradient(180deg, rgba(20,33,53,0.96), rgba(18,24,37,0.96))",
          }}
        >
          <div className={accentLabel}>Validator Policy Monitor</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Expanded 12-Validator Normalization
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ComplianceCard
              label="Compliant"
              value={summary ? String(summary.compliant_count) : "—"}
            />
            <ComplianceCard
              label="Pending Normalization"
              value={summary ? String(summary.pending_normalization_count) : "—"}
            />
            <ComplianceCard
              label="Live Bonded Total"
              value={summary ? `${summary.live_bonded_total_rio} RIO` : "—"}
            />
            <ComplianceCard
              label="Coverage"
              value={summary ? `${summary.coverage_percent}%` : "—"}
            />
          </div>

          <div className="mt-6 space-y-3">
            {Array.from({ length: 12 }).map((_, idx) => {
              const validator = policy?.validators?.find(
                (v) => v.validator_label === `Val${idx + 1}`
              );

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Validator {idx + 1}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {validator?.funding_source ?? "—"}
                      </div>
                    </div>

                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80">
                      {validator?.policy_status ?? "unknown"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <TerminalField
                      label="Target Allocation"
                      value={
                        validator?.target_allocation_rio
                          ? `${validator.target_allocation_rio} RIO`
                          : "—"
                      }
                    />
                    <TerminalField
                      label="Live Bonded"
                      value={
                        validator?.live_bonded_amount_rio
                          ? `${validator.live_bonded_amount_rio} RIO`
                          : "—"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs tracking-[0.2em] text-[#f0c58a] uppercase">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white break-words leading-tight">
        {value ?? "—"}
      </div>
    </div>
  );
}

function TokenomicsCard({
  title,
  target,
  live,
  delta,
  note,
}: {
  title: string;
  target: string;
  live: string;
  delta: string;
  note: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-[0_0_18px_rgba(242,133,0,0.05)]"
      style={{
        borderColor: "rgba(244,162,97,0.20)",
        background:
          "linear-gradient(180deg, rgba(49,30,13,0.90), rgba(28,19,12,0.90))",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#f0c58a]">
        {title}
      </div>

      <div className="mt-3 space-y-2">
        <Row label="Target" value={target} />
        <Row label="Live" value={live} />
        <Row label="Delta" value={delta} />
      </div>

      <p className="mt-4 text-sm leading-6 text-white/62">
        {note}
      </p>
    </div>
  );
}

function TruthCategoryCard({
  title,
  accounts,
  target,
  live,
  delta,
}: {
  title: string;
  accounts: number;
  target: string;
  live: string;
  delta: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-[0_0_18px_rgba(242,133,0,0.05)]"
      style={{
        borderColor: "rgba(244,162,97,0.20)",
        background:
          "linear-gradient(180deg, rgba(49,30,13,0.90), rgba(28,19,12,0.90))",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#f0c58a]">
        {title}
      </div>
      <div className="mt-3 space-y-2">
        <Row label="Accounts" value={String(accounts)} />
        <Row label="Target" value={target} />
        <Row label="Live" value={live} />
        <Row label="Delta" value={delta} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
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

function ComplianceCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-[0_0_18px_rgba(242,133,0,0.06)]"
      style={{
        borderColor: "rgba(244,162,97,0.22)",
        background:
          "linear-gradient(180deg, rgba(49,30,13,0.90), rgba(28,19,12,0.90))",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#f0c58a]">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function TerminalField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#f0c58a]">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-white/85 break-words">{value}</div>
    </div>
  );
}
