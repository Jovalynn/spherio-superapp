#!/usr/bin/env python3
from pathlib import Path
import sys

TARGET = Path("app/riodex/markets/page.tsx")
BACKUP = Path("app/riodex/markets/page.tsx.bak-before-route-ready-safe")

if not TARGET.exists():
    print(f"ERROR: {TARGET} not found. Run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

text = TARGET.read_text()

if not BACKUP.exists():
    BACKUP.write_text(text)
    print(f"Backup created: {BACKUP}")
else:
    print(f"Backup already exists: {BACKUP}")

def replace_function(source: str, fn_name: str, replacement: str) -> str:
    marker = f"function {fn_name}"
    start = source.find(marker)
    if start == -1:
        raise RuntimeError(f"Could not find {marker}")

    brace = source.find("{", start)
    if brace == -1:
        raise RuntimeError(f"Could not find opening brace for {marker}")

    depth = 0
    i = brace
    in_string = None
    escape = False
    in_line_comment = False
    in_block_comment = False

    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""

        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_string:
                in_string = None
            i += 1
            continue

        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue

        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue

        if ch in ("'", '"', "`"):
            in_string = ch
            i += 1
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                return source[:start] + replacement + source[end:]

        i += 1

    raise RuntimeError(f"Could not find closing brace for {marker}")

# Types.
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
}'''

text = replace_function(text, "inferReadiness", new_infer)

new_class = '''function readinessClass(readiness: MarketReadiness) {
  if (readiness === "Trade Ready") return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
  if (readiness === "Route Ready") return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
  if (readiness === "Awaiting Quote") return "border-amber-400/25 bg-amber-500/12 text-amber-100";
  if (readiness === "Awaiting Snapshots") return "border-yellow-400/25 bg-yellow-500/12 text-yellow-100";
  if (readiness === "No Liquidity") return "border-rose-400/25 bg-rose-500/12 text-rose-100";
  return "border-cyan-400/25 bg-cyan-500/12 text-cyan-100";
}'''

if "function readinessClass" in text:
    text = replace_function(text, "readinessClass", new_class)

# Filter logic and counters.
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

# Quick swap explanatory copy.
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

# Selected advanced trade link.
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

# Row trade links.
text = text.replace(
'''href={row.routes.swap}''',
'''href={`/riodex/swap?pair=${encodeURIComponent(row.pairAddress)}`}'''
)

TARGET.write_text(text)

print("OK: Screener Route Ready patch applied.")
print("Verify:")
print('  grep -n "Route Ready\\|route_ready\\|Seeded reserves indexed" app/riodex/markets/page.tsx | head -40')
print("Then rebuild:")
print("  cd ~/spherio-infra && docker-compose up -d --build superapp")
