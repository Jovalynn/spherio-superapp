import {getRioPriceRusd} from "./rioEconomics";
export type RioValuationResponse = {
  ok: boolean;
  source?: string;
  authority?: string;
  pair?: string;
  pool?: {
    pair_address?: string | null;
    pair_key?: string | null;
    asset_0_id?: string | null;
    asset_1_id?: string | null;
    display_symbol?: string | null;
    reserve_0?: string | number | null;
    reserve_1?: string | number | null;
    block_height?: string | number | null;
    block_time?: string | null;
  };
  price?: {
    rio?: {
      rusd?: number | null;
      usd?: number | null;
      usdt?: number | null;
      btc?: number | null;
    };
  };
  updated_at?: string;
  diagnostics?: unknown;
};

export type NormalizedPortfolioAsset = {
  asset_id: string;
  symbol: string;
  name?: string | null;
  amount: number;
  raw_amount?: string | number | null;
  decimals?: number | null;
  value_rio: number | null;
  value_rusd: number | null;
  value_usd: number | null;
  value_usdt: number | null;
  valuation_source: string;
  valuation_status: "priced" | "unpriced";
};

export type ValuedPortfolio = {
  ok: boolean;
  address: string;
  source: string;
  valuation: RioValuationResponse;
  totals: {
    rio: number | null;
    rusd: number | null;
    usd: number | null;
    usdt: number | null;
    btc: number | null;
  };
  assets: NormalizedPortfolioAsset[];
  raw_portfolio: unknown;
  updated_at: string;
};

export const RIO_ASSET_IDS = ["urio", "rio", "RIO"];

