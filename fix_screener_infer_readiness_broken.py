#!/usr/bin/env python3
from pathlib import Path
import sys

TARGET = Path("app/riodex/markets/page.tsx")
BACKUP = Path("app/riodex/markets/page.tsx.bak-fix-broken-infer-readiness")

if not TARGET.exists():
    print(f"ERROR: {TARGET} not found. Run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

text = TARGET.read_text()

if not BACKUP.exists():
    BACKUP.write_text(text)
    print(f"Backup created: {BACKUP}")
else:
    print(f"Backup already exists: {BACKUP}")

start = text.find("function inferReadiness")
end = text.find("\nfunction originBadgeClass", start)

if start == -1 or end == -1:
    print("ERROR: Could not locate inferReadiness/originBadgeClass boundaries.")
    sys.exit(1)

new_infer = '''function inferReadiness(row: ScreenerAuthorityRow, price: number | null, volume: number | null, txns: number | null): {
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
    Source-of-truth product rule:
    Pair live + indexed reserves = Route Ready.
    Snapshots/candles/24h analytics are not required for swap routing.
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
}

'''

text = text[:start] + new_infer + text[end + 1:]

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

old_class = '''function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}'''

new_class = '''function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Route Ready") return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}'''

text = text.replace(old_class, new_class)

text = text.replace(
'''                    ["all", "All readiness"],
                    ["trade_ready", "Trade ready"],''',
'''                    ["all", "All readiness"],
                    ["route_ready", "Route ready"],
                    ["trade_ready", "Trade ready"],'''
)

TARGET.write_text(text)
print("OK: inferReadiness function repaired.")
