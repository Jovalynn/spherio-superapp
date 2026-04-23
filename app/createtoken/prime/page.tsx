"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type PrimeLiquidityBase = "RIO" | "RUSD";
type PrimeLiquidityMode = "manual" | "guided" | "deferred";

type PrimeTemplate = {
  id: string;
  name: string;
  category: string;
  tone?: string;
  description: string;
  launchModel: string;
  aiContext: string;
  defaultLiquidityBases: PrimeLiquidityBase[];
  defaultLiquidityMode: PrimeLiquidityMode;
  feeTier: "standard" | "advanced" | "premium" | "hybrid";
  allocationDefaults: string[];
  trustDefaults: string[];
  readinessDefaults: string[];
  screenerLabel: string;
  successActions: string[];
  aiOutputs?: string[];
  powerUps?: string[];
  liquidityGuidance?: string[];
  requiredDisclosures?: string[];
  reviewSections?: {
    id: string;
    title: string;
    items: string[];
  }[];
};

type PrimeFeeQuote = {
  templateId: string;
  tier: string;
  feeUsd: number;
  feeRio: number;
  rioPriceUsd: number;
  label: string;
  hybridLabel?: string;
};

type PrimeCreateSuccess = {
  projectId: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  tokenAddress: string;
  explorerUrl: string;
  screenerUrl: string;
  liquidityUrl: string;
  verifiedStatus: "verified" | "unverified";
  feePaidRio: number;
  feeUsdReference: number;
  feeRecipient: string;
  successActions: string[];
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

type PrimeMetadataPackage = {
  projectId: string;
  templateId: string;
  templateName: string;
  hybridLabel?: string;
  tokenAddress: string;
  symbol: string;
  projectName: string;
  liquidityBase: PrimeLiquidityBase;
  liquidityMode: PrimeLiquidityMode;
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
  screenerLabel: string;
  successActions: string[];
  rioExProfilePreviewUrl?: string;
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

type PrimeFeaturedNicheState = {
  id: string;
  name: string;
  category: string;
};

type PrimeLaunchSurfaceState = {
  featuredNiche: PrimeFeaturedNicheState | null;
  lifecycle: LaunchLifecycleState;
};

type PrimeLaunchSurfaceResponse = {
  ok: boolean;
  source?: string;
  error?: string;
  state?: PrimeLaunchSurfaceState;
};

function shell() {
  return "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_18%),linear-gradient(180deg,#020617_0%,#07101d_40%,#071424_100%)] text-white";
}

function card(extra = "") {
  return `rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,21,38,0.92),rgba(8,13,24,0.96))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.84)] backdrop-blur-xl ${extra}`;
}

function sectionEyebrow() {
  return "text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/85";
}

function inputClass() {
  return "mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#060a14] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/45 focus:ring-2 focus:ring-amber-500/10";
}

function textAreaClass() {
  return "mt-2 min-h-[112px] w-full rounded-2xl border border-white/10 bg-[#060a14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/45 focus:ring-2 focus:ring-amber-500/10";
}

function fieldLabel(text: string) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
      {text}
    </label>
  );
}

function actionButton(primary = false) {
  return primary
    ? "inline-flex h-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-[linear-gradient(90deg,rgba(245,158,11,0.96),rgba(217,119,6,0.96))] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(245,158,11,0.68)] hover:translate-y-[-1px]"
    : "inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-white/88 hover:bg-white/[0.07]";
}

function pill(
  tone: "gold" | "slate" | "emerald" | "cyan" | "violet" | "rose" | "neutral" = "neutral",
) {
  const tones: Record<string, string> = {
    gold: "border-amber-300/35 bg-amber-500/10 text-amber-200",
    slate: "border-sky-300/25 bg-sky-500/10 text-sky-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    violet: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    neutral: "border-white/10 bg-white/5 text-slate-300",
  };

  return `inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tones[tone]}`;
}