export const RUSD_ASSET_IDS: readonly string[] = Object.freeze([] as string[]); // Canonical identity activation pending.

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeAssetId(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeSymbol(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

export function isRioAsset(asset: unknown): boolean {
  const value = normalizeAssetId(asset);
  return value === "urio";
}

export function isRusdAsset(asset: unknown): boolean {
  const value = normalizeAssetId(asset);
  return RUSD_ASSET_IDS.includes(value);
}

export function humanAmount(raw: unknown, decimals: unknown = 6): number {
  const directAmount = asNumber(raw);
  if (directAmount === null) return 0;

  const d = asNumber(decimals);
  const safeDecimals = d === null || d < 0 || d > 30 ? 6 : d;

  // This helper accepts explicit base-unit fields. Never infer units from magnitude.
  return directAmount / Math.pow(10, safeDecimals);
}

export function extractAssetsFromPortfolio(raw: any): any[] {
  if (!raw || typeof raw !== "object") return [];

  const assets: any[] = [];

  // RioLight native RIO shape:
  // raw.native.rio = { denom, symbol, amountBase, amount, display, source }
  if (raw.native?.rio) {
    assets.push({
      kind: "native",
      asset_id: raw.native.rio.denom ?? "urio",
      symbol: raw.native.rio.symbol ?? "RIO",
      name: "Real-World Interconnected On-chain",
      amount: raw.native.rio.amount,
      raw_amount: raw.native.rio.amountBase,
      decimals: 6,
      source: raw.native.rio.source ?? "riolight_native",
    });
  }

  // Generic array shapes, if future APIs expose them.
  const candidates = [
    raw.assets,
    raw.balances,
    raw.tokens,
    raw.holdings,
    raw.portfolio?.assets,
    raw.portfolio?.balances,
    raw.data?.assets,
    raw.data?.balances,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      assets.push(...candidate);
    }
  }

  // RioLight structured sections.
  const sections = raw.sections ?? {};
  const sectionKeys = ["pump", "prime", "spo20", "ibc", "bridged", "offchain"];

  for (const key of sectionKeys) {
    const section = sections[key];

    if (Array.isArray(section)) {
      for (const item of section) {
        assets.push({
          ...item,
          kind: item.kind ?? key,
          asset_id:
            item.asset_id ??
            item.assetId ??
            item.tokenAddress ??
            item.token_address ??
            item.contract_address ??
            item.contractAddress,
          symbol: item.symbol,
          name: item.name ?? item.tokenName,
          amount:
            item.balance ??
            item.netTokenAmount ??
            item.amount ??
            item.quantity ??
            0,
          raw_amount:
            item.balanceBase ??
            item.amountBase ??
            item.raw_amount ??
            item.rawAmount ??
            null,
          decimals: item.decimals ?? 6,
        });
      }
    }
  }

  // Some versions expose pump/prime positions outside sections.
  if (Array.isArray(raw.positions)) {
    for (const item of raw.positions) {
      assets.push({
        ...item,
        kind: item.kind ?? "position",
        asset_id:
          item.asset_id ??
          item.assetId ??
          item.tokenAddress ??
          item.token_address ??
          item.contract_address ??
          item.contractAddress,
        symbol: item.symbol,
        name: item.name ?? item.tokenName,
        amount:
          item.balance ??
          item.netTokenAmount ??
          item.amount ??
          item.quantity ??
          0,
        raw_amount:
          item.balanceBase ??
          item.amountBase ??
          item.raw_amount ??
          item.rawAmount ??
          null,
        decimals: item.decimals ?? 6,
      });
    }
  }

  // Deduplicate exact asset/kind/source rows where possible.
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = [
      asset.kind ?? "",
      asset.asset_id ?? asset.assetId ?? asset.tokenAddress ?? asset.contract_address ?? "",
      asset.symbol ?? "",
      asset.raw_amount ?? asset.rawAmount ?? asset.amount ?? asset.balance ?? "",
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAssetId(asset: any): string {
  return normalizeAssetId(
    asset?.asset_id ??
      asset?.assetId ??
      asset?.denom ??
      asset?.denom_or_address ??
      asset?.contract_address ??
      asset?.address ??
      asset?.token_address ??
      asset?.id ??
      asset?.symbol,
  );
}

export function getAssetSymbol(asset: any): string {
  const symbol = asset?.symbol ?? asset?.ticker ?? asset?.display_symbol;
  if (symbol) return String(symbol);

  const assetId = getAssetId(asset);
  if (isRioAsset(assetId)) return "RIO";
  if (isRusdAsset(assetId)) return "RUSD";

  return assetId || "UNKNOWN";
}

export function getAssetAmount(asset: any): number {
  const human =
    asNumber(asset?.amount) ??
    asNumber(asset?.balance) ??
    asNumber(asset?.quantity) ??
    asNumber(asset?.available);

  if (human !== null) {
    return human;
  }

  const raw =
    asset?.amount_base ??
    asset?.amountBase ??
    asset?.balance_base ??
    asset?.balanceBase ??
    asset?.raw_amount ??
    asset?.rawAmount ??
    0;

  const decimals = asset?.decimals ?? asset?.asset_decimals ?? 6;

  return humanAmount(raw, decimals);
}

export function valuePortfolioWithRioPrice(params: {
  address: string;
  rawPortfolio: unknown;
  valuation: RioValuationResponse;
}): ValuedPortfolio {
  const { address, rawPortfolio, valuation } = params;

  const rioPriceRusd = getRioPriceRusd(valuation);
  const rioPriceUsd: number | null = null;
  const rioPriceUsdt: number | null = null;

  const rawAssets = extractAssetsFromPortfolio(rawPortfolio);

  const assets: NormalizedPortfolioAsset[] = rawAssets.map((asset: any) => {
    const asset_id = getAssetId(asset);
    const symbol = getAssetSymbol(asset);
    const amount = getAssetAmount(asset);
    const decimals = asNumber(asset?.decimals ?? asset?.asset_decimals ?? 6);

    let value_rusd: number | null = null;
    let value_usd: number | null = null;
    let value_usdt: number | null = null;
    let value_rio: number | null = null;
    let valuation_status: "priced" | "unpriced" = "unpriced";
    let valuation_source = "unpriced";

    if (isRioAsset(asset_id)) {
      value_rio=amount;
      if (rioPriceRusd !== null) {
        value_rusd = amount * rioPriceRusd;
        value_usd = rioPriceUsd !== null ? amount * rioPriceUsd : null;
        value_usdt = rioPriceUsdt !== null ? amount * rioPriceUsdt : null;
        value_rio = amount;
        valuation_status = "priced";
        valuation_source = "rioex_valuation_rio";
      }
    } else if (isRusdAsset(asset_id)) {
      value_rusd = amount;
      value_usd = null;
      value_usdt = null;

      if (rioPriceRusd && rioPriceRusd > 0) {
        value_rio = amount / rioPriceRusd;
      }

      valuation_status = "priced";
      valuation_source = "canonical_rusd_par";
    }
    // Embedded client/DB values and token labels cannot establish monetary values.

    return {
      asset_id,
      symbol,
      name: asset?.name ?? asset?.display_name ?? null,
      amount,
      raw_amount:
        asset?.amount_base ??
        asset?.amountBase ??
        asset?.balance_base ??
        asset?.balanceBase ??
        asset?.raw_amount ??
        asset?.rawAmount ??
        asset?.amount ??
        asset?.balance ??
        null,
      decimals,
      value_rio,
      value_rusd,
      value_usd,
      value_usdt,
      valuation_source,
      valuation_status,
    };
  });

  const totalRusd = assets.some(asset=>asset.value_rusd===null)?null:assets.reduce((sum, asset) => sum + (asset.value_rusd ?? 0), 0);
  const totalUsd = assets.some(asset=>asset.value_usd===null)?null:assets.reduce((sum, asset) => sum + (asset.value_usd ?? 0), 0);
  const totalUsdt = assets.some(asset=>asset.value_usdt===null)?null:assets.reduce((sum, asset) => sum + (asset.value_usdt ?? 0), 0);

  const totalRio =
    rioPriceRusd && rioPriceRusd > 0 && totalRusd!==null
      ? totalRusd / rioPriceRusd
      : assets.some(asset=>asset.value_rio===null)?null:assets.reduce((sum, asset) => sum + (asset.value_rio ?? 0), 0);

  return {
    ok: true,
    address,
    source: "riolight_portfolio_value",
    valuation,
    totals: {
      rio: Number.isFinite(totalRio) ? totalRio : null,
      rusd: totalRusd,
      usd: totalUsd,
      usdt: totalUsdt,
      btc: null,
    },
    assets,
    raw_portfolio: rawPortfolio,
    updated_at: new Date().toISOString(),
  };
}
