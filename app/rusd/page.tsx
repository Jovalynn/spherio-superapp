"use client";

import { useEffect, useState } from "react";


type RusdStateResponse = {
  asset: "RUSD";
  unit: string;
  contract_address: string;
  treasury_multisig: string;
  issued_supply: {
    raw: string;
    formatted: string;
  };
  supply_ceiling: {
    raw: string;
    formatted: string;
  };
  remaining_issuance_capacity: {
    raw: string;
    formatted: string;
  };
  backing_value: {
    raw: string;
    formatted: string;
  };
  collateralization_ratio: {
    bps: number;
    percent: string;
  };
  mint_policy: {
    daily_mint_cap: {
      raw: string;
      formatted: string;
    };
    epoch_mint_cap: {
      raw: string;
      formatted: string;
    };
    epoch_window_hours: number;
  };
  source: {
    mode: string;
    issued_supply: string;
    policy_fields: string;
    derived_fields: string;
  };
  updated_at: string;
};

const RUSD_LOGO =
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

function toNumber(value?: string | null) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInt(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function shortAddr(addr?: string | null) {
  if (!addr) return "Not visible";
  if (addr.length < 22) return addr;
  return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
}

function statusTone(ratioPct: number) {
  if (ratioPct >= 120) return "text-[#F4F1EA]";
  if (ratioPct >= 100) return "text-[#CFC7BE]";
  return "text-[#F4F1EA]";
}

function KpiCard({
  label,
  value,
  suffix,
  sublabel,
}: {
  label: string;
  value: string;
  suffix?: string;
  sublabel: string;
}) {
  return (
    <div className="min-w-0 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(139,0,0,0.10),rgba(255,255,255,0.02))] p-4 md:p-5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#9E948C]">
        {label}
      </div>

      <div className="mt-3">
        <div className="text-[clamp(1.35rem,2.4vw,2.35rem)] font-semibold leading-tight tracking-tight text-[#F4F1EA] break-all sm:break-normal">
          {value}
        </div>
        {suffix ? (
          <div className="mt-1 text-base font-semibold text-[#CFC7BE]">
            {suffix}
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-sm leading-6 text-[#9E948C]">{sublabel}</div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F4F1EA]">
          {title}
        </h2>
        {right ? <div className="text-sm text-[#9E948C]">{right}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function RUSDPage() {
  const [overview, setOverview] = useState<RusdStateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const response = await fetch("/api/rusd/state", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load RUSD state: ${response.status}`);
        }

        const data: RusdStateResponse = await response.json();

        if (active) {
          setOverview(data);
        }
      } catch (error) {
        console.error("Failed to load RUSD state", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    const timer = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!overview) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] text-[#F4F1EA]">
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-sm text-[#CFC7BE]">
          Loading RUSD state...
        </div>
      </div>
    );
  }

  const liveSupply = toNumber(overview.issued_supply.raw);
  const supplyCeiling = toNumber(overview.supply_ceiling.raw);
  const remainingCapacity = toNumber(overview.remaining_issuance_capacity.raw);
  const liveBackingValue = toNumber(overview.backing_value.raw);
  const ratioPct = Number(overview.collateralization_ratio.percent.replace("%", "")) || 120;
  const dailyMintCap = toNumber(overview.mint_policy.daily_mint_cap.raw);
  const epochMintCap = toNumber(overview.mint_policy.epoch_mint_cap.raw);
  const epochWindowHours = overview.mint_policy.epoch_window_hours;
  const utilization = supplyCeiling > 0 ? (liveSupply / supplyCeiling) * 100 : 0;
  const collateralBuffer = Math.max(liveBackingValue - liveSupply, 0);

  const complianceLabel =
  ratioPct >= 120 ? "above_target" : ratioPct >= 100 ? "above_minimum" : "below_minimum";

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#F4F1EA]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(139,0,0,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,0,0,0.10),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(139,0,0,0.12),transparent_22%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="mx-auto max-w-[1700px] px-4 py-5 md:px-6 xl:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[0_0_30px_rgba(139,0,0,0.25)]">
                  <img
                   src={RUSD_LOGO}
                   alt="RUSD Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                 />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#9E948C]">
                    Spherio Sovereign Monetary Infrastructure
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F4F1EA] md:text-4xl">
                    RUSD Terminal
                  </h1>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-[#CFC7BE] md:text-[15px]">
                    RUSD is a USD-denominated T-Bill digital settlement asset issued on
                    SpherioChain for payments, commerce, infrastructure settlement,
                    accounting, billing, and enterprise or network usage. It is fully
                    reserve-backed, overcollateralized, deterministic in supply,
                    non-algorithmic, non-yield-bearing at launch, and issued only under
                    strict rules. RUSD is not a governance token, not a speculative
                    asset, and not dependent on RIO. RUSD serves settlement. RIO serves
                    gas, fees, and governance.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#CFC7BE]">
                  Integrity: LIVE
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#CFC7BE]">
                  Theme: Sovereign Crimson
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#CFC7BE]">
                  {loading ? "Refreshing..." : "Monetary Feed Active"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1700px] space-y-6 px-4 py-6 md:px-6 md:py-8 xl:px-8">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Issued Supply"
              value={overview.issued_supply.formatted}
              suffix="RUSD"
              sublabel="Live on-chain current supply"
            />
            <KpiCard
              label="Supply Ceiling"
              value={overview.supply_ceiling.formatted}
              suffix="RUSD"
              sublabel="Policy maximum supply ceiling"
            />
            <KpiCard
              label="Backing Value"
              value={overview.backing_value.formatted}
              suffix="RUSD"
              sublabel="120% collateral backing value"
            />
            <KpiCard
              label="Backing Ratio"
              value={overview.collateralization_ratio.percent}
              sublabel="Backing value divided by issued supply"
            />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
            <Section title="Institutional Overview" right="Sovereign Settlement Layer">
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(139,0,0,0.16),rgba(255,255,255,0.03))] p-5">
                  <div className="text-[10px] uppercase tracking-[0.20em] text-[#9E948C]">
                    Nature of RUSD
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm leading-7 md:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#9E948C]">
                        RUSD Is
                      </div>
                      <div className="mt-3 space-y-1 text-[#CFC7BE]">
                        <div>• Fully reserve-backed</div>
                        <div>• Overcollateralized</div>
                        <div>• Deterministic in supply</div>
                        <div>• Non-algorithmic</div>
                        <div>• Non-yield-bearing at launch</div>
                        <div>• Issued under strict policy rules</div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#9E948C]">
                        RUSD Is Not
                      </div>
                      <div className="mt-3 space-y-1 text-[#CFC7BE]">
                        <div>• A governance token</div>
                        <div>• A security or profit instrument</div>
                        <div>• An algorithmic stablecoin</div>
                        <div>• A partially reserved instrument</div>
                        <div>• A speculative or yield product</div>
                        <div>• Operationally mixed with RIO</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] uppercase tracking-[0.20em] text-[#9E948C]">
                    Functional Separation
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[#CFC7BE]">
                    RUSD and RIO can never mix. RUSD is the settlement token for
                    billing, payments, commerce, accounting, and infrastructure usage.
                    RIO is separate and serves gas, fees, and governance. Their roles,
                    custody logic, policy framing, and balance interpretation must remain
                    distinct across the terminal, indexer, and public presentation layer.
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Monetary Overview" right="Live Registry">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Current Supply
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview.issued_supply.formatted}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Remaining Capacity
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview.remaining_issuance_capacity.formatted}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Daily Mint Cap
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview.mint_policy.daily_mint_cap.formatted}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Epoch Mint Cap
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview.mint_policy.epoch_mint_cap.formatted}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">
                      {epochWindowHours}h window
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                        Issuance Utilization
                      </div>
                      <div className="mt-2 text-4xl font-semibold text-[#F4F1EA]">
                        {utilization.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right text-sm text-[#CFC7BE]">
                      current supply / ceiling
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8B0000,#B22222,#F4F1EA)]"
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                        Backing Coverage
                      </div>
                      <div className={`mt-2 text-4xl font-semibold ${statusTone(ratioPct)}`}>
                        {overview.collateralization_ratio.percent}
                      </div>
                    </div>
                    <div className="text-right text-sm text-[#CFC7BE]">
                      collateral / issued supply
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8B0000,#B22222,#F4F1EA)]"
                      style={{ width: `${Math.min((ratioPct / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Institutional Registry" right="Operational Truth">
              <div className="space-y-4">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Treasury Multisig
                  </div>
                  <div className="mt-3 break-all text-sm leading-7 text-[#CFC7BE]">
                    {overview.treasury_multisig}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Token Contract
                  </div>
                  <div className="mt-3 break-all text-sm leading-7 text-[#CFC7BE]">
                    {overview.contract_address}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Compliance State
                  </div>
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-[rgba(139,0,0,0.18)] px-3 py-1 text-sm text-[#F4F1EA]">
                    {complianceLabel}
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Target / Minimum Ratio
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-white/10 bg-black/10 p-3">
                      <div className="text-xs text-[#9E948C]">Target</div>
                      <div className="mt-1 text-xl font-semibold text-[#F4F1EA]">
                        120%
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-white/10 bg-black/10 p-3">
                      <div className="text-xs text-[#9E948C]">Minimum</div>
                      <div className="mt-1 text-xl font-semibold text-[#F4F1EA]">
                        100%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Collateral Buffer
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                    {formatInt(collateralBuffer)}
                  </div>
                  <div className="mt-1 text-sm text-[#CFC7BE]">
                    backing surplus above issued supply
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Live Update / Source
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#CFC7BE]">
                    <div>Updated: {new Date(overview.updated_at).toLocaleString()}</div>
                    <div>Mode: {overview.source.mode}</div>
                    <div>
                      Policy Source: {shortAddr(overview.treasury_multisig)}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}
