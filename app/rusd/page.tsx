"use client";

import { useEffect, useMemo, useState } from "react";

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
  if (!addr || addr === "pending_live_contract_sync" || addr === "unavailable") {
    return "Pending live contract sync";
  }
  if (addr.length < 22) return addr;
  return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
}

function sourceModeLabel(mode?: string) {
  switch (mode) {
    case "attestation_bridge":
      return "Attestation bridge";
    case "fallback_attestation_mode":
    case "fallback_attestation_shape":
      return "Fallback attestation mode";
    default:
      return mode ? mode.replace(/_/g, " ") : "Unknown";
  }
}

function complianceLabel(ratioPct: number) {
  if (ratioPct >= 120) return "Above reserve target";
  if (ratioPct >= 100) return "Above minimum backing threshold";
  if (ratioPct > 0) return "Below minimum backing threshold";
  return "Not yet attested";
}

function derivePhase(overview: RusdStateResponse | null) {
  if (!overview) {
    return {
      code: "phase_1",
      title: "Phase 1 · Bootstrap Issuance",
      short: "Bootstrap",
      description:
        "Early network formation stage. Settlement utility is established before reserve maturity is fully realized.",
    };
  }

  const ratio = Number(overview.collateralization_ratio.percent.replace("%", "")) || 0;
  const mode = overview.source?.mode ?? "";

  if (ratio >= 120 && mode === "attestation_bridge") {
    return {
      code: "phase_3",
      title: "Phase 3 · Full Backing",
      short: "Fully Backed",
      description:
        "Reserve maturity achieved. RUSD operates as a fully backed, overcollateralized settlement asset.",
    };
  }

  if (ratio > 0) {
    return {
      code: "phase_2",
      title: "Phase 2 · Partial Collateralization",
      short: "Partial",
      description:
        "Collateral support is present but not yet at full reserve maturity. Issuance is still governed under phased settlement discipline.",
    };
  }

  return {
    code: "phase_1",
    title: "Phase 1 · Bootstrap Issuance",
    short: "Bootstrap",
    description:
      "Settlement layer is active while reserve structure and attestation depth continue to mature.",
  };
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
    <div className="min-w-0 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(139,0,0,0.10),rgba(255,255,255,0.02))] p-4 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.32)] md:p-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#9E948C]">
        {label}
      </div>

      <div className="mt-3">
        <div className="break-all text-[clamp(1.35rem,2.4vw,2.35rem)] font-semibold leading-tight tracking-tight text-[#F4F1EA] sm:break-normal">
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

function StatePill({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-xs ${
        strong
          ? "border-[#8B0000]/50 bg-[rgba(139,0,0,0.22)] text-[#F4F1EA]"
          : "border-white/10 bg-white/[0.05] text-[#CFC7BE]"
      } shadow-[0_8px_20px_rgba(0,0,0,0.16)]`}
    >
      {children}
    </div>
  );
}

function TableCell({
  children,
  muted = false,
  align = "left",
}: {
  children: React.ReactNode;
  muted?: boolean;
  align?: "left" | "center" | "right";
}) {
  return (
    <td
      className={`border-t border-white/10 px-4 py-3 text-sm leading-6 ${
        muted ? "text-[#9E948C]" : "text-[#F4F1EA]"
      } ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </td>
  );
}

export default function RUSDPage() {
  const [overview, setOverview] = useState<RusdStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError("");

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
        if (active) {
          setOverview(null);
          setLoadError(
            error instanceof Error ? error.message : "Failed to load RUSD state",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const liveSupply = toNumber(overview?.issued_supply?.raw);
  const supplyCeiling = toNumber(overview?.supply_ceiling?.raw);
  const liveBackingValue = toNumber(overview?.backing_value?.raw);
  const ratioPct = overview
    ? Number(overview.collateralization_ratio.percent.replace("%", "")) || 0
    : 0;
  const epochWindowHours = overview?.mint_policy?.epoch_window_hours ?? 0;
  const utilization = supplyCeiling > 0 ? (liveSupply / supplyCeiling) * 100 : 0;
  const collateralBuffer = Math.max(liveBackingValue - liveSupply, 0);

  const phase = useMemo(() => derivePhase(overview), [overview]);
  const compliance = complianceLabel(ratioPct);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#F4F1EA]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,0,0,0.22),transparent_24%),radial-gradient(circle_at_top_right,rgba(139,0,0,0.10),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(139,0,0,0.12),transparent_22%)]" />

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
                    RUSD is SpherioChain’s USD-denominated settlement asset for payments,
                    commerce, accounting, billing, infrastructure settlement, and enterprise
                    or network usage. Its design progresses through three phases: Phase 1
                    bootstrap issuance, Phase 2 partial collateralization, and Phase 3 full
                    backing with overcollateralized reserve support. Throughout all phases,
                    RUSD is structured as a deterministic, non-algorithmic settlement asset
                    issued under strict monetary rules. It is not a governance token, not a
                    speculative asset, and not a substitute for RIO. RUSD serves settlement.
                    RIO serves gas, fees, and governance.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatePill strong>Integrity: LIVE</StatePill>
                <StatePill>Theme: Sovereign Crimson</StatePill>
                <StatePill>{overview ? "Monetary Feed Active" : "Feed Degraded"}</StatePill>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1700px] space-y-6 px-4 py-6 md:px-6 md:py-8 xl:px-8">
          {!overview ? (
            <div className="rounded-[28px] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(139,0,0,0.14),rgba(255,255,255,0.02))] p-5 text-sm leading-7 text-[#CFC7BE]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#F4F1EA]">
                Degraded state
              </div>
              <div className="mt-3">
                RUSD state is currently unavailable from the backend. The terminal remains online
                so the settlement posture, attestation framing, and policy structure can still be
                reviewed while the live state feed is restored.
              </div>
              {loadError ? (
                <div className="mt-2 text-[#9E948C]">Backend note: {loadError}</div>
              ) : null}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Issued Supply"
              value={overview?.issued_supply?.formatted ?? "—"}
              suffix="RUSD"
              sublabel="Live settlement units in circulation"
            />
            <KpiCard
              label="Supply Ceiling"
              value={overview?.supply_ceiling?.formatted ?? "—"}
              suffix="RUSD"
              sublabel="Active phase issuance ceiling"
            />
            <KpiCard
              label="Backing Reference"
              value={overview?.backing_value?.formatted ?? "—"}
              suffix="RUSD"
              sublabel="Current reserve / backing reference value"
            />
            <KpiCard
              label="Coverage Ratio"
              value={overview?.collateralization_ratio?.percent ?? "—"}
              sublabel="Current backing posture under active phase"
            />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <Section title="Institutional Overview" right={phase.title}>
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(139,0,0,0.16),rgba(255,255,255,0.03))] p-5">
                  <div className="text-[10px] uppercase tracking-[0.20em] text-[#9E948C]">
                    Nature of RUSD
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#9E948C]">
                        RUSD Is
                      </div>
                      <div className="mt-3 space-y-1 text-sm leading-7 text-[#CFC7BE]">
                        <div>• Phase-structured settlement asset</div>
                        <div>• Bootstrap issuance in Phase 1</div>
                        <div>• Partial collateralization in Phase 2</div>
                        <div>• Full backing and reserve maturity in Phase 3</div>
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
                      <div className="mt-3 space-y-1 text-sm leading-7 text-[#CFC7BE]">
                        <div>• A governance token</div>
                        <div>• A security or profit instrument</div>
                        <div>• An algorithmic stablecoin</div>
                        <div>• A speculative trading asset</div>
                        <div>• A substitute for RIO</div>
                        <div>• Operationally mixed with gas / governance logic</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] uppercase tracking-[0.20em] text-[#9E948C]">
                    Functional Separation
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[#CFC7BE]">
                    RUSD and RIO can never mix. RUSD is the settlement token for billing,
                    payments, commerce, accounting, and infrastructure usage. RIO is separate
                    and serves gas, fees, and governance. Their roles, custody logic, issuance
                    framing, reserve posture, and public representation must remain distinct
                    across the terminal, indexer, attestation layer, and explorer surfaces.
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] uppercase tracking-[0.20em] text-[#9E948C]">
                    Current phase posture
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[#CFC7BE]">
                    <div className="font-semibold text-[#F4F1EA]">{phase.title}</div>
                    <div className="mt-2">{phase.description}</div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Monetary Registry" right="Operational Truth">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Current Supply
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview?.issued_supply?.formatted ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Remaining Capacity
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview?.remaining_issuance_capacity?.formatted ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Daily Mint Cap
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview?.mint_policy?.daily_mint_cap?.formatted ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">RUSD</div>
                  </div>

                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Epoch Mint Cap
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[#F4F1EA]">
                      {overview?.mint_policy?.epoch_mint_cap?.formatted ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-[#CFC7BE]">
                      {overview ? `${epochWindowHours}h window` : "—"}
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
                        {overview ? `${utilization.toFixed(1)}%` : "—"}
                      </div>
                    </div>
                    <div className="text-right text-sm text-[#CFC7BE]">
                      current supply / active ceiling
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8B0000,#B22222,#F4F1EA)]"
                      style={{ width: `${overview ? Math.min(utilization, 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                        Reserve / Backing Posture
                      </div>
                      <div className="mt-2 text-3xl font-semibold text-[#F4F1EA]">
                        {overview?.collateralization_ratio?.percent ?? "—"}
                      </div>
                    </div>
                    <div className="text-right text-sm text-[#CFC7BE]">{compliance}</div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8B0000,#B22222,#F4F1EA)]"
                      style={{
                        width: `${overview ? Math.min((ratioPct / 160) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                    Institutional Registry
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-[#CFC7BE]">
                    <div>
                      Treasury Multisig:{" "}
                      <span className="text-[#F4F1EA]">
                        {shortAddr(overview?.treasury_multisig)}
                      </span>
                    </div>
                    <div>
                      Token Contract:{" "}
                      <span className="text-[#F4F1EA]">
                        {shortAddr(overview?.contract_address)}
                      </span>
                    </div>
                    <div>
                      Source Mode:{" "}
                      <span className="text-[#F4F1EA]">
                        {sourceModeLabel(overview?.source?.mode)}
                      </span>
                    </div>
                    <div>
                      Updated:{" "}
                      <span className="text-[#F4F1EA]">
                        {overview?.updated_at
                          ? new Date(overview.updated_at).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    <div>
                      Buffer:{" "}
                      <span className="text-[#F4F1EA]">{formatInt(collateralBuffer)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          <Section
            title="Attestation & Reserve Evolution"
            right={`Current phase: ${phase.short}`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.02]">
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Dimension
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Phase 1 · Bootstrap
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Phase 2 · Partial
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Phase 3 · Fully Backed
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-[#9E948C]">
                      Current / Evidence
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <TableCell>Settlement posture</TableCell>
                    <TableCell muted>Bootstrap settlement layer established</TableCell>
                    <TableCell muted>Settlement grows with partial reserve support</TableCell>
                    <TableCell muted>Institutional settlement-grade maturity</TableCell>
                    <TableCell>{phase.title}</TableCell>
                  </tr>

                  <tr>
                    <TableCell>Collateral / reserve posture</TableCell>
                    <TableCell muted>Not yet fully collateralized</TableCell>
                    <TableCell muted>Partial collateralization introduced</TableCell>
                    <TableCell muted>Full backing with overcollateralized support</TableCell>
                    <TableCell>
                      {overview?.collateralization_ratio?.percent ?? "—"} · {compliance}
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Issuance discipline</TableCell>
                    <TableCell muted>Bootstrap issuance under strict limits</TableCell>
                    <TableCell muted>Controlled expansion with reserve progression</TableCell>
                    <TableCell muted>Reserve-mature issuance discipline</TableCell>
                    <TableCell>
                      Daily {overview?.mint_policy?.daily_mint_cap?.formatted ?? "—"} · Epoch{" "}
                      {overview?.mint_policy?.epoch_mint_cap?.formatted ?? "—"}
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Attestation depth</TableCell>
                    <TableCell muted>Initial operational disclosure</TableCell>
                    <TableCell muted>Periodic backing / reserve evidence</TableCell>
                    <TableCell muted>Institutional attestation and reserve maturity</TableCell>
                    <TableCell>{sourceModeLabel(overview?.source?.mode)}</TableCell>
                  </tr>

                  <tr>
                    <TableCell>Periodic update rhythm</TableCell>
                    <TableCell muted>Operational refresh cadence begins</TableCell>
                    <TableCell muted>Scheduled periodic evidence updates</TableCell>
                    <TableCell muted>Formal recurring attestation cadence</TableCell>
                    <TableCell>
                      {overview?.updated_at
                        ? new Date(overview.updated_at).toLocaleString()
                        : "No recent update"}
                    </TableCell>
                  </tr>

                  <tr>
                    <TableCell>Explorer iteration path</TableCell>
                    <TableCell muted>Settlement overview surface</TableCell>
                    <TableCell muted>Policy + reserve progression surface</TableCell>
                    <TableCell muted>Full institutional attestation surface</TableCell>
                    <TableCell>Reusable for RioExplorer institutional asset pages</TableCell>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                  Current source mode
                </div>
                <div className="mt-2 text-lg font-semibold text-[#F4F1EA]">
                  {sourceModeLabel(overview?.source?.mode)}
                </div>
                <div className="mt-2 text-sm leading-7 text-[#CFC7BE]">
                  This indicates whether the page is reading live attestation bridge data
                  or operating in fallback disclosure mode.
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                  Active ceiling
                </div>
                <div className="mt-2 text-lg font-semibold text-[#F4F1EA]">
                  {overview?.supply_ceiling?.formatted ?? "—"} RUSD
                </div>
                <div className="mt-2 text-sm leading-7 text-[#CFC7BE]">
                  This should represent the issuance ceiling under the current phase,
                  not an overstated final-state ceiling.
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#9E948C]">
                  Periodic update posture
                </div>
                <div className="mt-2 text-lg font-semibold text-[#F4F1EA]">
                  {overview?.updated_at
                    ? new Date(overview.updated_at).toLocaleTimeString()
                    : "Unavailable"}
                </div>
                <div className="mt-2 text-sm leading-7 text-[#CFC7BE]">
                  This module is designed to mature into a periodic attestation surface with
                  cleaner evidence history and institutional update discipline.
                </div>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
