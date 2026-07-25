#!/usr/bin/env python3
from pathlib import Path
import sys

TARGET = Path("app/createtoken/pump/board/page.tsx")

if not TARGET.exists():
    print(f"ERROR: {TARGET} not found. Run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

s = TARGET.read_text()
backup = TARGET.with_suffix(TARGET.suffix + ".bak-lifecycle-market-truth")
backup.write_text(s)

def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        print(f"WARN: pattern not found for {label}; leaving unchanged.")
        return text
    return text.replace(old, new, 1)

def replace_all(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        print(f"WARN: pattern not found for {label}; leaving unchanged.")
        return text
    return text.replace(old, new)

compact_money_block = """function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}
"""

helper_block = compact_money_block + """
function marketCapLabel(row?: PumpBoardRow | null) {
  if (!row) return "Pending";
  const lifecycle = resolvePumpBoardLifecycle(row);
  if (lifecycle.isGraduated) return "Pending";
  return row.impliedMarketCapRio > 0 ? `${compactMoney(row.impliedMarketCapRio)} RIO` : "Pending";
}

function priceLabel(row?: PumpBoardRow | null) {
  if (!row) return "Pending";
  const lifecycle = resolvePumpBoardLifecycle(row);
  if (lifecycle.isGraduated) return "Awaiting RioDex price";
  return row.effectivePriceRio > 0 ? `${row.effectivePriceRio.toFixed(8)} RIO` : "Curve pending";
}

function volumeLabel(row?: PumpBoardRow | null) {
  if (!row) return "Pending";
  const lifecycle = resolvePumpBoardLifecycle(row);
  if (lifecycle.isGraduated) return "Pending";
  return row.volume24hRio > 0 ? `${compactMoney(row.volume24hRio)} RIO` : "Pending";
}

function lpLabel(row?: PumpBoardRow | null) {
  if (!row) return "Pending";
  const lifecycle = resolvePumpBoardLifecycle(row);
  if (lifecycle.pairAddress) return "Pair indexed";
  if (lifecycle.isGraduated) return "Pair indexing";
  return "Pending";
}
"""

if "function marketCapLabel" not in s:
    s = replace_once(s, compact_money_block, helper_block, "market/price helper insertion")

s = replace_all(
    s,
    "const authorityChart = hasRealDiscoveryRows ? null : surfaceState?.chart;",
    "const authorityChart = surfaceState?.chart ?? null;",
    "authority chart source",
)

leader_start = s.find("  const leaderStats = useMemo(() => {")
leader_end_marker = "  }, [leader, selectedChart, hasRealDiscoveryRows]);"
leader_end = s.find(leader_end_marker, leader_start)

if leader_start == -1 or leader_end == -1:
    print("WARN: leaderStats block not found; leaving unchanged.")
else:
    leader_end += len(leader_end_marker)
    leader_stats_block = """  const leaderStats = useMemo(() => {
    if (!leader) return null;

    if (hasRealDiscoveryRows) {
      return {
        marketCap: marketCapLabel(leader),
        volume24h: volumeLabel(leader),
        price: priceLabel(leader),
        ath: "Pending",
      };
    }

    return {
      marketCap: `${compactMoney(selectedChart?.close ?? leader.impliedMarketCapRio)} RIO`,
      volume24h: `${compactMoney(selectedChart?.volume ?? leader.volume24hRio)} RIO`,
      price: `${leader.effectivePriceRio.toFixed(8)} RIO`,
      ath: `${compactMoney(selectedChart?.high ?? leader.impliedMarketCapRio * 1.19)} RIO`,
    };
  }, [leader, selectedChart, hasRealDiscoveryRows]);"""
    s = s[:leader_start] + leader_stats_block + s[leader_end:]

suffix_fixes = {
    "{leaderStats?.marketCap} RIO": "{leaderStats?.marketCap}",
    "{leaderStats?.ath} RIO": "{leaderStats?.ath}",
    "{leaderStats?.volume24h} RIO": "{leaderStats?.volume24h}",
    "{leaderStats?.price} RIO": "{leaderStats?.price}",
}
for old, new in suffix_fixes.items():
    s = s.replace(old, new)

s = s.replace('{leader.reserveLabel || "Liquidity reserve pending"}', "{lpLabel(leader)}")
s = s.replace(
    '· <span className="text-white/70">AMM price pending</span>',
    '· <span className="text-white/70">{priceLabel(leader)}</span>',
)
s = s.replace(
    '<div className="text-white/84">{compactMoney(row.impliedMarketCapRio)} RIO</div>',
    '<div className="text-white/84">{marketCapLabel(row)}</div>',
)
s = s.replace(
    '<div><span className={stagePill(resolvePumpBoardLifecycle(row).isGraduated ? "graduated" : row.stage)}>{row.stage}</span></div>',
    '<div><span className={stagePill(resolvePumpBoardLifecycle(row).isGraduated ? "graduated" : row.stage)}>{resolvePumpBoardLifecycle(row).isGraduated ? "graduated" : row.stage}</span></div>',
)

lp_title = '<div className="text-[10px] uppercase tracking-[0.16em] text-white/45">LP</div>'
lp_pos = s.rfind(lp_title)
if lp_pos == -1:
    print("WARN: LP stat card not found; leaving unchanged.")
else:
    open_div = s.find('<div className="mt-2 text-lg font-semibold text-white">', lp_pos)
    content_start = s.find("\n", open_div) + 1
    close_div = s.find("\n                    </div>", content_start)
    if open_div == -1 or content_start == 0 or close_div == -1:
        print("WARN: LP stat card content bounds not found; leaving unchanged.")
    else:
        lp_expression = """                      {hasRealDiscoveryRows
                        ? lpLabel(leader)
                        : graduation
                          ? `$${compactMoney(graduation.lpTargetUsd)}`
                          : "Pending"}"""
        s = s[:content_start] + lp_expression + s[close_div:]

chart_anchor = """                            </svg>

                            <div className="absolute right-4 top-3 text-xs text-white/52">"""

chart_overlay = """                            </svg>

                            {!chartPoints.length ? (
                              <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur-sm">
                                  <div className="text-sm font-semibold text-white">Awaiting RioDex candle</div>
                                  <div className="mt-1 text-xs text-white/55">
                                    Price will populate from indexed pair reserves or the first RioDex trade.
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <div className="absolute right-4 top-3 text-xs text-white/52">"""

if "Awaiting RioDex candle" not in s:
    s = replace_once(s, chart_anchor, chart_overlay, "chart empty state overlay")

s = s.replace("indexerLabe", "indexerLabel")

TARGET.write_text(s)

print(f"Patched {TARGET}")
print(f"Backup written to {backup}")
print("")
print("Now run:")
print("cd ~/spherio-infra")
print("docker-compose up -d --build superapp")
