type BridgeRoute = {
  id: string;
  status: string;
  counterpartyChainName?: string;
  destinationChainName?: string;
  canonicalSymbol?: string;
  destinationStandard?: string;
  supportedAssets?: Array<{ symbol: string }>;
};

type ActivationItem = {
  id: string;
  label: string;
  status: string;
  required?: boolean;
};

type ActivationStack = {
  id: string;
  label: string;
  currentStatus: string;
  executionEnabled: boolean;
  completionEstimatePct: number;
  items: ActivationItem[];
};

async function getBridgeRegistry() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/bridge/registry`, {
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getActivationChecklist() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/bridge/activation-checklist`, {
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function statusClass(status?: string) {
  if (status === "live") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  if (status === "testing" || status === "configured") return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function RouteGroup({
  title,
  subtitle,
  routes,
}: {
  title: string;
  subtitle: string;
  routes: BridgeRoute[];
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
            {title}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
          {routes.length} routes
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {routes.map((route) => {
          const chain =
            route.counterpartyChainName ||
            route.destinationChainName ||
            route.destinationStandard ||
            "Future route";

          const assets =
            route.supportedAssets?.map((asset) => asset.symbol).join(" / ") ||
            route.canonicalSymbol ||
            "RIO / RUSD";

          return (
            <div key={route.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">{chain}</div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">{route.id}</div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass(route.status)}`}>
                  {route.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Assets / Standard
                </div>
                <div className="mt-1 text-sm font-bold text-slate-200">
                  {assets}
                  {route.destinationStandard ? ` → ${route.destinationStandard}` : ""}
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Non-executable until route contracts, channels, relayers, and RioExplorer proof are verified.
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivationChecklistSection({
  activation,
}: {
  activation: any;
}) {
  const stacks: ActivationStack[] = activation?.activation?.stacks || [];
  const activationRule = activation?.activation?.activationRule;

  if (!stacks.length) {
    return (
      <section className="rounded-[28px] border border-amber-300/20 bg-amber-400/10 p-5">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100/80">
          Activation checklist
        </div>
        <h2 className="mt-2 text-2xl font-black text-white">
          Checklist unavailable
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-amber-100/80">
          The bridge registry is visible, but the activation checklist endpoint did not return a usable payload.
          Execution remains disabled until proof requirements are available and verified.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-cyan-300/15 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
            Activation checklist
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">
            Proof required before bridge execution
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
            Each route stack stays non-executable until the real route infrastructure,
            end-to-end transaction proof, RioLight review, RioExplorer proof, and safety controls are complete.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-100">
          Execution disabled
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {stacks.map((stack) => {
          const completeCount = stack.items.filter((item) => item.status === "complete").length;
          const requiredCount = stack.items.filter((item) => item.required).length;

          return (
            <div key={stack.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-black text-white">{stack.label}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {stack.currentStatus}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white">
                    {stack.completionEstimatePct}%
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {completeCount}/{requiredCount} complete
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${stack.completionEstimatePct}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2">
                {stack.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="text-xs font-bold text-slate-300">{item.label}</span>
                    <span
                      className={
                        item.status === "complete"
                          ? "rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-100"
                          : "rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-slate-400"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activationRule ? (
        <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm font-bold leading-7 text-cyan-100">
          {activationRule}
        </div>
      ) : null}
    </section>
  );
}

export default async function RioExBridgePage() {
  const [data, activationChecklist] = await Promise.all([
    getBridgeRegistry(),
    getActivationChecklist(),
  ]);

  const registry = data?.registries;
  const readiness = data?.readiness;

  const ibcRoutes = registry?.ibc?.routes || [];
  const axelarRoutes = registry?.axelar?.routes || [];
  const hyperlaneRoutes = registry?.hyperlane?.routes || [];
  const evmRoutes = registry?.evmRepresentation?.routes || [];

  return (
    <main className="min-h-screen bg-[#030816] px-6 py-8 text-white">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <section className="rounded-[32px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_0_60px_rgba(8,145,178,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/70">
                RioEx Bridge
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                Cross-chain route intelligence
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                RioEx Bridge now reads the unified bridge registry for IBC, Axelar, Hyperlane,
                and SPO-20 ↔ ERC-20 representation routes. Execution remains disabled until
                channel, contract, relayer, and proof requirements are verified.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-100">
              Execution: {data?.executionEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              ["IBC", readiness?.ibc],
              ["Axelar", readiness?.axelar],
              ["Hyperlane", readiness?.hyperlane],
              ["EVM Representation", readiness?.evmRepresentation],
            ].map(([label, item]: any) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </div>
                <div className="mt-2 text-lg font-black text-white">{item?.status || "unknown"}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {item?.liveRoutes || 0} live / {item?.plannedRoutes || 0} planned
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
            Canonical asset rule
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">
            SPO-20 is canonical. ERC-20 is represented.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
            {data?.canonicalModel?.rule ||
              "SPO-20 on SpherioChain is the canonical source of truth. ERC-20 assets on EVM chains are represented assets controlled by bridge and proof rules."}
          </p>
        </section>

        <ActivationChecklistSection activation={activationChecklist} />

        <RouteGroup
          title="IBC routes"
          subtitle="Cosmos-native transfer and interchain liquidity paths. These stay planned until real channel IDs and relayer proofs exist."
          routes={ibcRoutes}
        />

        <RouteGroup
          title="Axelar routes"
          subtitle="Future bridge paths for EVM liquidity and represented RIO/RUSD access."
          routes={axelarRoutes}
        />

        <RouteGroup
          title="Hyperlane routes"
          subtitle="Future interchain messaging and represented asset paths for EVM chains."
          routes={hyperlaneRoutes}
        />

        <RouteGroup
          title="SPO-20 ↔ ERC-20 representation"
          subtitle="Canonical Spherio assets mapped to future ERC-20 representations for EVM builders and liquidity access."
          routes={evmRoutes}
        />
      </div>
    </main>
  );
}
