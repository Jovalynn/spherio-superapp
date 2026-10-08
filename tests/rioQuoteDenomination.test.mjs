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
