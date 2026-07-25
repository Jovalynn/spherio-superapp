#!/usr/bin/env python3
from pathlib import Path
import re
import sys

TARGET = Path("app/riodex/markets/page.tsx")
BACKUP = Path("app/riodex/markets/page.tsx.bak-before-route-ready-labels")

if not TARGET.exists():
    print(f"ERROR: {TARGET} not found. Run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

text = TARGET.read_text()

if not BACKUP.exists():
    BACKUP.write_text(text)
    print(f"Backup created: {BACKUP}")
else:
    print(f"Backup already exists: {BACKUP}")

text = text.replace(
'''type ReadinessFilter =
  | "all"
  | "trade_ready"
  | "awaiting_quote"
  | "reserves_indexed"
  | "awaiting_snapshots"
  | "no_liquidity";''',
'''type ReadinessFilter =
  | "all"
  | "route_ready"
  | "trade_ready"
  | "awaiting_quote"
  | "reserves_indexed"
  | "awaiting_snapshots"
  | "no_liquidity";'''
)

text = text.replace(
'''type MarketReadiness =
  | "Trade Ready"
  | "Awaiting Quote"
  | "Reserves Indexed"
  | "Awaiting Snapshots"
  | "No Liquidity"
  | "Pair Indexed";''',
'''type MarketReadiness =
  | "Route Ready"
  | "Trade Ready"
  | "Awaiting Quote"
  | "Reserves Indexed"
  | "Awaiting Snapshots"
  | "No Liquidity"
  | "Pair Indexed";'''
)

pattern = r'''function inferReadiness\(row: ScreenerAuthorityRow, price: number \| null, volume: number \| null, txns: number \| null\): \{
  readiness: MarketReadiness;
  detail: string;
  canQuickSwap: boolean;
\} \{
.*?
\n\}'''
replacement = '''function inferReadiness(row: ScreenerAuthorityRow, price: number | null, volume: number | null, txns: number | null): {
  readiness: MarketReadiness;
  detail: string;
  canQuickSwap: boolean;
} {
  const liquidityStatus = firstText(row.liquidityStatus, row.liquidity_status).toLowerCase();
  const volumeStatus = firstText(row.volumeStatus, row.volume_status).toLowerCase();
  const txnsStatus = firstText(row.txnsStatus, row.txns_status).toLowerCase();
  const reserveLabel = firstText(row.reserveLabel, row.reserve_label);
  const reserve0 = toNumber(row.reserve0Amount ?? row.reserve_0_amount);
  const reserve1 = toNumber(row.reserve1Amount ?? row.reserve_1_amount);
  const isLive = Boolean(row.isLive ?? row.is_live);

  const hasIndexedReserves =
    reserveLabel.length > 0 ||
    liquidityStatus === "seeded_unpriced" ||
    liquidityStatus.includes("reserve") ||
    (
      reserve0 !== null &&
      reserve1 !== null &&
      reserve0 > 0 &&
      reserve1 > 0
    );

  if (!isLive) {
    return {
      readiness: "Pair Indexed",
      detail: "Pair exists but is not marked live",
      canQuickSwap: false,
    };
  }

  if (liquidityStatus === "no_indexed_liquidity") {
    return {
      readiness: "No Liquidity",
      detail: "No indexed reserves",
      canQuickSwap: false,
    };
  }

  /*
    Product rule:
    Pair live + indexed reserves = route-ready.
    Snapshots/candles/24h analytics are NOT required for swap routing.
  */
  if (hasIndexedReserves) {
    if (price && price > 0 && ((volume && volume > 0) || (txns && txns > 0))) {
      return {
        readiness: "Trade Ready",
        detail: "Quote and market activity indexed",
        canQuickSwap: true,
      };
    }

    if (volumeStatus === "pending_snapshots" || txnsStatus === "pending_snapshots") {
      return {
        readiness: "Route Ready",
        detail: "Seeded reserves indexed; analytics snapshots pending",
        canQuickSwap: true,
      };
    }

    return {
      readiness: "Route Ready",
      detail: "Seeded reserves indexed; quote route available",
      canQuickSwap: true,
    };
  }

  if (price && price > 0) {
    return {
      readiness: "Trade Ready",
      detail: "Quote available",
      canQuickSwap: true,
    };
  }

  return {
    readiness: "Awaiting Quote",
    detail: "Pair indexed; quote unavailable",
    canQuickSwap: false,
  };
}'''

text_new, count = re.subn(pattern, replacement, text, flags=re.S)
if count != 1:
    print(f"ERROR: expected to replace inferReadiness exactly once, replaced {count}.")
    sys.exit(1)
text = text_new

old = '''function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}'''
new = '''function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Route Ready") return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}'''
if old in text:
    text = text.replace(old, new)

text = text.replace(
'''        (readinessFilter === "trade_ready" && row.readiness === "Trade Ready") ||
        (readinessFilter === "awaiting_quote" && row.readiness === "Awaiting Quote") ||
        (readinessFilter === "reserves_indexed" && ["Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)) ||
        (readinessFilter === "awaiting_snapshots" && row.readiness === "Awaiting Snapshots") ||
        (readinessFilter === "no_liquidity" && row.readiness === "No Liquidity");''',
'''        (readinessFilter === "route_ready" && ["Route Ready", "Trade Ready"].includes(row.readiness)) ||
        (readinessFilter === "trade_ready" && row.readiness === "Trade Ready") ||
        (readinessFilter === "awaiting_quote" && row.readiness === "Awaiting Quote") ||
        (readinessFilter === "reserves_indexed" && ["Route Ready", "Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)) ||
        (readinessFilter === "awaiting_snapshots" && row.readiness === "Awaiting Snapshots") ||
        (readinessFilter === "no_liquidity" && row.readiness === "No Liquidity");'''
)

text = text.replace(
'''  const reservesIndexed = rows.filter((row) => ["Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)).length;''',
'''  const reservesIndexed = rows.filter((row) => ["Route Ready", "Reserves Indexed", "Awaiting Snapshots", "Trade Ready"].includes(row.readiness)).length;'''
)

text = text.replace(
'''                    ["all", "All readiness"],
                    ["trade_ready", "Trade ready"],
                    ["reserves_indexed", "Reserves indexed"],
                    ["awaiting_quote", "Awaiting quote"],
                    ["awaiting_snapshots", "Awaiting snapshots"],
                    ["no_liquidity", "No liquidity"],''',
'''                    ["all", "All readiness"],
                    ["route_ready", "Route ready"],
                    ["trade_ready", "Trade ready"],
                    ["reserves_indexed", "Reserves indexed"],
                    ["awaiting_quote", "Awaiting quote"],
                    ["awaiting_snapshots", "Awaiting snapshots"],
                    ["no_liquidity", "No liquidity"],'''
)

text = text.replace(
'''                {selected?.canQuickSwap
                  ? "Quick swap is available from indexed price and route truth. Review quote before signing."
                  : selected
                    ? `${selected.readiness}. ${selected.readinessDetail}. Use Advanced Trade when route quoting is ready.`
                    : "Select a market to request a quote."}''',
'''                {selected?.canQuickSwap
                  ? selected.readiness === "Route Ready"
                    ? "Route ready from indexed reserves. Use Advanced Trade for signing/execution while Screener embedded execution is being wired."
                    : "Quick swap is available from indexed price and route truth. Review quote before signing."
                  : selected
                    ? `${selected.readiness}. ${selected.readinessDetail}.`
                    : "Select a market to request a quote."}'''
)

text = text.replace(
'''<Link href={selected?.routes.swap || RIODEX_SWAP_ROUTE} className="rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-3 text-center text-xs font-black text-emerald-100 hover:bg-emerald-500/18">
                  Open Advanced Trade
                </Link>''',
'''<Link
                  href={
                    selected
                      ? `/riodex/swap?pair=${encodeURIComponent(selected.pairAddress)}&side=${encodeURIComponent(tradeSide)}`
                      : RIODEX_SWAP_ROUTE
                  }
                  className="rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-3 text-center text-xs font-black text-emerald-100 hover:bg-emerald-500/18"
                >
                  Open Advanced Trade
                </Link>'''
)

text = text.replace(
'''href={row.routes.swap}''',
'''href={`/riodex/swap?pair=${encodeURIComponent(row.pairAddress)}`}'''
)

TARGET.write_text(text)
print("Screener route-ready readiness patch applied.")
print("Now run:")
print("  cd ~/spherio-infra")
print("  docker-compose up -d --build superapp")
