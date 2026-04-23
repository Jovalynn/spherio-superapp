"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type PumpCreateSuccess = {
  projectId: string;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  totalSupply: string;
  description: string;
  website: string;
  xHandle: string;
  telegram: string;
  discord?: string;
  youtube?: string;
  logoUrl?: string;
  screenerUrl: string;
  tradeUrl: string;
  liquidityUrl: string;
  rioExUrl: string;
  momentum: {
    stage: "momentum";
    graduationTarget: "lp_activation";
    baseAsset: "RIO";
    launchRail: "pump.live";
    standard: "SPO-20";
  };
  graduation: {
    progressPercent: number;
    graduationReady: boolean;
    stage: "momentum" | "watch" | "ready" | "graduated";
    stageLabel: string;
    metrics: {
      holders: number;
      watchers: number;
      momentumScore: number;
      liquidityCommittedRio: number;
    };
  };
  protection: {
    status: {
      launchIntegrityReady: boolean;
    };
    risk: {
      integrityScore: number;
    };
  };
  economicsPolicy: {
    graduationTargetUsdMin: number;
    graduationTargetUsdMax: number;
    lpTargetUsd: number;
    defaultBaseAsset: "RIO";
  };
};

type PumpMetadataPackage = {
  projectId: string;
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  totalSupply: string;
  rioExProfilePreviewUrl?: string;
  economicsPolicy: {
    graduationTargetUsdMin: number;
    graduationTargetUsdMax: number;
    lpTargetUsd: number;
    defaultBaseAsset: "RIO";
  };
};

type LaunchCardAccent =
  | "aqua"
  | "sunset"
  | "violet"
  | "gold"
  | "mint"
  | "amber"
  | "slate"
  | "emerald";

type LaunchCardTrend = "hot" | "watch" | "ready";

type LaunchCardState = {
  id: string;
  rail: "pump" | "prime";
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  logoUrl?: string;
  ageLabel: string;
  marketCapUsd: number;
  progressPercent: number;
  trend: LaunchCardTrend;
  accent: LaunchCardAccent;
};

type LaunchLifecycleStep = {
  key: string;
  label: string;
  status: "complete" | "active" | "pending" | "optional";
};

type LaunchLifecycleState = {
  rail: "pump" | "prime";
  progressPercent: number;
  steps: LaunchLifecycleStep[];
};

type PumpLaunchSurfaceState = {
  apexLeader: LaunchCardState | null;
  newlyLaunched: LaunchCardState[];
  monitorCards: LaunchCardState[];
  lifecycle: LaunchLifecycleState;
};

type PumpLaunchSurfaceResponse = {
  ok: boolean;
  source?: string;
  error?: string;
  state?: PumpLaunchSurfaceState;
};

function shell() {
  return "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.16),transparent_20%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_18%),radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_16%),linear-gradient(180deg,#030612_0%,#050a16_42%,#04070d_100%)] text-white";
}

function terminalCard(extra = "") {
  return `rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,32,0.94),rgba(6,10,21,0.98))] shadow-[0_24px_80px_-38px_rgba(0,0,0,0.9)] backdrop-blur-xl ${extra}`;
}

function sectionEyebrow() {
  return "text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/85";
}

function fieldLabel(text: string) {
  return (
    <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200/82">
      {text}
    </label>
  );
}

function inputClass() {
  return "mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#050914] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/10";
}

function textAreaClass() {
  return "mt-2 min-h-[108px] w-full rounded-2xl border border-white/10 bg-[#050914] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/45 focus:ring-2 focus:ring-fuchsia-500/10";
}

function pill(kind: "pink" | "cyan" | "amber" | "emerald" | "gold" | "neutral" = "neutral") {
  const styles = {
    pink: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    gold: "border-yellow-300/25 bg-yellow-400/10 text-yellow-200",
    neutral: "border-white/10 bg-white/[0.05] text-white/75",
  };

  return `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${styles[kind]}`;
}

