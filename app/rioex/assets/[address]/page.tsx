"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ExchangeSurfaceNav from "@/components/exchange/ExchangeSurfaceNav";

type RioExAssetProfile = {
  assetAddress: string;
  assetSymbol: string;
  assetName: string;
  profileType: "prime_launch";
  classification: {
    templateId: string;
    templateName: string;
    hybridLabel?: string;
    screenerLabel: string;
  };
  launch: {
    projectId: string;
    liquidityBase: string;
    liquidityMode: string;
  };
  intelligence: {
    aiContext: string;
    aiOutputs: string[];
    powerUps: string[];
    liquidityGuidance: string[];
    requiredDisclosures: string[];
    reviewSections: {
      id: string;
      title: string;
      items: string[];
    }[];
  };
  actions: string[];
};

type AssetProfileResponse = {
  ok: boolean;
  profile?: RioExAssetProfile;
  error?: string;
};

function shellClass() {
  return "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(37,10,24,0.82),rgba(10,9,18,0.94))] p-5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:p-6";
}

function heroCardClass() {
  return "rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,28,60,0.92),rgba(10,15,36,0.96))] p-5";
}

function cardClass() {
  return "rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 backdrop-blur-xl";
}

function pillClass(kind: "gold" | "green" | "violet" | "neutral" = "neutral") {
  if (kind === "gold") {
    return "rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200";
  }
  if (kind === "green") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200";
  }
  if (kind === "violet") {
    return "rounded-full border border-fuchsia-400/25 bg-fuchsia-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-fuchsia-200";
  }
  return "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75";
}

function buttonClass(primary = false) {
  return primary
    ? "inline-flex h-11 items-center justify-center rounded-2xl border border-cyan-400 bg-cyan-400/8 px-4 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/12"
    : "inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/90 hover:bg-white/[0.08]";
}

function actionTagClass() {
  return "rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/85";
}