function feeBandLabel(tier?: string) {
  switch (tier) {
    case "standard":
      return "Standard";
    case "advanced":
      return "Advanced";
    case "premium":
      return "Premium";
    case "hybrid":
      return "Hybrid";
    default:
      return "Prime";
  }
}

function templateAccent(template: PrimeTemplate | null | undefined) {
  const id = template?.id?.toLowerCase() || "";
  const label = (template?.name || "").toLowerCase();

  if (id.includes("community") || label.includes("community")) {
    return {
      shell:
        "border-amber-400/24 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(255,255,255,0.025))]",
      selected:
        "border-amber-400/48 bg-[linear-gradient(180deg,rgba(245,158,11,0.18),rgba(255,255,255,0.04))] shadow-[0_18px_45px_-30px_rgba(245,158,11,0.6)]",
      glow: "bg-amber-400/10",
      pillTone: "gold" as const,
    };
  }

  if (id.includes("governance") || label.includes("governance")) {
    return {
      shell:
        "border-sky-400/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-sky-400/40 bg-[linear-gradient(180deg,rgba(56,189,248,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(56,189,248,0.5)]",
      glow: "bg-sky-400/10",
      pillTone: "slate" as const,
    };
  }

  if (
    id.includes("revenue") ||
    label.includes("revenue") ||
    id.includes("defi") ||
    label.includes("defi")
  ) {
    return {
      shell:
        "border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-emerald-400/40 bg-[linear-gradient(180deg,rgba(16,185,129,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(16,185,129,0.45)]",
      glow: "bg-emerald-400/10",
      pillTone: "emerald" as const,
    };
  }

  if (id.includes("asset") || label.includes("asset")) {
    return {
      shell:
        "border-yellow-400/18 bg-[linear-gradient(180deg,rgba(250,204,21,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-yellow-400/34 bg-[linear-gradient(180deg,rgba(250,204,21,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(250,204,21,0.45)]",
      glow: "bg-yellow-300/10",
      pillTone: "gold" as const,
    };
  }

  if (id.includes("ai") || label.includes("ai") || id.includes("infra") || label.includes("infra")) {
    return {
      shell:
        "border-cyan-400/18 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-cyan-400/36 bg-[linear-gradient(180deg,rgba(34,211,238,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(34,211,238,0.45)]",
      glow: "bg-cyan-400/10",
      pillTone: "cyan" as const,
    };
  }

  if (id.includes("creator") || label.includes("creator") || id.includes("gaming") || label.includes("gaming")) {
    return {
      shell:
        "border-rose-400/18 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-rose-400/36 bg-[linear-gradient(180deg,rgba(244,63,94,0.16),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(244,63,94,0.45)]",
      glow: "bg-rose-400/10",
      pillTone: "rose" as const,
    };
  }

  if (id.includes("dao") || label.includes("dao") || id.includes("nft") || label.includes("nft")) {
    return {
      shell:
        "border-fuchsia-400/16 bg-[linear-gradient(180deg,rgba(217,70,239,0.10),rgba(255,255,255,0.02))]",
      selected:
        "border-fuchsia-400/34 bg-[linear-gradient(180deg,rgba(217,70,239,0.15),rgba(255,255,255,0.035))] shadow-[0_18px_45px_-30px_rgba(217,70,239,0.45)]",
      glow: "bg-fuchsia-400/10",
      pillTone: "violet" as const,
    };
  }

  return {
    shell:
      "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]",
    selected:
      "border-amber-300/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_45px_-30px_rgba(255,255,255,0.15)]",
    glow: "bg-white/5",
    pillTone: "neutral" as const,
  };
}

