import Link from "next/link";
import { StudentAiMiniApp } from "@/components/prime-ai/miniapps/StudentAiMiniApp";
import { AiDevelopmentMiniApp } from "@/components/prime-ai/miniapps/AiDevelopmentMiniApp";
import { AiAgentMarketplaceMiniApp } from "@/components/prime-ai/miniapps/AiAgentMarketplaceMiniApp";
import { ScienceVirtualLabMiniApp } from "@/components/prime-ai/miniapps/ScienceVirtualLabMiniApp";

type PageProps = {
  params: Promise<{
    address: string;
  }>;
};

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://127.0.0.1:3000";

async function safeFetchJson(path: string) {
  try {
    const res = await fetch(`${APP_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function resolveAssetItem(payload: any) {
  return payload?.asset || payload?.item || payload?.data || payload || null;
}

function resolveProjectName(address: string, assetPayload: any) {
  const item = resolveAssetItem(assetPayload);
  const symbol = item?.symbol || item?.ticker || "PRIME";
  return item?.name || item?.display_name || item?.token_name || `${symbol} Project`;
}

function resolveMetadata(assetPayload: any) {
  const item = resolveAssetItem(assetPayload);
  return item?.metadata_json || item?.metadataJson || item?.metadata || {};
}

function statusPill(label: string, tone: "cyan" | "amber" | "emerald" | "violet" | "neutral" = "neutral") {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-300/22 bg-cyan-500/10 text-cyan-100"
      : tone === "amber"
        ? "border-amber-300/22 bg-amber-500/10 text-amber-100"
        : tone === "emerald"
          ? "border-emerald-300/22 bg-emerald-500/10 text-emerald-100"
          : tone === "violet"
            ? "border-violet-300/22 bg-violet-500/10 text-violet-100"
            : "border-white/10 bg-white/[0.055] text-white/68";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

function InfoCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
        {eyebrow}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
    </div>
  );
}

export default async function PrimeProjectAppPage({ params }: PageProps) {
  const { address } = await params;
  const assetPayload = await safeFetchJson(`/api/rioex/assets/${encodeURIComponent(address)}`);
  const metadata = resolveMetadata(assetPayload);
  const projectName = resolveProjectName(address, assetPayload);

  const aiNicheId = String(metadata.ai_niche_id || metadata.aiNicheId || "");
  const aiNicheTitle = String(metadata.ai_niche_title || metadata.aiNicheTitle || "Prime AI Utility");
  const aiNicheCategory = String(metadata.ai_niche_category || metadata.aiNicheCategory || "AI Ecosystem");
  const projectIdea = String(metadata.project_idea || metadata.projectIdea || "");
  const isStudentAi = aiNicheId === "student_ai_platform";
  const isAiDevelopment = aiNicheId === "ai_development_app_building";
  const isAiAgentMarketplace = aiNicheId === "ai_agent_marketplace";
  const isScienceVirtualLab = aiNicheId === "science_virtual_lab";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.15),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.13),transparent_34%),linear-gradient(180deg,#050814,#070a14)] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">
              Prime Creator Project Frontend
            </div>
            <div className="mt-2 text-sm text-white/50">
              Public-facing project page with an embedded AI utility module.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/createtoken/prime/token/${encodeURIComponent(address)}`}
              className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.09]"
            >
              Back to token page
            </Link>
            <Link
              href="/createtoken/prime"
              className="rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/15"
            >
              Prime Launch
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-cyan-300/18 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(135deg,rgba(8,20,38,0.78),rgba(13,17,34,0.94))] p-7 shadow-[0_32px_120px_-80px_rgba(34,211,238,0.9)]">
          <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                {statusPill("Prime Project", "amber")}
                {statusPill(aiNicheCategory, "cyan")}
                {statusPill("Embedded AI Utility", "emerald")}
                {statusPill("RioMind Nexus-ready", "violet")}
              </div>

              <h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-tight md:text-6xl">
                {projectName}
              </h1>

              <p className="mt-5 max-w-4xl text-sm leading-8 text-white/62">
                This is the creator’s wider project frontend. The selected AI niche is mounted
                as a usable project module inside this page. Visitors use the project app here;
                the raw internal runtime route remains only a reusable development module.
              </p>

              {projectIdea ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-black/22 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/36">
                    Project statement
                  </div>
                  <p className="mt-2 text-sm leading-7 text-white/60">{projectIdea}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">How the mini-app is used</div>
              <p className="mt-2 text-sm leading-6 text-white/55">
                The mini-app is one utility section of the creator’s project. The creator can make it
                public, token-gated, subscription-based, or institution-only later. Viewers should access
                this page, not the internal scaffold URL.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-cyan-300/14 bg-cyan-500/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/82">
                  Selected module: <span className="font-bold">{aiNicheTitle}</span>
                </div>
                <div className="rounded-2xl border border-emerald-300/14 bg-emerald-500/[0.055] px-4 py-3 text-xs leading-5 text-emerald-100/82">
                  Access model: Public now · token-gated/subscription-ready later
                </div>
                <div className="rounded-2xl border border-amber-300/14 bg-amber-500/[0.055] px-4 py-3 text-xs leading-5 text-amber-100/82">
                  Token proof: {address.slice(0, 12)}…{address.slice(-8)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            eyebrow="Project identity"
            title="Wider creator frontend"
            body="The AI app is not forced to replace the project website. It is embedded as a project utility module."
          />
          <InfoCard
            eyebrow="Utility module"
            title={aiNicheTitle}
            body="The selected Prime AI niche determines the mini-app module, user flows, utility logic, and later RioMind Nexus hooks."
          />
          <InfoCard
            eyebrow="Future monetization"
            title="Public, gated, or subscription"
            body="The creator can later choose public access, token-gated access, RUSD/RIO payments, card subscription, or institution access."
          />
        </section>

        <section className="rounded-[36px] border border-white/10 bg-black/20 p-5 md:p-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">
                Embedded AI Utility Module
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {aiNicheTitle}
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-semibold text-white/62">
              Mounted inside creator project page
            </div>
          </div>

          <div className="mt-6">
            {isStudentAi ? (
              <StudentAiMiniApp projectName={`${projectName} · Student AI Utility`} tokenAddress={address} />
            ) : isAiDevelopment ? (
              <AiDevelopmentMiniApp projectName={`${projectName} · AI App Builder Utility`} tokenAddress={address} />
            ) : isAiAgentMarketplace ? (
              <AiAgentMarketplaceMiniApp projectName={`${projectName} · Agent Marketplace Utility`} tokenAddress={address} />
            ) : isScienceVirtualLab ? (
              <ScienceVirtualLabMiniApp projectName={`${projectName} · Science Lab Utility`} tokenAddress={address} />
            ) : (
              <section className="rounded-[34px] border border-amber-300/20 bg-white/[0.045] p-7">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">
                  Mini-app renderer pending
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                  Embedded module not yet enabled for this niche
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                  This project has Prime AI metadata and a codebase package, but its embedded
                  creator-facing mini-app renderer has not yet been activated. Student AI Platform
                  AI Development & App Building, AI Agent Marketplace, and Science & Virtual Lab are enabled first, and the rest will follow one by one.
                </p>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