function actionButton(primary = false) {
  return primary
    ? "inline-flex h-11 items-center justify-center rounded-2xl border border-fuchsia-400/28 bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(168,85,247,0.96))] px-5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_-18px_rgba(34,211,238,0.68)] transition hover:translate-y-[-1px]"
    : "inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white/88 transition hover:bg-white/[0.08]";
}

function compactMoneyLabel(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function accentClasses(accent: LaunchCardAccent) {
  if (accent === "aqua") {
    return "border-cyan-400/26 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(59,130,246,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "sunset") {
    return "border-orange-400/24 bg-[linear-gradient(135deg,rgba(249,115,22,0.16),rgba(236,72,153,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "violet") {
    return "border-fuchsia-400/24 bg-[linear-gradient(135deg,rgba(217,70,239,0.16),rgba(99,102,241,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "gold") {
    return "border-yellow-400/24 bg-[linear-gradient(135deg,rgba(250,204,21,0.16),rgba(245,158,11,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "mint") {
    return "border-emerald-400/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(34,197,94,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "amber") {
    return "border-amber-400/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(251,191,36,0.10),rgba(255,255,255,0.02))]";
  }
  if (accent === "slate") {
    return "border-sky-400/24 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(148,163,184,0.10),rgba(255,255,255,0.02))]";
  }
  return "border-emerald-400/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(34,197,94,0.10),rgba(255,255,255,0.02))]";
}

function gradientBar(accent: LaunchCardAccent) {
  if (accent === "aqua") {
    return "bg-[linear-gradient(90deg,rgba(34,211,238,0.96),rgba(59,130,246,0.95),rgba(168,85,247,0.88))]";
  }
  if (accent === "sunset") {
    return "bg-[linear-gradient(90deg,rgba(249,115,22,0.96),rgba(251,191,36,0.94),rgba(236,72,153,0.88))]";
  }
  if (accent === "violet") {
    return "bg-[linear-gradient(90deg,rgba(217,70,239,0.96),rgba(168,85,247,0.94),rgba(59,130,246,0.88))]";
  }
  if (accent === "gold") {
    return "bg-[linear-gradient(90deg,rgba(250,204,21,0.96),rgba(245,158,11,0.94),rgba(251,191,36,0.88))]";
  }
  if (accent === "mint") {
    return "bg-[linear-gradient(90deg,rgba(16,185,129,0.96),rgba(34,197,94,0.94),rgba(34,211,238,0.88))]";
  }
  if (accent === "amber") {
    return "bg-[linear-gradient(90deg,rgba(245,158,11,0.96),rgba(251,191,36,0.94),rgba(255,255,255,0.88))]";
  }
  if (accent === "slate") {
    return "bg-[linear-gradient(90deg,rgba(56,189,248,0.96),rgba(148,163,184,0.90),rgba(255,255,255,0.82))]";
  }
  return "bg-[linear-gradient(90deg,rgba(16,185,129,0.96),rgba(34,197,94,0.94),rgba(34,211,238,0.88))]";
}

function trendPill(trend: LaunchCardTrend) {
  if (trend === "hot") return pill("amber");
  if (trend === "ready") return pill("emerald");
  return pill("pink");
}

export default function PumpCreatePage() {
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [youtube, setYoutube] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [createdToken, setCreatedToken] = useState<PumpCreateSuccess | null>(null);
  const [metadataPackage, setMetadataPackage] = useState<PumpMetadataPackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [surfaceState, setSurfaceState] = useState<PumpLaunchSurfaceState | null>(null);
  const [surfaceError, setSurfaceError] = useState("");
  const [surfaceLoading, setSurfaceLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSurfaceState() {
      try {
        setSurfaceLoading(true);
        setSurfaceError("");

        const response = await fetch("/api/launches/pump", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as PumpLaunchSurfaceResponse;

        if (!response.ok || !data.ok || !data.state) {
          throw new Error(data.error || "Failed to load Pump launch state.");
        }

        if (!cancelled) {
          setSurfaceState(data.state);
        }
      } catch (error) {
        if (!cancelled) {
          setSurfaceError(
            error instanceof Error ? error.message : "Failed to load Pump launch state.",
          );
          setSurfaceState(null);
        }
      } finally {
        if (!cancelled) {
          setSurfaceLoading(false);
        }
      }
    }

    loadSurfaceState();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogoPick() {
    fileInputRef.current?.click();
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  async function handleLaunch() {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/pump/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenName: tokenName || "Pump Launch",
          symbol: symbol || "PUMP",
          totalSupply: supply || "1000000000",
          description,
          website,
          xHandle,
          telegram,
          discord,
          youtube,
          logoUrl: logoFileName ? `upload://${logoFileName}` : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create Pump launch");
      }

      setCreatedToken(data.success);
      setMetadataPackage(data.metadataPackage ?? null);

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.href = data.success?.liquidityUrl || "/liquidity";
        }, 700);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Pump launch failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const economicsPolicy =
    createdToken?.economicsPolicy || metadataPackage?.economicsPolicy || null;

  const newlyLaunched = surfaceState?.newlyLaunched ?? [];
  const apexLeader = surfaceState?.apexLeader ?? null;

  const monitorCards = useMemo(() => {
    const createdCard =
      createdToken != null
        ? [
            {
              id: createdToken.projectId,
              rail: "pump" as const,
              tokenAddress: createdToken.tokenAddress,
              tokenName: createdToken.tokenName,
              symbol: createdToken.symbol,
              ageLabel: "just now",
              marketCapUsd: Math.max(
                createdToken.graduation.metrics.liquidityCommittedRio * 3.8,
                2400,
              ),
              progressPercent: createdToken.graduation.progressPercent,
              trend: createdToken.graduation.graduationReady ? ("ready" as const) : ("watch" as const),
              accent: createdToken.graduation.graduationReady
                ? ("gold" as const)
                : ("mint" as const),
            },
          ]
        : [];

    const authorityCards = surfaceState?.monitorCards ?? [];
    return [...createdCard, ...authorityCards];
  }, [createdToken, surfaceState]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monitorCards;

    return monitorCards.filter(
      (card) =>
        card.tokenName.toLowerCase().includes(q) ||
        card.symbol.toLowerCase().includes(q) ||
        card.tokenAddress.toLowerCase().includes(q),
    );
  }, [monitorCards, search]);

  const lifecycle = surfaceState?.lifecycle ?? {
    rail: "pump" as const,
    progressPercent: apexLeader?.progressPercent ?? 0,
    steps: [],
  };

  return (
    <main className={shell()}>
      <div className="mx-auto max-w-[1660px] p-4">
        <div className="space-y-5">
          <section className={terminalCard("px-5 py-4")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/78">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(168,85,247,0.14))] text-base font-semibold text-cyan-200">
                    P
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-300/85">
                      Pump.live
                    </div>
                    <div className="text-lg font-semibold text-white">Momentum Launchpad</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={actionButton(false)}>
                  Watch List
                </button>
                <button type="button" className={actionButton(false)}>
                  Graduated
                </button>
                <button type="button" className={actionButton(false)}>
                  Platforms
                </button>
                <button type="button" className={actionButton(true)}>
                  Create PUMP Token
                </button>
              </div>
            </div>
          </section>

          <section className={terminalCard("px-5 py-4")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className={sectionEyebrow()}>Pump lifecycle</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Create → Curve → LP → Market
                </div>
                <div className="mt-1 text-sm text-white/62">
                  Truth-first lifecycle rail for Pump launches.
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Lifecycle progression
                </div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">
                  {lifecycle.progressPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(168,85,247,0.96),rgba(251,191,36,0.92))]"
                style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
              {lifecycle.steps.map((step) => {
                const isCompleted = step.status === "complete";
                const isActive = step.status === "active";
                const isOptional = step.status === "optional";

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                      isCompleted
                        ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
                        : isActive
                          ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200"
                          : isOptional
                            ? "border-amber-400/25 bg-amber-500/8 text-amber-200"
                            : "border-white/10 bg-white/[0.03] text-white/58"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="flex min-h-[720px] flex-col justify-center gap-4">
              <div className={terminalCard("p-4 relative overflow-hidden")}>
                <div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
                <div className="absolute left-24 top-28 h-28 w-28 rounded-full bg-amber-400/8 blur-3xl" />

                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Apex Leader</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {apexLeader?.tokenName || "No live leader yet"}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={pill("cyan")}>{apexLeader?.symbol || "PUMP"}</span>
                      <span className={pill("amber")}>Apex Launch</span>
                      <span className={pill("emerald")}>About to graduate</span>
                    </div>
                  </div>

                  <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-[18px] border border-fuchsia-400/24 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(34,211,238,0.12))] text-xl font-bold text-white shadow-[0_10px_30px_-16px_rgba(168,85,247,0.7)]">
                    {apexLeader?.symbol.slice(0, 2) || "AX"}
                  </div>
                </div>

                <div
                  className={`relative mt-4 rounded-[24px] border p-5 ${
                    apexLeader ? accentClasses(apexLeader.accent) : accentClasses("violet")
                  }`}
                >
                  <div className="absolute right-4 top-4">
                    <span className={pill("gold")}>On fire</span>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[20px] border border-white/12 bg-white/[0.06] text-2xl font-bold text-white shadow-[0_10px_30px_-18px_rgba(34,211,238,0.75)]">
                      {apexLeader?.symbol.slice(0, 2) || "PX"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="truncate text-[28px] font-semibold leading-none text-white">
                          {apexLeader?.tokenName || "Apex token"}
                        </div>
                        <div className="mt-3 text-sm leading-6 text-white/74">
                          Highest market cap on the live Pump rail, pressing toward graduation.
                        </div>
                      </div>

                      <div className="mt-5 text-4xl font-bold tracking-tight text-amber-300">
                        {compactMoneyLabel(apexLeader?.marketCapUsd || 0)}
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        {apexLeader?.ageLabel || "—"} old
                      </div>

                      <div className="mt-5 h-3 rounded-full bg-white/10">
                        <div
                          className={`h-3 rounded-full ${
                            apexLeader ? gradientBar(apexLeader.accent) : gradientBar("violet")
                          }`}
                          style={{
                            width: `${Math.min(apexLeader?.progressPercent || 0, 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                        <span>Bonding curve progression</span>
                        <span>{(apexLeader?.progressPercent || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {surfaceLoading ? (
                  <div className="mt-4 text-sm text-white/55">Loading authority state...</div>
                ) : null}
                {surfaceError ? (
                  <div className="mt-4 text-sm text-rose-300">{surfaceError}</div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_0.95fr]">
                <div className={terminalCard("p-4")}>
                  <div className={sectionEyebrow()}>Newly launched</div>
                  <div className="mt-3 space-y-3">
                    {newlyLaunched.length ? (
                      newlyLaunched.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 text-white ${accentClasses(item.accent)}`}
                        >
                          <div className="text-sm text-white/72">New Token Created</div>
                          <div className="mt-1 text-2xl font-semibold">{item.symbol}</div>
                          <div className="mt-1 text-sm text-white/56">{item.ageLabel}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/58">
                        No newly launched Pump assets yet.
                      </div>
                    )}

                    <div className="rounded-xl bg-[linear-gradient(90deg,rgba(249,115,22,0.08),rgba(255,255,255,0.03))] px-3 py-3 text-sm text-white/70">
                      BAG (bagworker)
                    </div>
                    <div className="rounded-xl bg-[linear-gradient(90deg,rgba(217,70,239,0.08),rgba(255,255,255,0.03))] px-3 py-3 text-sm text-white/70">
                      USDC (Stable Dog Coin)
                    </div>
                  </div>
                </div>

                <div className={terminalCard("p-4")}>
                  <div className={sectionEyebrow()}>Search & rail</div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="h-11 flex-1 rounded-2xl border border-white/10 bg-[#050914] px-4 text-sm text-white outline-none placeholder:text-slate-500"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="search all"
                    />
                    <button type="button" className={actionButton(false)}>
                      Filter
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className={actionButton(false)}>
                      Hot 🔥
                    </button>
                    <button type="button" className={actionButton(false)}>
                      Watch 👀
                    </button>
                    <button type="button" className={actionButton(false)}>
                      Graduated 🎓
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={terminalCard("p-6 lg:p-8 relative overflow-hidden")}>
              <div className="absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-fuchsia-500/8 blur-3xl" />
              <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-amber-400/8 blur-3xl" />

              <div className="relative mx-auto flex max-w-[760px] flex-col justify-center">
                <div className="text-center">
                  <div className={sectionEyebrow()}>Create</div>
                  <div className="mt-2 text-[36px] font-bold tracking-tight text-white">
                    Create PUMP Token
                  </div>
                  <div className="mx-auto mt-3 max-w-[560px] text-sm leading-6 text-white/68">
                    Launch your token, then continue into Liquidity, Discovery, Screener, Trade,
                    and RioEx.
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className={pill("pink")}>Fun-first launch</span>
                    <span className={pill("cyan")}>Live momentum rail</span>
                    <span className={pill("amber")}>Graduation-ready</span>
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      {fieldLabel("Coin name")}
                      <input
                        className={inputClass()}
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder="Name your coin"
                      />
                    </div>
                    <div>
                      {fieldLabel("Ticker")}
                      <input
                        className={inputClass()}
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="Add ticker"
                      />
                    </div>
                  </div>

                  <div>
                    {fieldLabel("Total supply")}
                    <input
                      className={inputClass()}
                      value={supply}
                      onChange={(e) => setSupply(e.target.value)}
                      placeholder="1000000000"
                    />
                  </div>

                  <div>
                    {fieldLabel("Description")}
                    <textarea
                      className={textAreaClass()}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write a short description"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      {fieldLabel("Website")}
                      <input
                        className={inputClass()}
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      {fieldLabel("X / Twitter")}
                      <input
                        className={inputClass()}
                        value={xHandle}
                        onChange={(e) => setXHandle(e.target.value)}
                        placeholder="@project"
                      />
                    </div>
                    <div>
                      {fieldLabel("Telegram")}
                      <input
                        className={inputClass()}
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="t.me/..."
                      />
                    </div>
                    <div>
                      {fieldLabel("Discord")}
                      <input
                        className={inputClass()}
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="discord.gg/..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      {fieldLabel("YouTube / Media")}
                      <input
                        className={inputClass()}
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        placeholder="youtube.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    {fieldLabel("Logo")}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#050914] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-white/45">No logo</span>
                          )}
                        </div>
                        <div className="text-sm text-white/72">
                          {logoFileName || "Upload PNG, JPG, WEBP, or SVG"}
                        </div>
                      </div>

                      <button type="button" onClick={handleLogoPick} className={actionButton(false)}>
                        Choose
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(34,211,238,0.06),rgba(168,85,247,0.06),rgba(251,191,36,0.06))] px-4 py-3 text-sm text-slate-300">
                    $
                    {economicsPolicy?.graduationTargetUsdMin.toLocaleString() || "60,000"}–$
                    {economicsPolicy?.graduationTargetUsdMax.toLocaleString() || "65,000"} / $
                    {economicsPolicy?.lpTargetUsd.toLocaleString() || "15,000"} LP
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunch}
                    disabled={isSubmitting}
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-fuchsia-400/22 bg-[linear-gradient(90deg,rgba(34,211,238,0.98),rgba(168,85,247,0.96))] px-5 py-4 text-sm font-extrabold text-slate-950 shadow-[0_18px_40px_-18px_rgba(34,211,238,0.72)] disabled:opacity-50"
                  >
                    {isSubmitting ? "Launching..." : "Create PUMP Token"}
                  </button>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" className={actionButton(false)}>
                      Hot 🔥
                    </button>
                    <button type="button" className={actionButton(false)}>
                      Watch list ⭐
                    </button>
                    <button type="button" className={actionButton(false)}>
                      Graduated 🎓
                    </button>
                    <button type="button" className={actionButton(false)}>
                      Platforms 🌎
                    </button>
                    <button type="button" className={actionButton(true)}>
                      Create PUMP Token
                    </button>
                  </div>

                  {createdToken ? (
                    <div className="rounded-2xl border border-emerald-400/18 bg-[linear-gradient(180deg,rgba(6,78,59,0.38),rgba(4,48,38,0.44))] p-4">
                      <div className="text-sm font-semibold text-emerald-300">
                        {createdToken.tokenName} ({createdToken.symbol}) launched
                      </div>
                      <div className="mt-2 break-all text-xs text-white/60">
                        {createdToken.tokenAddress}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <a href={createdToken.liquidityUrl} className={actionButton(false)}>
                          Liquidity
                        </a>
                        <a href="/createtoken/pump/board" className={actionButton(false)}>
                          Discovery
                        </a>
                        <a href={createdToken.tradeUrl} className={actionButton(true)}>
                          Trade
                        </a>
                        <a href={createdToken.rioExUrl} className={actionButton(false)}>
                          RioEx
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={terminalCard("p-4")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className={sectionEyebrow()}>Momentum Monitor</div>
                <div className="mt-2 text-xl font-semibold text-white">Live Pump Cards</div>
                <div className="mt-1 text-sm text-white/60">
                  Authority-shaped launch cards for Pump surfaces.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className={actionButton(false)}>
                  Hot 🔥
                </button>
                <button type="button" className={actionButton(false)}>
                  Watch list ⭐
                </button>
                <button type="button" className={actionButton(false)}>
                  Graduated 🎓
                </button>
                <button type="button" className={actionButton(false)}>
                  Platforms 🌎
                </button>
                <button type="button" className={actionButton(true)}>
                  Create PUMP Token
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className={`rounded-[24px] border p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)] ${accentClasses(card.accent)}`}
                >
                  <div className="flex gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[18px] border border-white/12 bg-white/[0.05] text-2xl font-bold text-white">
                      {card.symbol.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="truncate text-[26px] font-semibold leading-none text-white">
                            {card.tokenName}
                          </div>
                          <div className="mt-2 text-sm text-white/64">{card.symbol}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-white/72">{card.ageLabel}</div>
                          <div className="mt-2">{trendPill(card.trend)}</div>
                        </div>
                      </div>

                      <div className="mt-6 text-[34px] font-bold leading-none text-white">
                        {compactMoneyLabel(card.marketCapUsd)}
                      </div>

                      <div className="mt-4 h-3 rounded-full bg-white/10">
                        <div
                          className={`h-3 rounded-full ${gradientBar(card.accent)}`}
                          style={{ width: `${Math.min(card.progressPercent, 100)}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                        <span>Bonding curve progression</span>
                        <span>{card.progressPercent.toFixed(2)}%</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href="/createtoken/pump/board" className={actionButton(false)}>
                          Monitor
                        </a>
                        <a href="/liquidity" className={actionButton(false)}>
                          LP
                        </a>
                        <a href="/createtoken/pump/board" className={actionButton(true)}>
                          Open
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!filteredCards.length && !surfaceLoading ? (
                <div className="md:col-span-2 rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
                  No launch cards match your search.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