function shortValue(value?: string | null, left = 12, right = 10) {
  if (!value) return "—";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

function prettifyAction(action: string) {
  return action
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function screenerHref(address: string) {
  return `/riodex/markets?token=${encodeURIComponent(address)}`;
}

function tradeHref(address: string) {
  return `/riodex/markets?token=${encodeURIComponent(address)}&live=1`;
}

function liquidityHref(address: string, base?: string | null, symbol?: string | null, projectId?: string | null) {
  return `/riodex/liquidity?source=createtoken&mode=add&token=${encodeURIComponent(
    address,
  )}&base=${encodeURIComponent(base || "RIO")}&symbol=${encodeURIComponent(symbol || "")}&project=${encodeURIComponent(
    projectId || "prime_launch",
  )}`;
}

function buildProfileFetchUrl(address: string, searchParams: URLSearchParams) {
  const qs = searchParams.toString();
  return qs
    ? `/api/rioex/assets/${encodeURIComponent(address)}?${qs}`
    : `/api/rioex/assets/${encodeURIComponent(address)}`;
}

export default function RioExAssetProfilePage() {
  const params = useParams<{ address: string }>();
  const searchParams = useSearchParams();

  const address = typeof params?.address === "string" ? params.address : "";

  const [data, setData] = useState<AssetProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!address) {
        setError("Asset address is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(buildProfileFetchUrl(address, new URLSearchParams(queryString)), {
          cache: "no-store",
        });

        const raw = await response.text();
        const json: AssetProfileResponse | null = raw ? JSON.parse(raw) : null;

        if (!response.ok || !json?.ok || !json?.profile) {
          throw new Error(json?.error || "Failed to load RioEx asset profile.");
        }

        if (!active) return;
        setData(json);
      } catch (e: any) {
        if (!active) return;
        setData(null);
        setError(e?.message || "Failed to load RioEx asset profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [address, queryString]);

  const profile = data?.profile || null;

  const featured = profile
    ? {
        displaySymbol: profile.assetSymbol,
        liquidityUsd: 0,
        feeBps: 0,
        isCanonical: false,
        isLive: true,
        routes: {
          assetTerminal: `/rioex/assets/${encodeURIComponent(profile.assetAddress)}${queryString ? `?${queryString}` : ""}`,
          marketBoard: "/rioex/assets",
          hero: "/rioex/assets",
          trade: "/rioex",
          pool: "/riodex/pools",
          swap: "/riodex/swap",
          liquidity: "/riodex/pools",
        },
      }
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(157,23,77,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,211,238,0.10),transparent_20%),linear-gradient(180deg,#04070d_0%,#060912_42%,#04070d_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <ExchangeSurfaceNav
          product="rioex"
          activeKey="assets"
          featured={featured}
          title="RioEx Asset Profile"
          subtitle="Prime launch intelligence bridge for asset identity, disclosures, liquidity posture, and future listing-readiness surfaces."
        />

        <section className={shellClass()}>
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              Loading RioEx asset profile…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-sm text-amber-200">
              {error}
            </div>
          ) : !profile ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
              No RioEx asset profile is available.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[0.95fr_0.65fr]">
                <div className={heroCardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/50">RioEx • Prime Asset Intelligence</div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{profile.assetSymbol}</h1>
                  <div className="mt-2 text-base text-white/70">{profile.assetName}</div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={pillClass("gold")}>{profile.classification.templateName}</span>
                    {profile.classification.hybridLabel ? <span className={pillClass("violet")}>{profile.classification.hybridLabel}</span> : null}
                    <span className={pillClass("green")}>{profile.launch.liquidityBase}</span>
                    <span className={pillClass()}>{profile.launch.liquidityMode}</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className={cardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Asset Address</div>
                      <div className="mt-2 break-all text-sm font-medium text-white">{profile.assetAddress}</div>
                    </div>
                    <div className={cardClass()}>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">Project ID</div>
                      <div className="mt-2 text-sm font-medium text-white">{profile.launch.projectId}</div>
                    </div>
                  </div>

                                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/rioex/assets" className={buttonClass(false)}>
                      Back to Assets
                    </Link>
                    <Link
                      href={liquidityHref(
                        profile.assetAddress,
                        profile.launch.liquidityBase,
                        profile.assetSymbol,
                        profile.launch.projectId,
                      )}
                      className={buttonClass(false)}
                    >
                      Add LP
                    </Link>
                    <Link href={screenerHref(profile.assetAddress)} className={buttonClass(false)}>
                      Screener
                    </Link>
                    <Link href={tradeHref(profile.assetAddress)} className={buttonClass(true)}>
                      Trade
                    </Link>
                    <Link
                      href={`/rioexplorer?address=${encodeURIComponent(profile.assetAddress)}`}
                      className={buttonClass(false)}
                    >
                      RioExplorer
                    </Link>
                  </div>                
                </div>

                <div className={heroCardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Launch Classification</div>
                  <div className="mt-4 space-y-3 text-sm text-white/82">
                    <div className="flex items-center justify-between gap-4">
                      <span>Profile Type</span>
                      <span className="font-semibold text-white">{profile.profileType}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Template ID</span>
                      <span className="font-semibold text-white">{profile.classification.templateId}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Template Name</span>
                      <span className="font-semibold text-white">{profile.classification.templateName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Screener Label</span>
                      <span className="font-semibold text-white">{profile.classification.screenerLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Hybrid Label</span>
                      <span className="font-semibold text-white">{profile.classification.hybridLabel || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Liquidity Base</span>
                      <span className="font-semibold text-white">{profile.launch.liquidityBase}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Liquidity Mode</span>
                      <span className="font-semibold text-white">{profile.launch.liquidityMode}</span>
                    </div>
                  </div>
                </div>
              </div>

                           <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Prime Intelligence Package
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-white/82">
                    <div className="flex items-center justify-between gap-4">
                      <span>Template</span>
                      <span className="font-semibold text-white">{profile.classification.templateName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>AI Outputs</span>
                      <span className="font-semibold text-white">{profile.intelligence.aiOutputs.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Power-ups</span>
                      <span className="font-semibold text-white">{profile.intelligence.powerUps.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Disclosures</span>
                      <span className="font-semibold text-white">{profile.intelligence.requiredDisclosures.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Review Sections</span>
                      <span className="font-semibold text-white">{profile.intelligence.reviewSections.length}</span>
                    </div>
                  </div>
                </div>

                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Market Path
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {["Create", "LP", "Screener", "Trade"].map((step) => (
                      <div
                        key={step}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-white"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-cyan-400/16 bg-cyan-500/6 px-4 py-4 text-sm leading-7 text-white/78">
                    This asset profile represents the RioEx intelligence layer after creation. Once liquidity is added,
                    the market path becomes Create → LP → Screener → Trade → RioEx.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">AI Reference Context</div>
                  <div className="mt-3 text-sm leading-7 text-white/80">{profile.intelligence.aiContext || "No AI context provided."}</div>

                  <div className="mt-5 grid gap-3">
                    {profile.intelligence.aiOutputs.length ? (
                      profile.intelligence.aiOutputs.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                        >
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                        No AI output prompts attached yet.
                      </div>
                    )}
                  </div>
                </div>

                 <div className="grid gap-4">
                  <div className={cardClass()}>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Template Power-ups</div>
                    <div className="mt-4 grid gap-3">
                      {profile.intelligence.powerUps.length ? (
                        profile.intelligence.powerUps.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                          No template power-ups attached yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cardClass()}>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Execution Actions</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.actions.length ? (
                        profile.actions.map((action) => (
                          <span key={action} className={actionTagClass()}>
                            {prettifyAction(action)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/50">No action layer attached yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Liquidity Guidance</div>
                  <div className="mt-4 grid gap-3">
                    {profile.intelligence.liquidityGuidance.length ? (
                      profile.intelligence.liquidityGuidance.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                        >
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                        No liquidity guidance attached yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className={cardClass()}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Required Disclosures</div>
                  <div className="mt-4 grid gap-3">
                    {profile.intelligence.requiredDisclosures.length ? (
                      profile.intelligence.requiredDisclosures.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                        >
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                        No disclosures attached yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={cardClass()}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Review Sections</div>
                    <div className="mt-1 text-sm text-white/60">Template-governed review breakdown for future RioEx intelligence surfaces.</div>
                  </div>
                  <div className="text-sm font-semibold text-white">{profile.intelligence.reviewSections.length}</div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {profile.intelligence.reviewSections.length ? (
                    profile.intelligence.reviewSections.map((section) => (
                      <div key={section.id} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-sm font-semibold text-white">{section.title}</div>
                        <div className="mt-3 space-y-2">
                          {section.items.map((item) => (
                            <div key={item} className="rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/78">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
                      Review sections are not attached to this preview yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-cyan-400/16 bg-cyan-500/6 px-5 py-4 text-sm text-white/85">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    RioEx Bridge
                  </span>
                  <span className={pillClass()}>{shortValue(profile.assetAddress, 12, 10)}</span>
                </div>
                <div className="mt-3 leading-7 text-white/78">
                  This asset page is the first bridge from Prime launch intelligence into RioEx asset intelligence. It is designed to become the basis for disclosure surfaces, market-readiness packaging, and later tracker/listing preparation.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
