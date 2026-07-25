import Link from "next/link";

type PageProps = {
  params: Promise<{
    address: string;
  }>;
};

type AssetState = {
  symbol: string;
  name: string;
  status: string;
  assetType: string;
  routeReady: boolean;
  source: string;
};

type MarketState = {
  pairAddress: string | null;
  pairLabel: string | null;
  liquidityStatus: string;
  tradeReady: boolean;
  routeSource: string;
};

type PrimeMetadataState = {
  nicheFamily: string;
  nicheFamilyLabel: string;
  aiNicheTitle: string | null;
  aiNicheCategory: string | null;
  aiNicheBadge: string | null;
  aiLaunchModel: string | null;
  aiArchitecture: {
    frontend?: string;
    backend?: string;
    codebase?: string;
    modules?: string[];
  } | null;
  aiCodebasePackage: {
    packageName?: string;
    maturity?: string;
    scaffoldPath?: string;
    runtimeUrl?: string;
    productSurface?: string;
    frontendSurfaces?: string[];
    backendServices?: string[];
    databaseModels?: string[];
    runtimeWorkers?: string[];
    rioMindNexusIntegrations?: string[];
    creatorUtilityModules?: string[];
    complianceNotes?: string[];
  } | null;
  creatorUtilityLabels: string[];
  rioMindNexusReady: boolean;
};

const PRIME_DOMAIN =
  process.env.NEXT_PUBLIC_PRIME_BASE_URL || "https://prime.spheriochain.io";

const APP_BASE =
  process.env.NEXT_PUBLIC_SUPERAPP_URL ||
  process.env.SUPERAPP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://127.0.0.1:3000";

