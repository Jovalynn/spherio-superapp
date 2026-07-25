import Link from "next/link";

export type ExchangeSurfaceNavFeatured = {
  displaySymbol: string;
  canonicalSymbol?: string | null;
  baseSymbol?: string | null;
  quoteSymbol?: string | null;
  liquidityUsd?: number | null;
  feeBps?: number | null;
  isCanonical?: boolean | null;
  isLive?: boolean | null;
  routes?: {
    assetTerminal?: string;
    marketBoard?: string;
    hero?: string;
    trade?: string;
    pool?: string;
    swap?: string;
    liquidity?: string;
  };
};

type NavItem = {
  key: string;
  label: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
};

function formatMoney(value?: number | null, unknownLabel = "USD pending") {
  if (value === null || value === undefined) return unknownLabel;

  const n = Number(value);
  if (!Number.isFinite(n)) return unknownLabel;

  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n)}`;
}

function shellClass() {
  return "rounded-[30px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(5,14,38,0.92),rgba(4,10,28,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl";
}

function activePillClass() {
  return "inline-flex h-12 items-center justify-center rounded-full border border-cyan-400 bg-cyan-400/10 px-6 text-[15px] font-semibold text-cyan-300";
}

function idlePillClass() {
  return "inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 text-[15px] font-medium text-white/92 hover:bg-white/[0.08]";
}

function disabledPillClass() {
  return "inline-flex h-12 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-6 text-[15px] font-medium text-white/40";
}

function badgeClass(kind: "canonical" | "live" | "neutral") {
  if (kind === "canonical") {
    return "rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200";
  }
  if (kind === "live") {
    return "rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200";
  }
  return "rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300";
}

function renderNavItem(item: NavItem, activeKey?: string) {
  const active = item.key === activeKey;

  if (item.disabled) {
    return (
      <span key={item.key} className={disabledPillClass()}>
        {item.label}
      </span>
    );
  }

  if (item.external) {
    return (
      <a
        key={item.key}
        href={item.href || "#"}
        target="_blank"
        rel="noreferrer"
        className={active ? activePillClass() : idlePillClass()}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      key={item.key}
      href={item.href || "#"}
      className={active ? activePillClass() : idlePillClass()}
    >
      {item.label}
    </Link>
  );
}

function normalizeFeaturedDisplay(featured?: ExchangeSurfaceNavFeatured | null) {
  if (!featured) return "—";

  const raw = String(featured.displaySymbol || "").trim();
  if (raw) return raw;

  const base = String(featured.baseSymbol || "").trim();
  const quote = String(featured.quoteSymbol || "").trim();
  if (base && quote) return `${base} / ${quote}`;

  if (featured.canonicalSymbol?.trim()) {
    return featured.canonicalSymbol.replace("/", " / ");
  }

  return "—";
}

export default function ExchangeSurfaceNav({
  product,
  activeKey,
  featured,
  title,
  subtitle,
}: {
  product: "riodex" | "rioex";
  activeKey:
    | "overview"
    | "assets"
    | "markets"
    | "trades"
    | "swap"
    | "pool"
    | "liquidity"
    | "screener"
    | "launchpad"
    | "rio"
    | "rusd"
    | "riodex"
    | "rioex"
    | "rioexplorer"
    | "account";
  featured?: ExchangeSurfaceNavFeatured | null;
  title: string;
  subtitle: string;
}) {
  const marketBoard = featured?.routes?.marketBoard || "/rioex";
  const assetTerminal = featured?.routes?.assetTerminal || marketBoard;
  const tradeRoute =
    featured?.routes?.trade ||
    ((assetTerminal && assetTerminal !== marketBoard && !assetTerminal.endsWith("/trades"))
      ? `${assetTerminal}/trades`
      : assetTerminal);
  const swapRoute = featured?.routes?.swap || "/riodex/swap";
  const poolRoute = featured?.routes?.pool || "/riodex/pools";
  const liquidityRoute = featured?.routes?.liquidity || "/riodex/pools";
  const featuredDisplay = normalizeFeaturedDisplay(featured);

  const navItems: NavItem[] = [
    { key: "overview", label: "Overview", href: product === "riodex" ? "/riodex" : "/rioex" },
    { key: "assets", label: "Assets", href: "/rioex/assets" },
    { key: "markets", label: "Markets", href: "/rioex" },
    { key: "trades", label: "Trades", href: tradeRoute },
    { key: "swap", label: "Swap", href: swapRoute },
    { key: "pool", label: "Pool", href: poolRoute },
    { key: "liquidity", label: "Liquidity", href: liquidityRoute },
    { key: "screener", label: "Screener", href: "/rioex" },
    { key: "launchpad", label: "LaunchPad", href: "/launch" },
    { key: "rio", label: "RIO", href: "/terminals/rio" },
    { key: "rusd", label: "RUSD", href: "/terminals/rusd" },
    { key: "riodex", label: "RioDex", href: "/riodex" },
    { key: "rioex", label: "RioEx", href: "/rioex" },
    { key: "rioexplorer", label: "RioExplorer", href: "/rioexplorer" },
    { key: "account", label: "Account", href: "/account" },
  ];

  return (
    <section className={shellClass()}>
      <div className="flex flex-col gap-6 border-b border-cyan-400/10 px-6 py-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/72">
            {product === "riodex" ? "RioDex • Surface Navigation" : "RioEx • Surface Navigation"}
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-white/70">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={badgeClass("neutral")}>Single Truth Layer</span>
            {featured?.isCanonical ? <span className={badgeClass("canonical")}>Canonical</span> : null}
            {featured?.isLive ? <span className={badgeClass("live")}>Live</span> : null}
          </div>
        </div>

        <div className="grid min-w-[300px] grid-cols-2 gap-3 xl:w-[360px]">
          <div className="rounded-[22px] border border-cyan-400/16 bg-[#162451] px-5 py-5">
            <div className="text-[13px] text-sky-200/90">Featured Market</div>
            <div className="mt-4 text-2xl font-semibold text-white">
              {featuredDisplay}
            </div>
          </div>

          <div className="rounded-[22px] border border-cyan-400/16 bg-[#162451] px-5 py-5">
            <div className="text-[13px] text-sky-200/90">Registry TVL</div>
            <div className="mt-4 text-2xl font-semibold text-white">
              {formatMoney(featured?.liquidityUsd)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-3">
          {navItems.map((item) => renderNavItem(item, activeKey))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://createtoken.live"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full border border-fuchsia-400/40 bg-[linear-gradient(180deg,rgba(217,70,239,0.22),rgba(157,23,77,0.18))] px-6 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(217,70,239,0.16)]"
          >
            CreateToken.live
          </a>
          <a
            href="https://pump.live"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full border border-cyan-400/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.20),rgba(8,145,178,0.12))] px-6 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(34,211,238,0.16)]"
          >
            Pump.live
          </a>
        </div>
      </div>
    </section>
  );
}
