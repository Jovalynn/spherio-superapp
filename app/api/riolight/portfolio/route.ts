import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { SPHERIO } from "@/lib/spherioConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var __riolightPortfolioPgPool: Pool | undefined;
}

function getPgPool() {
  if (!globalThis.__riolightPortfolioPgPool) {
    globalThis.__riolightPortfolioPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return globalThis.__riolightPortfolioPgPool;
}

function isRioAddress(value: string) {
  return /^rio1[a-z0-9]{20,}$/i.test(value);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function humanBase(value: unknown, decimals = 6): number {
  return toNumber(value, 0) / 10 ** decimals;
}

function compact(value: number, decimals = 6) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0;
}

type PumpPositionRow = {
  token_address: string;
  token_name: string | null;
  token_symbol: string | null;
  status: string | null;
  buy_token_base: string | null;
  sell_token_base: string | null;
  buy_rio_urio: string | null;
  sell_rio_urio: string | null;
  fees_urio: string | null;
  trade_count: string | null;
  last_trade_at: string | null;
  real_rio_reserve_urio: string | null;
  real_token_reserve_base: string | null;
  virtual_rio_reserve_urio: string | null;
  virtual_token_reserve_base: string | null;
  target_market_cap_rusd: string | null;
};
type Spo20BalanceRow = {
  token_address: string;
  symbol: string | null;
  creator: string | null;
  balance: string | null;
  updated_height: string | number | null;
  updated_at: string | null;
};

function cleanSymbol(value: unknown, fallback = "SPO20") {
  const symbol = String(value || "")
    .replace(/^\s*:+\s*/, "")
    .trim()
    .toUpperCase();

  return symbol || fallback;
}

function mapSpo20Balance(row: Spo20BalanceRow) {
  const balanceBase = String(row.balance || "0");
  const balance = humanBase(balanceBase);

  return {
    kind: "spo20",
    tokenAddress: row.token_address,
    symbol: cleanSymbol(row.symbol),
    name: cleanSymbol(row.symbol),
    balanceBase,
    balance: compact(balance, 6),
    display: `${compact(balance, 6)} ${cleanSymbol(row.symbol)}`,
    decimals: 6,
    creator: row.creator,
    updatedHeight: Number(row.updated_height || 0),
    updatedAt: row.updated_at,
    source: "spo20_balances",
    routes: {
      explorer: `/rioexplorer/spo20/${row.token_address}`,
      pump: `/createtoken/pump/board?token=${row.token_address}`,
    },
  };
}


function mapPumpPosition(row: PumpPositionRow) {
  const buyToken = humanBase(row.buy_token_base);
  const sellToken = humanBase(row.sell_token_base);
  const netToken = Math.max(buyToken - sellToken, 0);

  const buyRio = humanBase(row.buy_rio_urio);
  const sellRio = humanBase(row.sell_rio_urio);
  const netRioSpent = Math.max(buyRio - sellRio, 0);
  const feesRio = humanBase(row.fees_urio);

  const realRioReserve = humanBase(row.real_rio_reserve_urio);
  const realTokenReserve = humanBase(row.real_token_reserve_base);
  const virtualRioReserve = humanBase(row.virtual_rio_reserve_urio);
  const virtualTokenReserve = humanBase(row.virtual_token_reserve_base);

  const hasRealCurveMovement = realRioReserve > 0;
  const effectiveRioReserve = hasRealCurveMovement ? realRioReserve + virtualRioReserve : 0;
  const effectiveTokenReserve = hasRealCurveMovement ? realTokenReserve + virtualTokenReserve : 0;
  const effectivePriceRio =
    effectiveRioReserve > 0 && effectiveTokenReserve > 0
      ? effectiveRioReserve / effectiveTokenReserve
      : 0;

  const marketCapRio =
    effectivePriceRio > 0 ? effectivePriceRio * 1_000_000_000 : 3000;

  const targetMarketCapRio = toNumber(row.target_market_cap_rusd, 65_000);
  const progressPercent =
    targetMarketCapRio > 0
      ? Math.max(0, Math.min((marketCapRio / targetMarketCapRio) * 100, 100))
      : 0;

  return {
    kind: "pump",
    tokenAddress: row.token_address,
    tokenName: row.token_name || "Pump Token",
    symbol: row.token_symbol || "PUMP",
    status: row.status || "bonding",
    netTokenAmount: compact(netToken, 6),
    totalBoughtTokenAmount: compact(buyToken, 6),
    totalSoldTokenAmount: compact(sellToken, 6),
    netRioSpent: compact(netRioSpent, 6),
    totalRioIn: compact(buyRio, 6),
    totalRioOut: compact(sellRio, 6),
    feesRio: compact(feesRio, 6),
    tradeCount: Number(row.trade_count || 0),
    lastTradeAt: row.last_trade_at,
    curve: {
      effectivePriceRio,
      marketCapRio: compact(marketCapRio, 6),
      progressPercent: compact(progressPercent, 4),
      realRioReserve: compact(realRioReserve, 6),
      virtualRioReserve: compact(virtualRioReserve, 6),
    },
    routes: {
      pump: `/createtoken/pump/board?token=${row.token_address}`,
      explorer: `/rioexplorer/spo20/${row.token_address}`,
    },
  };
}


async function fetchNativeRioBalance(address: string) {
  const rest = String(
    process.env.SPHERIO_SERVER_REST_URL ||
      process.env.NEXT_PUBLIC_SERVER_REST_URL ||
      SPHERIO.rest ||
      "",
  ).replace(/\/$/, "");

  if (!rest) {
    return {
      denom: "urio",
      symbol: "RIO",
      amountBase: "0",
      amount: 0,
      display: "0 RIO",
      source: "rest_unconfigured",
      error: "Missing Spherio REST endpoint.",
    };
  }

  try {
    const response = await fetch(
      `${rest}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=urio`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(`REST balance query failed with ${response.status}`);
    }

    const data = await response.json();
    const amountBase = String(data?.balance?.amount || "0");
    const amount = humanBase(amountBase);

    return {
      denom: "urio",
      symbol: "RIO",
      amountBase,
      amount: compact(amount, 6),
      display: `${compact(amount, 6)} RIO`,
      source: "spherio_rest_bank_module",
    };
  } catch (error) {
    return {
      denom: "urio",
      symbol: "RIO",
      amountBase: "0",
      amount: 0,
      display: "0 RIO",
      source: "spherio_rest_bank_module",
      error: error instanceof Error ? error.message : "Failed to load native RIO balance.",
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const address = (request.nextUrl.searchParams.get("address") || "").trim();

    if (!isRioAddress(address)) {
      return NextResponse.json(
        { ok: false, error: "A valid rio1 wallet address is required." },
        { status: 400 },
      );
    }

    const pool = getPgPool();
    const nativeRioBalance = await fetchNativeRioBalance(address);

    const pumpPositions = await pool.query<PumpPositionRow>(
      `
        WITH wallet_trades AS (
          SELECT
            token_address,
            SUM(CASE WHEN side = 'buy' THEN token_amount_base ELSE 0 END) AS buy_token_base,
            SUM(CASE WHEN side = 'sell' THEN token_amount_base ELSE 0 END) AS sell_token_base,
            SUM(CASE WHEN side = 'buy' THEN rio_amount_urio ELSE 0 END) AS buy_rio_urio,
            SUM(CASE WHEN side = 'sell' THEN rio_amount_urio ELSE 0 END) AS sell_rio_urio,
            SUM(fee_amount_urio) AS fees_urio,
            COUNT(*) AS trade_count,
            MAX(block_time) AS last_trade_at
          FROM pump_live_trades
          WHERE trader_address = $1
          GROUP BY token_address
        )
        SELECT
          wt.token_address,
          plt.token_name,
          plt.token_symbol,
          plt.status,
          wt.buy_token_base,
          wt.sell_token_base,
          wt.buy_rio_urio,
          wt.sell_rio_urio,
          wt.fees_urio,
          wt.trade_count,
          wt.last_trade_at,
          pcs.real_rio_reserve_urio,
          pcs.real_token_reserve_base,
          pcs.virtual_rio_reserve_urio,
          pcs.virtual_token_reserve_base,
          pcs.target_market_cap_rusd
        FROM wallet_trades wt
        LEFT JOIN pump_live_tokens plt
          ON plt.token_address = wt.token_address
        LEFT JOIN pump_live_curve_state pcs
          ON pcs.token_address = wt.token_address
        ORDER BY wt.last_trade_at DESC NULLS LAST
      `,
      [address],
    );

    const spo20Balances = await pool.query<Spo20BalanceRow>(
      `
        SELECT
          b.token_address,
          t.symbol,
          t.creator,
          b.balance,
          b.updated_height,
          b.updated_at
        FROM spo20_balances b
        LEFT JOIN spo20_tokens t
          ON t.contract_address = b.token_address
        WHERE b.address = $1
          AND COALESCE(NULLIF(b.balance, ''), '0')::numeric > 0
        ORDER BY b.updated_at DESC NULLS LAST
        LIMIT 250
      `,
      [address],
    );

    const positions = pumpPositions.rows.map(mapPumpPosition);
    const spo20 = spo20Balances.rows.map(mapSpo20Balance);

    const totals = positions.reduce(
      (acc, position) => {
        acc.netRioSpent += position.netRioSpent;
        acc.tradeCount += position.tradeCount;
        acc.positionCount += 1;
        return acc;
      },
      { positionCount: 0, tradeCount: 0, netRioSpent: 0 },
    );

    return NextResponse.json({
      ok: true,
      source: "riolight_portfolio_indexer_truth",
      address,
      native: {
        rio: nativeRioBalance,
      },
      totals: {
        positionCount: totals.positionCount,
        spo20BalanceCount: spo20.length,
        tradeCount: totals.tradeCount,
        netRioSpent: compact(totals.netRioSpent, 6),
      },
      positions,
      sections: {
        pump: positions,
        prime: [],
        spo20,
        ibc: [],
        bridged: [],
        offchain: [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load RioLight portfolio.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