async function safeFetchJson(path: string) {
  try {
    const res = await fetch(`${APP_BASE}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

function shortAddress(address: string) {
  if (!address) return "—";
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

function resolveAssetItem(payload: any) {
  return payload?.asset || payload?.item || payload?.data || payload || null;
}

function resolveAssetState(address: string, assetPayload: any): AssetState {
  const item = resolveAssetItem(assetPayload);

  const symbol =
    item?.symbol ||
    item?.ticker ||
    item?.external_symbol ||
    "PRIME";

  const name =
    item?.name ||
    item?.display_name ||
    item?.token_name ||
    `${symbol} Prime Launch`;

  const status =
    item?.status ||
    item?.promotion_status ||
    item?.verification_status ||
    "Indexed status pending";

  const assetType =
    item?.asset_type ||
    item?.origin_type ||
    "Prime / SPO-20";

  const routeReady = Boolean(
    item?.is_tradeable ||
      item?.is_live ||
      item?.pair_address ||
      item?.riodex_pair_address,
  );

  return {
    symbol,
    name,
    status,
    assetType,
    routeReady,
    source: item ? "rioex_asset_registry" : "public_prime_route",
  };
}

function resolvePrimeMetadata(assetPayload: any): PrimeMetadataState {
  const item = resolveAssetItem(assetPayload);

  const metadata =
    item?.metadata_json ||
    item?.metadataJson ||
    item?.metadata ||
    {};

  const creatorUtilityLabels = Array.isArray(metadata.creator_utility_labels)
    ? metadata.creator_utility_labels
    : Array.isArray(metadata.creatorUtilityLabels)
      ? metadata.creatorUtilityLabels
      : [];

  const aiArchitecture =
    metadata.ai_architecture && typeof metadata.ai_architecture === "object"
      ? metadata.ai_architecture
      : metadata.aiArchitecture && typeof metadata.aiArchitecture === "object"
        ? metadata.aiArchitecture
        : null;

  const aiCodebasePackage =
    metadata.ai_codebase_package && typeof metadata.ai_codebase_package === "object"
      ? metadata.ai_codebase_package
      : metadata.aiCodebasePackage && typeof metadata.aiCodebasePackage === "object"
        ? metadata.aiCodebasePackage
        : null;

  return {
    nicheFamily: String(metadata.niche_family || metadata.nicheFamily || "core"),
    nicheFamilyLabel: String(
      metadata.niche_family_label ||
        metadata.nicheFamilyLabel ||
        "Prime Core Launch Niches",
    ),
    aiNicheTitle: metadata.ai_niche_title || metadata.aiNicheTitle || null,
    aiNicheCategory: metadata.ai_niche_category || metadata.aiNicheCategory || null,
    aiNicheBadge: metadata.ai_niche_badge || metadata.aiNicheBadge || null,
    aiLaunchModel: metadata.ai_launch_model || metadata.aiLaunchModel || null,
    aiArchitecture,
    aiCodebasePackage,
    creatorUtilityLabels,
    rioMindNexusReady: Boolean(
      metadata.riomind_nexus_ready ||
        metadata.rioMindNexusReady ||
        metadata.ai_niche_id ||
        metadata.aiNicheId,
    ),
  };
}

function resolveMarketState(address: string, screenerPayload: any): MarketState {
  const rows =
    screenerPayload?.rows ||
    screenerPayload?.items ||
    screenerPayload?.pairs ||
    [];

  const match = Array.isArray(rows)
    ? rows.find((row: any) => {
        const values = [
          row?.baseAssetId,
          row?.quoteAssetId,
          row?.asset_0_id,
          row?.asset_1_id,
          row?.tokenAddress,
          row?.token_address,
          row?.baseAddress,
          row?.quoteAddress,
          row?.displaySymbol,
          row?.canonicalSymbol,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());

        return values.some((v) => v.includes(address.toLowerCase()));
      })
    : null;

  if (!match) {
    return {
      pairAddress: null,
      pairLabel: null,
      liquidityStatus: "Pair pending",
      tradeReady: false,
      routeSource: "awaiting_riodex_pair",
    };
  }

  const pairAddress =
    match.pairAddress ||
    match.pair_address ||
    match.address ||
    null;

  const pairLabel =
    match.canonicalSymbol ||
    match.displaySymbol ||
    match.display_symbol ||
    match.pairLabel ||
    null;

  const liquidityStatus =
    match.liquidityStatus ||
    match.liquidity_status ||
    match.readiness ||
    "Indexed";

  const tradeReady = Boolean(
    pairAddress &&
      !String(liquidityStatus).toLowerCase().includes("pending") &&
      !String(liquidityStatus).toLowerCase().includes("missing"),
  );

  return {
    pairAddress,
    pairLabel,
    liquidityStatus,
    tradeReady,
    routeSource: screenerPayload?.source || "riodex_screener",
  };
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "ready" | "warning" | "prime";
}) {
  const cls =
    tone === "ready"
      ? "border-emerald-300/25 bg-emerald-500/12 text-emerald-100"
      : tone === "warning"
        ? "border-amber-300/25 bg-amber-500/12 text-amber-100"
        : tone === "prime"
          ? "border-amber-300/25 bg-amber-500/12 text-amber-100"
          : "border-white/10 bg-white/[0.06] text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${cls}`}>
      {label}
    </span>
  );
}

function DetailCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-white/35">
        {title}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-white">
        {value}
      </div>
      {helper ? (
        <div className="mt-2 text-xs leading-5 text-white/45">{helper}</div>
      ) : null}
    </div>
  );
}

