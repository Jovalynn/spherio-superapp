#!/usr/bin/env python3
from pathlib import Path
import sys

TARGET = Path("app/riodex/swap/page.tsx")

if not TARGET.exists():
    print("ERROR: run this from ~/spherio-infra/spherio-superapp")
    sys.exit(1)

text = TARGET.read_text()

backup = Path("app/riodex/swap/page.tsx.bak-swap-polish-warnings-invalid-markets")
if not backup.exists():
    backup.write_text(text)
    print(f"Backup created: {backup}")
else:
    print(f"Backup already exists: {backup}")

def replace_once(old: str, new: str, label: str):
    global text
    if old not in text:
        print(f"WARN: {label} not found; skipping.")
        return
    text = text.replace(old, new, 1)
    print(f"OK: {label}")

# 1) Add graduation constants near asset constants.
if "PUMP_GRADUATION_RUSD_TARGET" not in text:
    replace_once(
'''const RIO_DENOM = "urio";
const TREASURY_FEE_COLLECTOR =''',
'''const RIO_DENOM = "urio";
const PUMP_GRADUATION_RUSD_TARGET = 15_000;
const RIO_REFERENCE_PRICE_RUSD_ESTIMATE = 0.1;
const PUMP_GRADUATION_RIO_TARGET_ESTIMATE =
  PUMP_GRADUATION_RUSD_TARGET / RIO_REFERENCE_PRICE_RUSD_ESTIMATE;
const TREASURY_FEE_COLLECTOR =''',
        "graduation target constants",
    )

# 2) Strengthen healthy market filter.
old_healthy = '''function isHealthyIndexedMarket(market: RegistryMarketLite) {
  if (!market.pairAddress) return false;

  const base = String(market.baseSymbol || "").trim();
  const quote = String(market.quoteSymbol || "").trim();
  const display = String(market.displaySymbol || "").trim().toUpperCase();

  // Hide incomplete / stale / malformed rows from Swap search.
  if (!base || !quote) return false;
  if (base === quote) return false;
  if (display.includes("UNKNOWN")) return false;

  // Swap search should show executable indexed markets only.
  if (!market.isLive) return false;

  return true;
}'''

new_healthy = '''function isHealthyIndexedMarket(market: RegistryMarketLite) {
  if (!market.pairAddress) return false;

  const base = String(market.baseSymbol || "").trim();
  const quote = String(market.quoteSymbol || "").trim();
  const display = String(market.displaySymbol || "").trim().toUpperCase();
  const canonical = String(market.canonicalSymbol || "").trim().toUpperCase();

  // Hide incomplete / stale / malformed rows from Swap search.
  if (!base || !quote) return false;
  if (base === quote) return false;
  if (display.includes("UNKNOWN") || canonical.includes("UNKNOWN")) return false;
  if (display === "RIO / RIO" || canonical === "RIO/RIO") return false;

  // Swap search should show executable indexed markets only.
  if (!market.isLive) return false;

  return true;
}'''

if old_healthy in text:
    text = text.replace(old_healthy, new_healthy, 1)
    print("OK: strengthened isHealthyIndexedMarket")
else:
    print("WARN: healthy market function exact block not found; keeping current function.")

# 3) Make selected market label use resolved symbols.
text = text.replace(
'''const marketLabel = registryPairLabel;''',
'''const marketLabel = `${asset0Label} / ${asset1Label}`;'''
)

# 4) Add reserve side helpers + warnings after liquidityTruth block.
old_liq_block = '''  const liquidityTruth = latestLiquidity
    ? `${formatNum(reserve0Display, 2)} ${asset0Label} / ${formatNum(
        reserve1Display,
        2
      )} ${asset1Label}`
    : null;

  const updatedTruthTime =
'''

