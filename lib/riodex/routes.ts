// lib/riodex/routes.ts

export const RIODEX_HOME_ROUTE = "/riodex";
export const RIODEX_SCREENER_ROUTE = "/rioex";
export const RIODEX_SWAP_ROUTE = "/riodex/swap";
export const RIODEX_LIQUIDITY_ROUTE = "/riodex/pools";
export const RIODEX_POOLS_ROUTE = "/riodex/pools";
export const RIODEX_POOL_BASE_ROUTE = "/riodex/pools";

export const LAUNCHPAD_ROUTE = "/launch";
export const RIOEX_ROUTE = "/rioex";
export const RIOEXPLORER_ROUTE = "/rioexplorer";

export const CANONICAL_RIODEX_PAIR_ADDRESS =
  "rio1vh2p4x96m0qcvhzh3g86dxg9zu8pzwj4xuuwyf2z8dpmshcf0qmsgf7tp6";

export type RioDexNavItem = {
  key: string;
  label: string;
  href: string;
  visible?: boolean;
};

function cleanValue(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : "";
}

function buildQuery(
  basePath: string,
  params: Record<string, string | number | boolean | null | undefined>
) {
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const next = String(value).trim();
    if (!next) continue;
    qs.set(key, next);
  }

  const finalQuery = qs.toString();
  return finalQuery ? `${basePath}?${finalQuery}` : basePath;
}

export function normalizePairAddress(pairAddress?: string | null) {
  return cleanValue(pairAddress);
}

export function buildRioDexHomeRoute() {
  return RIODEX_HOME_ROUTE;
}

export function buildRioDexScreenerRoute(options?: {
  search?: string;
  preset?: string;
  classFilter?: string;
  statusFilter?: string;
  timeframe?: string;
  rankBy?: string;
}) {
  return buildQuery(RIODEX_SCREENER_ROUTE, {
    search: options?.search,
    preset: options?.preset,
    class: options?.classFilter,
    status: options?.statusFilter,
    timeframe: options?.timeframe,
    rankBy: options?.rankBy,
  });
}

export function buildRioDexSwapRoute(options?: {
  pairAddress?: string | null;
  from?: string | null;
  to?: string | null;
  mode?: string | null;
}) {
  const pair = normalizePairAddress(options?.pairAddress);

  return buildQuery(RIODEX_SWAP_ROUTE, {
    pair,
    from: cleanValue(options?.from),
    to: cleanValue(options?.to),
    mode: cleanValue(options?.mode),
  });
}

export function buildRioDexLiquidityRoute(options?: {
  pairAddress?: string | null;
  mode?: "add" | "remove" | string | null;
  source?: string | null;
  token?: string | null;
  tx?: string | null;
  graduated?: boolean | null;
}) {
  const pair = normalizePairAddress(options?.pairAddress);

  return buildQuery(RIODEX_LIQUIDITY_ROUTE, {
    pair,
    mode: cleanValue(options?.mode),
    source: cleanValue(options?.source),
    token: cleanValue(options?.token),
    tx: cleanValue(options?.tx),
    graduated: options?.graduated ? "1" : undefined,
  });
}

export function buildRioDexPoolsRoute() {
  return RIODEX_POOLS_ROUTE;
}

export function buildRioDexPoolRoute(pairAddress?: string | null) {
  const pair = normalizePairAddress(pairAddress);
  if (!pair) return RIODEX_POOLS_ROUTE;
  return `${RIODEX_POOL_BASE_ROUTE}/${encodeURIComponent(pair)}`;
}

export function buildLaunchpadRoute() {
  return LAUNCHPAD_ROUTE;
}

export function buildRioExRoute() {
  return RIOEX_ROUTE;
}

export function buildRioExplorerRoute() {
  return RIOEXPLORER_ROUTE;
}

export function buildRioDexSurfaceMap(pairAddress?: string | null) {
  const pair = normalizePairAddress(pairAddress);

  return {
    home: buildRioDexHomeRoute(),
    screener: buildRioDexScreenerRoute(),
    swap: buildRioDexSwapRoute({ pairAddress: pair }),
    liquidity: buildRioDexLiquidityRoute({ pairAddress: pair }),
    pools: buildRioDexPoolsRoute(),
    pool: buildRioDexPoolRoute(pair),
    launchpad: buildLaunchpadRoute(),
    rioex: buildRioExRoute(),
    rioexplorer: buildRioExplorerRoute(),
  };
}

export function buildRioDexTopExpansionNav(): RioDexNavItem[] {
  return [
    {
      key: "launchpad",
      label: "Launchpad",
      href: buildLaunchpadRoute(),
      visible: true,
    },
    {
      key: "rioex",
      label: "RioEx",
      href: buildRioExRoute(),
      visible: true,
    },
    {
      key: "rioexplorer",
      label: "RioExplorer",
      href: buildRioExplorerRoute(),
      visible: true,
    },
  ];
}

export function buildRioDexOperatorNav(pairAddress?: string | null): RioDexNavItem[] {
  const routes = buildRioDexSurfaceMap(pairAddress);

  return [
    {
      key: "home",
      label: "Back to RioDex",
      href: routes.home,
      visible: true,
    },
    {
      key: "screener",
      label: "Screener",
      href: routes.screener,
      visible: true,
    },
    {
      key: "swap",
      label: "Swap",
      href: routes.swap,
      visible: true,
    },
    {
      key: "liquidity",
      label: "Liquidity",
      href: routes.liquidity,
      visible: true,
    },
    {
      key: "pool",
      label: "Pool",
      href: routes.pool,
      visible: !!normalizePairAddress(pairAddress),
    },
    {
      key: "pools",
      label: "Pools",
      href: routes.pools,
      visible: true,
    },
  ].filter((item) => item.visible !== false);
}

export function buildRioDexRowActions(pairAddress?: string | null): RioDexNavItem[] {
  const routes = buildRioDexSurfaceMap(pairAddress);

  return [
    { key: "pool", label: "Pool", href: routes.pool, visible: true },
    { key: "swap", label: "Swap", href: routes.swap, visible: true },
    { key: "liquidity", label: "Liquidity", href: routes.liquidity, visible: true },
  ];
}

export type RioDexSurfaceHref = {
  home: string;
  screener: string;
  swap: string;
  liquidity: string;
  pools: string;
  pool: string;
};

export function buildRioDexSurfaceHref(
  pairAddress?: string | null
): RioDexSurfaceHref {
  const clean = String(pairAddress || "").trim();

  return {
    home: RIODEX_HOME_ROUTE,
    screener: RIODEX_SCREENER_ROUTE,
    swap: clean
      ? `${RIODEX_SWAP_ROUTE}?pair=${encodeURIComponent(clean)}`
      : RIODEX_SWAP_ROUTE,
    liquidity: clean
      ? `${RIODEX_LIQUIDITY_ROUTE}?pool=${encodeURIComponent(clean)}`
      : RIODEX_LIQUIDITY_ROUTE,
    pools: RIODEX_POOLS_ROUTE,
    pool: clean
      ? `${RIODEX_POOL_BASE_ROUTE}/${encodeURIComponent(clean)}`
      : RIODEX_POOLS_ROUTE,
  };
}

export function buildRioDexTopbarNavItems() {
  return [
    { label: "RioDex", href: RIODEX_HOME_ROUTE },
    { label: "Screener", href: RIODEX_SCREENER_ROUTE },
    { label: "Swap", href: RIODEX_SWAP_ROUTE },
    { label: "Liquidity", href: RIODEX_LIQUIDITY_ROUTE },
    { label: "Pools", href: RIODEX_POOLS_ROUTE },
  ];
}