export default async function PrimeTokenPage({ params }: PageProps) {
  const { address } = await params;

  const [assetPayload, screenerPayload] = await Promise.all([
    safeFetchJson(`/api/rioex/assets/${encodeURIComponent(address)}`),
    safeFetchJson(`/api/riodex/screener?token=${encodeURIComponent(address)}`),
  ]);

  const asset = resolveAssetState(address, assetPayload);
  const market = resolveMarketState(address, screenerPayload);
  const primeMetadata = resolvePrimeMetadata(assetPayload);

  const publicUrl = `${PRIME_DOMAIN}/token/${encodeURIComponent(address)}`;
  const swapHref = market.pairAddress
    ? `/riodex/swap?pair=${encodeURIComponent(market.pairAddress)}`
    : `/riodex/swap?token=${encodeURIComponent(address)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_32%),linear-gradient(180deg,#05060a_0%,#080a12_48%,#05060a_100%)] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] shadow-2xl">
          <div className="border-b border-white/10 bg-black/20 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label="Prime Launch" tone="prime" />
                <StatusPill
                  label={market.tradeReady ? "Route Ready" : "Route Pending"}
                  tone={market.tradeReady ? "ready" : "warning"}
                />
                <StatusPill
                  label={asset.routeReady ? "RioEx Indexed" : "Indexing Pending"}
                  tone={asset.routeReady ? "ready" : "neutral"}
                />
                {primeMetadata.rioMindNexusReady ? (
                  <StatusPill label="RioMind Nexus Ready" tone="ready" />
                ) : null}
              </div>

              <div className="text-xs text-white/45">
                Public URL:{" "}
                <span className="font-mono text-white/70">{publicUrl}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">
                Prime public token page
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-500/15 text-xl font-bold text-amber-100">
                  {asset.symbol.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                    {asset.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/55">
                    <span className="font-semibold text-white/80">
                      {asset.symbol}
                    </span>
                    <span>•</span>
                    <span>{asset.assetType}</span>
                    <span>•</span>
                    <span>{shortAddress(address)}</span>
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-white/62">
                This is the canonical Prime token surface for issuer-grade token
                launches on Spherio. It connects token identity, liquidity
                readiness, RioDex route, RioEx market profile, RioExplorer proof,
                and Prime AI ecosystem metadata where available.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/createtoken/prime?token=${encodeURIComponent(address)}`}
                  className="rounded-full border border-amber-300/30 bg-amber-500/15 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
                >
                  View Prime Launch
                </Link>

                <Link
                  href={swapHref}
                  className="rounded-full border border-orange-300/30 bg-orange-500/15 px-5 py-2.5 text-sm font-semibold text-orange-100 hover:bg-orange-500/20"
                >
                  Trade on RioDex
                </Link>

                <Link
                  href={`/rioex/assets/${encodeURIComponent(address)}`}
                  className="rounded-full border border-cyan-300/30 bg-cyan-500/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
                >
                  View RioEx Profile
                </Link>

                <Link
                  href={`/rioexplorer/spo20/${encodeURIComponent(address)}`}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.09]"
                >
                  Explorer Proof
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">
                Launch Readiness
              </div>

              <div className="mt-4 space-y-3">
                <DetailCard
                  title="Token contract"
                  value={address}
                  helper="Canonical SPO-20 / Prime asset identifier."
                />
                <DetailCard
                  title="Asset status"
                  value={asset.status}
                  helper={`Source: ${asset.source}`}
                />
                <DetailCard
                  title="Market route"
                  value={market.pairLabel || "Pair pending"}
                  helper={`Source: ${market.routeSource}`}
                />
                <DetailCard
                  title="Liquidity status"
                  value={market.liquidityStatus}
                  helper={
                    market.tradeReady
                      ? "Route is ready for RioDex trading surfaces."
                      : "Liquidity or pair indexing is still pending."
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {primeMetadata.rioMindNexusReady ? (
          <section className="overflow-hidden rounded-[32px] border border-cyan-300/18 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.16),transparent_36%),linear-gradient(135deg,rgba(8,20,38,0.72),rgba(13,17,34,0.92))] p-6 shadow-[0_28px_100px_-70px_rgba(34,211,238,0.86)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/80">
                  Prime AI Ecosystem Proof
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  RioMind Nexus-ready project
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                  This Prime launch includes AI ecosystem metadata, selected
                  creator utilities, and a recommended architecture profile that
                  can later power RioMind Nexus, RioExplorer proof, and Prime
                  project surfaces.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill label={primeMetadata.nicheFamilyLabel} tone="prime" />
                {primeMetadata.aiNicheBadge ? (
                  <StatusPill label={primeMetadata.aiNicheBadge} tone="ready" />
                ) : null}
                <StatusPill label="RioMind Nexus Ready" tone="ready" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <DetailCard
                title="Selected AI niche"
                value={primeMetadata.aiNicheTitle || "AI niche pending"}
                helper={primeMetadata.aiNicheCategory || "Prime AI Ecosystem"}
              />
              <DetailCard
                title="Launch model"
                value={primeMetadata.aiLaunchModel || "AI launch model pending"}
                helper="Stored in SPO-20 shared metadata for future Prime/RioMind surfaces."
              />
            </div>

            {primeMetadata.aiCodebasePackage ? (
              <div className="mt-5 rounded-3xl border border-cyan-300/18 bg-black/24 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80">
                      Prime AI Codebase Package
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      {primeMetadata.aiCodebasePackage.packageName || "AI codebase package"}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
                      {primeMetadata.aiCodebasePackage.productSurface ||
                        "This package defines the product surface, services, models, workers, and RioMind Nexus hooks for this AI Prime launch."}
                    </p>
                    <div className="mt-3 rounded-2xl border border-cyan-300/14 bg-cyan-500/[0.055] px-4 py-3 text-xs leading-5 text-cyan-100/80">
                      Public users should access the creator project app, not the internal runtime path.
                      The runtime package remains attached behind the project frontend.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={`Maturity: ${primeMetadata.aiCodebasePackage.maturity || "scaffold_ready"}`}
                      tone="ready"
                    />
                    <Link
                      href={`/createtoken/prime/token/${encodeURIComponent(address)}/app`}
                      className="rounded-full border border-cyan-300/25 bg-cyan-500/12 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/18"
                    >
                      Open Project App
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      Frontend surfaces
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(primeMetadata.aiCodebasePackage.frontendSurfaces || []).map((item) => (
                        <StatusPill key={item} label={item} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      Backend services
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(primeMetadata.aiCodebasePackage.backendServices || []).map((item) => (
                        <StatusPill key={item} label={item} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      Database models
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(primeMetadata.aiCodebasePackage.databaseModels || []).map((item) => (
                        <StatusPill key={item} label={item} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      Runtime workers
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(primeMetadata.aiCodebasePackage.runtimeWorkers || []).map((item) => (
                        <StatusPill key={item} label={item} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      RioMind Nexus integrations
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(primeMetadata.aiCodebasePackage.rioMindNexusIntegrations || []).map((item) => (
                        <StatusPill key={item} label={item} tone="ready" />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                      Compliance notes
                    </div>
                    <div className="mt-3 space-y-2">
                      {(primeMetadata.aiCodebasePackage.complianceNotes || []).map((item) => (
                        <div
                          key={item}
                          className="rounded-xl border border-amber-300/18 bg-amber-500/8 px-3 py-2 text-xs leading-5 text-amber-100/80"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {primeMetadata.creatorUtilityLabels.length ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-black/22 p-5">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-white/38">
                  Creator Utility Suite
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {primeMetadata.creatorUtilityLabels.map((utility) => (
                    <StatusPill key={utility} label={utility} tone="ready" />
                  ))}
                </div>
              </div>
            ) : null}

            {primeMetadata.aiArchitecture ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <DetailCard
                  title="Frontend architecture"
                  value={primeMetadata.aiArchitecture.frontend || "Frontend profile pending"}
                />
                <DetailCard
                  title="Backend architecture"
                  value={primeMetadata.aiArchitecture.backend || "Backend profile pending"}
                />
                <DetailCard
                  title="Codebase pattern"
                  value={primeMetadata.aiArchitecture.codebase || "Codebase profile pending"}
                />
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/35">
                    Core modules
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(primeMetadata.aiArchitecture.modules || []).map((module) => (
                      <StatusPill key={module} label={module} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-white/35">
              RioDex
            </div>
            <div className="mt-2 text-lg font-semibold">
              {market.tradeReady ? "Trade route ready" : "Awaiting route"}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Prime tokens become tradeable when an indexed RioDex pair and
              liquidity route are available.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-white/35">
              RioEx
            </div>
            <div className="mt-2 text-lg font-semibold">
              Asset profile surface
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">
              RioEx acts as the market and asset intelligence page for Prime
              tokens, including future liquidity, volume, and external listing
              metadata.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-white/35">
              RioExplorer
            </div>
            <div className="mt-2 text-lg font-semibold">
              Indexed proof layer
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Token creation, liquidity, swaps, and issuer activity should all
              resolve into explorer records as the chain indexer matures.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