new_liq_block = '''  const liquidityTruth = latestLiquidity
    ? `${formatNum(reserve0Display, 2)} ${asset0Label} / ${formatNum(
        reserve1Display,
        2
      )} ${asset1Label}`
    : null;

  const fromReserveDisplay =
    fromAssetId === asset0Id
      ? reserve0Display
      : fromAssetId === asset1Id
        ? reserve1Display
        : 0;

  const inputReservePct =
    fromReserveDisplay > 0 && numericAmount > 0
      ? (numericAmount / fromReserveDisplay) * 100
      : 0;

  const isBelowPumpGraduationTarget =
    latestLiquidity &&
    (asset0Label.toUpperCase() === "RIO" || asset1Label.toUpperCase() === "RIO") &&
    ((asset0Label.toUpperCase() === "RIO" ? reserve0Display : reserve1Display) <
      PUMP_GRADUATION_RIO_TARGET_ESTIMATE);

  const priceImpactSeverity =
    inputReservePct >= 100
      ? "critical"
      : inputReservePct >= 25
        ? "severe"
        : inputReservePct >= 5
          ? "warning"
          : "normal";

  const shouldShowThinPoolWarning =
    Boolean(latestLiquidity) &&
    (isBelowPumpGraduationTarget || priceImpactSeverity !== "normal");

  const updatedTruthTime =
'''

if old_liq_block not in text:
    print("WARN: liquidityTruth block not found; warning variables not inserted.")
else:
    text = text.replace(old_liq_block, new_liq_block, 1)
    print("OK: inserted liquidity/price-impact warning variables")

# 5) Add warning block above From field inside swap ticket.
field_marker = '''            <div className="mt-5 space-y-4">
              <div className={`${shell("field")} p-4`}>'''

warning_block = '''            <div className="mt-5 space-y-4">
              {shouldShowThinPoolWarning ? (
                <div className={[
                  "rounded-[20px] border px-4 py-3 text-sm",
                  priceImpactSeverity === "critical"
                    ? "border-rose-300/30 bg-rose-500/12 text-rose-100"
                    : priceImpactSeverity === "severe"
                      ? "border-orange-300/30 bg-orange-500/12 text-orange-100"
                      : "border-amber-300/25 bg-amber-500/10 text-amber-100",
                ].join(" ")}>
                  <div className="font-semibold">
                    {priceImpactSeverity === "critical"
                      ? "Critical price-impact warning"
                      : priceImpactSeverity === "severe"
                        ? "High price-impact warning"
                        : "Thin liquidity notice"}
                  </div>

                  <div className="mt-1 leading-relaxed">
                    {liquidityTruth ? (
                      <>Seeded reserves indexed: <span className="font-semibold">{liquidityTruth}</span>.</>
                    ) : (
                      <>Selected market reserves are still loading.</>
                    )}
                  </div>

                  {inputReservePct > 0 ? (
                    <div className="mt-1">
                      This input is approximately <span className="font-semibold">{formatNum(inputReservePct, 2)}%</span> of the selected input-side reserve.
                    </div>
                  ) : null}

                  {isBelowPumpGraduationTarget ? (
                    <div className="mt-1">
                      Below PUMP graduation target: {formatUsd(PUMP_GRADUATION_RUSD_TARGET)} worth of RIO
                      requires about {formatNum(PUMP_GRADUATION_RIO_TARGET_ESTIMATE, 0)} RIO at the current 0.1 RUSD/RIO reference estimate.
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className={`${shell("field")} p-4`}>'''

if field_marker not in text:
    print("WARN: swap field marker not found; warning UI not inserted.")
else:
    text = text.replace(field_marker, warning_block, 1)
    print("OK: inserted warning block in swap ticket")

# 6) Make market card list use only healthy markets and better labels.
text = text.replace(
'''                {registryMarkets.slice(0, 3).map((item) => (''',
'''                {registryMarkets.filter(isHealthyIndexedMarket).slice(0, 3).map((item) => ('''
)

text = text.replace(
'''                    <div className="text-sm font-semibold text-white">{item.displaySymbol}</div>''',
'''                    <div className="text-sm font-semibold text-white">{marketDisplayLabel(item)}</div>'''
)

# 7) Improve selected-pair search result subtitle.
text = text.replace(
'''                            {item.canonicalSymbol || item.pairAddress}''',
'''                            {item.baseSymbol && item.quoteSymbol ? `${item.baseSymbol}/${item.quoteSymbol}` : item.canonicalSymbol || item.pairAddress}'''
)

TARGET.write_text(text)
print("OK: Swap polish patch complete.")
print("Verify:")
print('  grep -n "PUMP_GRADUATION_RUSD_TARGET\\|shouldShowThinPoolWarning\\|Critical price-impact\\|const marketLabel" app/riodex/swap/page.tsx | head -80')
