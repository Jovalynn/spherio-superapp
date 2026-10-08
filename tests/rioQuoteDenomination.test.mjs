import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScript(relativePath) {
  const filename = path.join(root, relativePath);
  const source = readFileSync(filename, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("exports", "require", "module", javascript)(
    loaded.exports,
    require,
    loaded,
  );
  return loaded.exports;
}

const valuation = {
  ok: true,
  price: { rio: { rusd: 2, usd: null, usdt: null } },
};
const context = {
  rioRusd: 2,
  rioUsd: null,
  rioUsdt: null,
  rioBtc: null,
  source: "test_pool_quote",
  authority: "observed_chain_pool",
  updatedAt: "2026-10-08T00:00:00.000Z",
};

const { valueRioAmount } = loadTypeScript("lib/rioEconomics.ts");
const { enrichEconomicObject } = loadTypeScript("lib/rioEconomicEnrichment.ts");
const { valuePortfolioWithRioPrice } = loadTypeScript("lib/rioValuation.ts");
const { buildResponseFromTiers, normalizeUpstreamReference } = loadTypeScript(
  "app/api/rio/reference-price/route.ts",
);

assert.deepEqual(valueRioAmount(3, valuation), {
  rio: 3,
  rusd: 6,
  usd: null,
  usdt: null,
  btc: null,
  source: "rioex_valuation_rio",
  status: "priced",
});

const enriched = enrichEconomicObject({ priceRio: 3 }, context);
assert.equal(enriched.priceRusd, 6);
assert.equal(enriched.priceUsd, null);
assert.equal(enriched.priceUsdt, null);

const portfolio = valuePortfolioWithRioPrice({
  address: "rio1exampleaddress0000000000000000",
  rawPortfolio: {
    assets: [
      { asset_id: "urio", symbol: "RIO", amount: 3 },
      { asset_id: "rusd", symbol: "RUSD", amount: 5 },
    ],
  },
  valuation,
});
assert.equal(portfolio.assets[0].value_rusd, 6);
assert.equal(portfolio.assets[1].value_rusd, 5);
assert.equal(portfolio.assets[1].value_usd, null);
assert.equal(portfolio.assets[1].value_usdt, null);
assert.equal(portfolio.totals.rusd, 11);
assert.equal(portfolio.totals.usd, null);
assert.equal(portfolio.totals.usdt, null);

const tiers = ["RUSD", "USDC", "USDT"].map((symbol, index) => ({
  symbol,
  priority: ["primary", "secondary", "tertiary"][index],
  pairAddress: `pair-${symbol}`,
  displaySymbol: `RIO / ${symbol}`,
  spot: 2 + index / 10,
  twap: { "5m": 2 + index / 10, "1h": null, "6h": null, "24h": null },
  rioReserve: 100,
  quoteReserve: 200 + index * 10,
  liquidityUsdEstimate: 400 + index * 20,
  status: "twap_pending",
  source: "test_pool",
  updatedAt: "2026-10-08T00:00:00.000Z",
}));
const reference = buildResponseFromTiers(tiers, "test");
assert.equal(reference.spot, null);
assert.deepEqual(reference.twap, { "5m": null, "1h": null, "6h": null, "24h": null });
assert.equal(reference.weighting, "none");
assert.equal(reference.liquidity.liquidityUsdEstimate, null);
assert.deepEqual(reference.tiers.map((tier) => tier.liquidityUsdEstimate), [null, null, null]);
assert.equal(reference.primary.spot, 2);
assert.equal(reference.secondary.spot, 2.1);

const upstream = normalizeUpstreamReference({
  ok: true,
  quote: "USD",
  spot: 123,
  twap: { "5m": 122 },
  primary: { symbol: "RUSD", spot: 2, liquidityUsdEstimate: 999 },
  secondary: { symbol: "USDC", spot: 2.1, liquidityUsdEstimate: 999 },
});
assert.equal(upstream.spot, null);
assert.equal(upstream.twap["5m"], null);
assert.equal(upstream.primary.liquidityUsdEstimate, null);

const rioRoute = readFileSync(
  path.join(root, "app/api/rioex/valuation/rio/route.ts"),
  "utf8",
);
assert.equal(
  (rioRoute.match(/rusd: rioInRusd,\s*usd: null,\s*usdt: null,/g) ?? []).length,
  3,
);

console.log("PASS — RUSD quote values are not promoted to USD or USDT");
console.log("PASS — portfolio totals are unavailable when the quote conversion is unverified");
console.log("PASS — mixed quote tiers are not aggregated or labeled as USD");
console.log("PASS — upstream spot, TWAP, and liquidity estimates are not trusted as conversions");
