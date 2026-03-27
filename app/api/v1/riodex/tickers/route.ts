import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SUPERAPP_URL || "http://127.0.0.1:3000";

async function j<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  const txt = await r.text();
  const json = txt ? JSON.parse(txt) : {};
  if (!r.ok || json.ok === false) throw new Error(json?.error || "fetch failed");
  return json;
}

export async function GET() {
  try {
    const pairsRes = await j<{ pairs: any[] }>(`${BASE}/api/v1/riodex/pairs`);

    const out = await Promise.all(
      (pairsRes.pairs || []).map(async (p) => {
        const pair = p.pair_address;

        const [liqRes, swapRes] = await Promise.all([
          j<{ liquidity: any[] }>(
            `${BASE}/api/v1/riodex/pairs/${pair}/liquidity?limit=2`
          ).catch(() => ({ liquidity: [] })),
          j<{ swaps: any[] }>(
            `${BASE}/api/v1/riodex/pairs/${pair}/swaps?limit=1`
          ).catch(() => ({ swaps: [] })),
        ]);

        const liq = liqRes.liquidity?.[0];
        const swap = swapRes.swaps?.[0];

        const reserve0 = liq ? Number(liq.reserve_0) / 1e6 : 0;
        const reserve1 = liq ? Number(liq.reserve_1) / 1e6 : 0;

        const price =
          swap?.effective_price != null
            ? Number(swap.effective_price)
            : reserve0 && reserve1
              ? reserve0 / reserve1
              : 0;

        return {
          pair_address: pair,
          symbol: p.display_symbol,
          base: p.asset_0_id,
          quote: p.asset_1_id,
          price,
          reserve0,
          reserve1,
          total_share: liq ? Number(liq.total_share) / 1e6 : 0,
          last_trade_time: swap?.block_time || liq?.block_time || null,
          is_canonical: p.is_canonical,
          is_live: p.is_live,
        };
      })    );

    return NextResponse.json({ ok: true, tickers: out });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "tickers_failed" },
      { status: 500 }
    );
  }
}