export default function PrimeCreatePage() {
  const [templates, setTemplates] = useState<PrimeTemplate[]>([]);
  const [approvedHybrids, setApprovedHybrids] = useState<string[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [lockedFrameworkId, setLockedFrameworkId] = useState<string>("");
  const [reviewingTemplateId, setReviewingTemplateId] = useState<string | null>(null);
  const [hybridLabel, setHybridLabel] = useState("");
  const [liquidityBase, setLiquidityBase] = useState<PrimeLiquidityBase>("RIO");
  const [liquidityMode, setLiquidityMode] = useState<PrimeLiquidityMode>("guided");
  const [quote, setQuote] = useState<PrimeFeeQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<PrimeCreateSuccess | null>(null);
  const [metadataPackage, setMetadataPackage] = useState<PrimeMetadataPackage | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [surfaceState, setSurfaceState] = useState<PrimeLaunchSurfaceState | null>(null);
  const [surfaceLoading, setSurfaceLoading] = useState(true);
  const [surfaceError, setSurfaceError] = useState("");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectIdea, setProjectIdea] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [projectStatement, setProjectStatement] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      try {
        const response = await fetch("/api/prime/templates");
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load templates");
        }

        if (!isMounted) return;

        const nextTemplates = (data.templates ?? []) as PrimeTemplate[];
        setTemplates(nextTemplates);
        setApprovedHybrids((data.hybrids ?? []).map((item: { label: string }) => item.label));

        const firstTemplate = nextTemplates[0];
        if (firstTemplate) {
          setSelectedFrameworkId(firstTemplate.id);
          setLockedFrameworkId(firstTemplate.id);
          setLiquidityBase(firstTemplate.defaultLiquidityBases?.[0] ?? "RIO");
          setLiquidityMode(firstTemplate.defaultLiquidityMode ?? "guided");
          setProjectCategory(firstTemplate.name);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSurfaceState() {
      try {
        setSurfaceLoading(true);
        setSurfaceError("");

        const response = await fetch("/api/launches/prime", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as PrimeLaunchSurfaceResponse;

        if (!response.ok || !data.ok || !data.state) {
          throw new Error(data.error || "Failed to load Prime launch state.");
        }

        if (!cancelled) {
          setSurfaceState(data.state);
        }
      } catch (error) {
        if (!cancelled) {
          setSurfaceError(
            error instanceof Error ? error.message : "Failed to load Prime launch state.",
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

  const selectedFramework = useMemo(
    () => templates.find((item) => item.id === selectedFrameworkId) ?? null,
    [templates, selectedFrameworkId],
  );

  const lockedFramework = useMemo(
    () => templates.find((item) => item.id === lockedFrameworkId) ?? selectedFramework,
    [templates, lockedFrameworkId, selectedFramework],
  );

  const reviewingTemplate = useMemo(
    () => templates.find((item) => item.id === reviewingTemplateId) ?? null,
    [templates, reviewingTemplateId],
  );

  useEffect(() => {
    if (!lockedFramework) return;

    setLiquidityBase(lockedFramework.defaultLiquidityBases?.[0] ?? "RIO");
    setLiquidityMode(lockedFramework.defaultLiquidityMode ?? "guided");

    if (!projectCategory) {
      setProjectCategory(lockedFramework.name);
    }

    if (lockedFramework.id !== "hybrid") {
      setHybridLabel("");
    }
  }, [lockedFramework, projectCategory]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!lockedFramework) return;

      try {
        setLoadingQuote(true);
        setQuoteError("");

        const response = await fetch("/api/prime/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: lockedFramework.id,
            rioPriceUsd: 1,
            hybridLabel: lockedFramework.id === "hybrid" ? hybridLabel || undefined : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load fee quote");
        }

        if (!cancelled) {
          setQuote(data.quote);
        }
      } catch (error) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(error instanceof Error ? error.message : "Failed to load fee quote");
        }
      } finally {
        if (!cancelled) {
          setLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [lockedFramework, hybridLabel]);

  function openTemplateReview(templateId: string) {
    setSelectedFrameworkId(templateId);
    setReviewingTemplateId(templateId);
  }

  function useReviewedTemplate() {
    if (!reviewingTemplate) return;

    setLockedFrameworkId(reviewingTemplate.id);
    setSelectedFrameworkId(reviewingTemplate.id);
    setProjectCategory(reviewingTemplate.name);
    setReviewingTemplateId(null);
  }

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

  async function handleCopyContract() {
    if (!success?.tokenAddress) return;

    try {
      await navigator.clipboard.writeText(success.tokenAddress);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreate() {
    if (!lockedFramework) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/prime/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: lockedFramework.id,
          projectName: tokenName || `${lockedFramework.name} Prime Project`,
          symbol: symbol || "SPRM",
          totalSupply: totalSupply || "1000000",
          statement: projectStatement,
          logoUrl: logoFileName ? `upload://${logoFileName}` : undefined,
          hybridLabel: lockedFramework.id === "hybrid" ? hybridLabel || undefined : undefined,
          liquidityBase,
          liquidityMode,
          rioPriceUsd: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setSuccess(data.success);
      setMetadataPackage(data.metadataPackage ?? null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const lockedAccent = templateAccent(lockedFramework);
  const featuredNicheName = surfaceState?.featuredNiche?.name ?? lockedFramework?.name ?? "Prime";
  const featuredNicheCategory =
    surfaceState?.featuredNiche?.category ?? lockedFramework?.category ?? "Framework";
  const lifecycle = surfaceState?.lifecycle ?? {
    rail: "prime" as const,
    progressPercent: 0,
    steps: [],
  };

  return (
    <main className={shell()}>
      <div className="mx-auto max-w-[1660px] p-4 sm:p-5">
        <div className="space-y-5">
          {reviewingTemplate ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[30px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,15,28,0.98))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.82)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={sectionEyebrow()}>Template review</div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {reviewingTemplate.name}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                      Review this Prime niche and framework before locking it into the creation flow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewingTemplateId(null)}
                    className={actionButton(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={pill(templateAccent(reviewingTemplate).pillTone)}>
                    {reviewingTemplate.name}
                  </span>
                  <span className={pill("neutral")}>{reviewingTemplate.category}</span>
                  <span className={pill("neutral")}>
                    Liquidity: {reviewingTemplate.defaultLiquidityBases.join(" / ")}
                  </span>
                  <span className={pill("neutral")}>
                    Mode: {reviewingTemplate.defaultLiquidityMode}
                  </span>
                </div>

                <div
                  className={`mt-6 rounded-[24px] border p-5 ${templateAccent(reviewingTemplate).selected}`}
                >
                  <div className="text-sm font-semibold text-white">Launch model</div>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {reviewingTemplate.launchModel}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  {(reviewingTemplate.reviewSections ?? []).map((section) => (
                    <div key={section.id} className={card("p-5")}>
                      <div className="text-lg font-semibold text-white">{section.title}</div>
                      <div className="mt-4 space-y-3">
                        {section.items.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewingTemplateId(null)}
                    className={actionButton(false)}
                  >
                    Back
                  </button>
                  <button type="button" onClick={useReviewedTemplate} className={actionButton(true)}>
                    Use this niche
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <section className="rounded-[34px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(16,23,40,0.94),rgba(10,15,28,0.94))] p-8 shadow-[0_28px_100px_-42px_rgba(0,0,0,0.86)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-4xl">
                <div className={sectionEyebrow()}>Prime</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Structured Launch Console
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                  Select a structured launch model, review it, define project architecture, set
                  liquidity, review pricing, and move from creation into Screener, RioExplorer, and
                  discovery flow.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={pill("slate")}>Network: spherio-1</span>
                  <span className={pill("neutral")}>Decimals: 6</span>
                  <span className={pill("gold")}>Institutional Prime</span>
                  <span className={pill("emerald")}>Screener-ready</span>
                  <span className={pill("violet")}>Framework-driven</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:w-[430px] xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Wallet</div>
                    <div className="mt-1">Not connected</div>
                  </div>
                  <button className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                    Connect Wallet
                  </button>
                </div>

                <div className="rounded-[24px] border border-amber-400/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(255,255,255,0.02))] px-5 py-4">
                  <div className={sectionEyebrow()}>Prime framing</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <div>Template reviewed before lock-in</div>
                    <div>Liquidity reviewed before launch</div>
                    <div>Curated, issuer-grade project flow</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={card("px-6 py-5")}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className={sectionEyebrow()}>Prime lifecycle</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Create → LP → Screener → Trade → RioEx → CMC/Gecko
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Structured lifecycle rail for Prime issuance.
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Lifecycle progression
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-300">
                  {lifecycle.progressPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(245,158,11,0.96),rgba(217,119,6,0.96),rgba(56,189,248,0.88))]"
                style={{ width: `${Math.min(lifecycle.progressPercent, 100)}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {lifecycle.steps.map((step) => {
                const isCompleted = step.status === "complete";
                const isActive = step.status === "active";
                const isOptional = step.status === "optional";

                return (
                  <div
                    key={step.key}
                    className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                      isCompleted
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                        : isActive
                          ? "border-sky-400/28 bg-sky-500/10 text-sky-200"
                          : isOptional
                            ? "border-fuchsia-400/25 bg-fuchsia-500/8 text-fuchsia-200"
                            : "border-white/10 bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            {surfaceLoading ? (
              <div className="mt-4 text-sm text-slate-400">Loading authority state...</div>
            ) : null}
            {surfaceError ? (
              <div className="mt-4 text-sm text-rose-300">{surfaceError}</div>
            ) : null}
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className={card()}>
              <div className="mb-5">
                <div className={sectionEyebrow()}>Prime models</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Choose Your Prime Niche
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                  Prime favors reviewed launch structures over heat-led ranking. Choose the niche
                  first, then shape issuance, liquidity, trust, and discovery around it.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map((framework) => {
                  const isPreview = framework.id === selectedFramework?.id;
                  const isLocked = framework.id === lockedFramework?.id;
                  const accent = templateAccent(framework);

                  return (
                    <div
                      key={framework.id}
                      className={`relative overflow-hidden rounded-[24px] border p-5 transition ${
                        isLocked ? accent.selected : accent.shell
                      }`}
                    >
                      <div className={`absolute right-[-24px] top-[-24px] h-24 w-24 rounded-full blur-2xl ${accent.glow}`} />

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-lg font-semibold text-white">{framework.name}</div>
                          <span className={pill(accent.pillTone)}>{framework.category}</span>
                        </div>

                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          {framework.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={pill("neutral")}>
                            {framework.launchModel.slice(0, 22)}
                            {framework.launchModel.length > 22 ? "…" : ""}
                          </span>

                          {isLocked ? <span className={pill("gold")}>In use</span> : null}
                          {isPreview && !isLocked ? <span className={pill("slate")}>Preview</span> : null}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openTemplateReview(framework.id)}
                            className={actionButton(false)}
                          >
                            Review model
                          </button>

                          {!isLocked ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFrameworkId(framework.id);
                                setLockedFrameworkId(framework.id);
                                setProjectCategory(framework.name);
                              }}
                              className={actionButton(true)}
                            >
                              Use niche
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={card("relative overflow-hidden")}>
              <div className={`absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 rounded-full blur-3xl ${lockedAccent.glow}`} />
              <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-cyan-400/6 blur-3xl" />

              <div className="relative">
                <div className="text-center">
                  <div className={sectionEyebrow()}>Create</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    Create Prime Token
                  </h2>
                  <p className="mx-auto mt-3 max-w-[640px] text-sm leading-7 text-slate-400">
                    Build a more curated, issuer-grade token flow. Prime starts with niche selection,
                    then moves through liquidity, trust posture, and structured creation.
                  </p>
                </div>

                <div className={`mt-6 rounded-[24px] border p-4 ${lockedAccent.shell}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={pill(lockedAccent.pillTone)}>{featuredNicheName}</span>
                    <span className={pill("neutral")}>{featuredNicheCategory}</span>
                    {lockedFramework?.id === "hybrid" && hybridLabel ? (
                      <span className={pill("violet")}>{hybridLabel}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-300">
                    {lockedFramework?.launchModel ||
                      "Review and lock a Prime niche before creating the token."}
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <div>
                    {fieldLabel("Project category")}
                    <input
                      className={inputClass()}
                      value={projectCategory}
                      onChange={(e) => setProjectCategory(e.target.value)}
                      placeholder="e.g. Governance, creator, asset-backed"
                    />
                  </div>

                  <div>
                    {fieldLabel("Selected framework")}
                    <input
                      className={inputClass()}
                      value={lockedFramework?.name ?? ""}
                      readOnly
                    />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Describe what you are building")}
                    <textarea
                      className={textAreaClass()}
                      value={projectIdea}
                      onChange={(e) => setProjectIdea(e.target.value)}
                      placeholder={`Describe the product, audience, trust requirements, and intended market path for ${lockedFramework?.name ?? "this"} Prime launch.`}
                    />
                  </div>

                  <div>
                    {fieldLabel("Liquidity base asset")}
                    <div className="mt-2 flex gap-2">
                      {(["RIO", "RUSD"] as PrimeLiquidityBase[]).map((item) => {
                        const allowed = lockedFramework?.defaultLiquidityBases.includes(item) ?? false;
                        const active = liquidityBase === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            disabled={!allowed}
                            onClick={() => setLiquidityBase(item)}
                            className={`h-12 flex-1 rounded-2xl border text-sm font-semibold transition ${
                              active
                                ? "border-amber-400/45 bg-amber-500/10 text-white"
                                : "border-white/10 bg-[#060a14] text-slate-300"
                            } ${!allowed ? "opacity-40" : ""}`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    {fieldLabel("Liquidity mode")}
                    <select
                      className={inputClass()}
                      value={liquidityMode}
                      onChange={(e) => setLiquidityMode(e.target.value as PrimeLiquidityMode)}
                    >
                      <option value="manual">Manual</option>
                      <option value="guided">Guided</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  </div>

                  <div>
                    {fieldLabel("Token name")}
                    <input
                      className={inputClass()}
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder={`e.g. ${lockedFramework?.name ?? "Prime"} Network`}
                    />
                  </div>

                  <div>
                    {fieldLabel("Symbol")}
                    <input
                      className={inputClass()}
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g. SPRM"
                    />
                  </div>

                  <div>
                    {fieldLabel("Total supply (tokens)")}
                    <input
                      className={inputClass()}
                      value={totalSupply}
                      onChange={(e) => setTotalSupply(e.target.value)}
                      placeholder="e.g. 1000000"
                    />
                  </div>

                  <div>
                    {fieldLabel("Decimals (fixed)")}
                    <input className={inputClass()} value="6" readOnly />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Project statement")}
                    <textarea
                      className={textAreaClass()}
                      value={projectStatement}
                      onChange={(e) => setProjectStatement(e.target.value)}
                      placeholder="Provide the public issuer statement, utility framing, and launch disclosures."
                    />
                  </div>

                  <div className="md:col-span-2">
                    {fieldLabel("Project logo")}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#060a14] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">No logo</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-300">
                          {logoFileName || "Upload PNG, JPG, WEBP, or SVG"}
                        </div>
                      </div>

                      <button type="button" onClick={handleLogoPick} className={actionButton(false)}>
                        Choose file
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  {loadingQuote ? (
                    "Loading Prime fee..."
                  ) : quote ? (
                    <>
                      Fee band: <span className="font-semibold text-white">{feeBandLabel(quote.tier)}</span> ·
                      Approx. <span className="font-semibold text-white">${quote.feeUsd}</span> ·
                      Payable in <span className="font-semibold text-white">{quote.feeRio} RIO</span>
                    </>
                  ) : (
                    quoteError || "Fee unavailable"
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button type="button" className={actionButton(false)}>Reviewed</button>
                  <button type="button" className={actionButton(false)}>Curated</button>
                  <button type="button" className={actionButton(false)}>Discovery-ready</button>
                  <button type="button" className={actionButton(false)}>Liquidity-aware</button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!lockedFramework || isSubmitting}
                    className={actionButton(true)}
                  >
                    {isSubmitting ? "Creating Prime Token..." : "Create Prime Token"}
                  </button>
                </div>

                {success ? (
                  <div className="mt-6 rounded-[28px] border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(6,78,59,0.38),rgba(6,46,33,0.46))] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
                    <h3 className="text-lg font-semibold text-white">Token created</h3>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Token contract address
                      </div>
                      <div className="mt-2 break-all text-sm text-slate-100">
                        {success.tokenAddress}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Template package
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                          <span>Niche</span>
                          <span className="font-semibold text-white">
                            {featuredNicheName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Framework family</span>
                          <span className="font-semibold text-white">
                            {featuredNicheCategory}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>AI outputs</span>
                          <span className="font-semibold text-white">
                            {success.aiOutputs?.length ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Power-ups</span>
                          <span className="font-semibold text-white">
                            {success.powerUps?.length ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Disclosures</span>
                          <span className="font-semibold text-white">
                            {success.requiredDisclosures?.length ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Fee routing
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-200">
                        <div className="flex items-center justify-between gap-4">
                          <span>Fee paid</span>
                          <span className="font-semibold text-white">
                            {success.feePaidRio} RIO
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Fee reference</span>
                          <span className="font-semibold text-white">
                            ${success.feeUsdReference}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Treasury recipient</span>
                          <span className="break-all text-right font-semibold text-white">
                            {success.feeRecipient}
                          </span>
                        </div>
                      </div>
                    </div>

                    {metadataPackage ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          Future market metadata package
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          This launch now carries niche identity, AI outputs, power-ups, liquidity
                          guidance, disclosures, and review sections forward for future RioEx,
                          tracker, and listing workflows.
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={handleCopyContract}
                        className={actionButton(false)}
                      >
                        {copyState === "copied" ? "Copied" : "Copy contract"}
                      </button>

                      <a href={success.liquidityUrl} className={actionButton(false)}>
                        Add liquidity
                      </a>

                      <a href={success.screenerUrl} className={actionButton(false)}>
                        Open in Screener
                      </a>

                      <a href={success.explorerUrl} className={actionButton(false)}>
                        Open in RioExplorer
                      </a>

                      {metadataPackage?.rioExProfilePreviewUrl ? (
                        <a
                          href={metadataPackage.rioExProfilePreviewUrl.replace(
                            "/api/rioex/assets/",
                            "/rioex/assets/",
                          )}
                          className={actionButton(true)}
                        >
                          Open RioEx Asset Profile
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <div className={card()}>
              <div className={sectionEyebrow()}>Allocation architecture</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Supply structure</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.allocationDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card()}>
              <div className={sectionEyebrow()}>Trust architecture</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Credibility controls</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.trustDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card()}>
              <div className={sectionEyebrow()}>Market readiness</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Discovery path</h3>
              <div className="mt-4 space-y-3">
                {(lockedFramework?.readinessDefaults ?? []).map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className={card()}>
              <div className={sectionEyebrow()}>Prime standards</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Issuer-grade creation path</h3>
              <div className="mt-4 grid gap-3">
                {[
                  "Choose niche before lock-in",
                  "Explicit liquidity structure",
                  "Fee tier visible before creation",
                  "Discovery and Screener actions surfaced after issuance",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={card("border-amber-400/15")}>
              <div className={sectionEyebrow()}>Navigation</div>
              <h3 className="mt-2 text-xl font-semibold text-white">Launcher family</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/createtoken" className={actionButton(false)}>
                  CreateToken gateway
                </Link>
                <Link href="/createtoken/pump" className={actionButton(false)}>
                  Pump.live
                </Link>
                <button type="button" className={actionButton(true)}>
                  Prime
                </button>
              </div>

              <div className="mt-6 text-sm leading-7 text-slate-400">
                Prime now follows the same authority-shaped surface pattern as Pump, with
                treasury-aware creation, lifecycle truth, and stronger market handoff posture.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
