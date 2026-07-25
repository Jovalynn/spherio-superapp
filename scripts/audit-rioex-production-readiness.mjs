
const BASE_URL = process.env.SPHERIO_AUDIT_BASE_URL || "http://localhost:3000";
const TEST_WALLET = process.env.SPHERIO_AUDIT_WALLET || "rio1e9hszjll3d4pkn74n2th47wwyyh228wn2vhmsf";

let failures = 0;

function ok(label, detail = "") {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}

function bad(label, detail = "") {
  failures += 1;
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
}

function warn(label, detail = "") {
  console.log(`⚠️  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function head(path, label) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method: "HEAD" });
    res.ok ? ok(label, `${res.status} ${path}`) : bad(label, `${res.status} ${path}`);
  } catch (err) {
    bad(label, err?.message || String(err));
  }
}

async function json(path, label) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
    const body = await res.text();
    const parsed = JSON.parse(body);

    if (!res.ok) {
      bad(label, `${res.status} ${parsed?.error || ""}`);
      return parsed;
    }

    ok(label, `${res.status}`);
    return parsed;
  } catch (err) {
    bad(label, err?.message || String(err));
    return null;
  }
}

async function main() {
  console.log("");
  console.log("Spherio RioEx production-readiness audit");
  console.log("Base URL:", BASE_URL);
  console.log("Wallet:", TEST_WALLET);
  console.log("");

  await head("/rioex", "RioEx Market route");
  await head("/rioex/trade", "RioEx Trade route");
  await head("/rioex/assets", "RioEx Assets route");
  await head("/riodex/swap", "RioDex Swap route");
  await head("/riodex/liquidity/action", "RioDex Liquidity route");
  await head("/riolight", "RioLight Portfolio route");

  console.log("");

  const valuation = await json("/api/rioex/valuation/rio", "RIO valuation API");
  const rio = valuation?.price?.rio;

  if (valuation?.ok === true && Number(rio?.rusd) > 0) {
    ok("RIO/RUSD valuation", `1 RIO = ${rio.rusd} RUSD`);
  } else {
    bad("RIO/RUSD valuation", "Missing or zero price");
  }

  if (Number(rio?.usd) === Number(rio?.rusd)) ok("RIO/USD mirror", `${rio?.usd}`);
  else warn("RIO/USD mirror mismatch", `${rio?.usd} vs ${rio?.rusd}`);

  if (Number(rio?.usdt) === Number(rio?.rusd)) ok("RIO/USDT mirror", `${rio?.usdt}`);
  else warn("RIO/USDT mirror mismatch", `${rio?.usdt} vs ${rio?.rusd}`);

  console.log("");

  const screener = await json("/api/riodex/screener", "RioDex screener API");
  const rows = Array.isArray(screener?.rows) ? screener.rows : [];

  rows.length > 0 ? ok("Screener rows", `${rows.length} rows`) : bad("Screener rows", "No rows");

  const enriched = rows.find((row) =>
    Number.isFinite(Number(row.priceRusd)) ||
    Number.isFinite(Number(row.liquidityRusd)) ||
    Number.isFinite(Number(row.fdvRusd))
  );

  if (enriched) {
    ok(
      "CPMM RUSD enrichment",
      `${enriched.displaySymbol || enriched.symbol || "pair"} priceRusd=${enriched.priceRusd} liquidityRusd=${enriched.liquidityRusd} fdvRusd=${enriched.fdvRusd}`,
    );
  } else {
    bad("CPMM RUSD enrichment", "No enriched row found");
  }

  const pairAddress =
    enriched?.pairAddress ||
    enriched?.pair_address ||
    enriched?.address ||
    rows[0]?.pairAddress ||
    rows[0]?.pair_address ||
    rows[0]?.address;

  if (pairAddress) {
    await head(`/rioex/trade?pair=${encodeURIComponent(pairAddress)}`, "Selected-pair Trade route");
  } else {
    warn("Selected-pair Trade route", "No pair address found in screener row");
  }

  console.log("");

  const portfolio = await json(
    `/api/riolight/portfolio/value?address=${encodeURIComponent(TEST_WALLET)}`,
    "RioLight portfolio valuation API",
  );

  if (portfolio?.ok === true && Number.isFinite(Number(portfolio?.totals?.rusd))) {
    ok("Portfolio total RUSD", `${portfolio.totals.rusd}`);
  } else {
    bad("Portfolio total RUSD", "Missing total");
  }

  const assets = Array.isArray(portfolio?.assets) ? portfolio.assets : [];
  const priced = assets.filter((asset) => asset.valuation_status === "priced").length;
  const unpriced = assets.filter((asset) => asset.valuation_status !== "priced").length;

  priced > 0 ? ok("Priced asset bucket", `${priced} priced`) : bad("Priced asset bucket", "No priced assets");
  unpriced > 0 ? ok("Unpriced asset bucket", `${unpriced} unpriced`) : warn("Unpriced asset bucket", "No unpriced assets");

  console.log("");

  if (failures > 0) {
    console.log(`❌ Audit completed with ${failures} failure(s).`);
    process.exit(1);
  }

  console.log("✅ Audit completed successfully. RioEx core surfaces are stable for preview.");
}

main().catch((err) => {
  console.error("❌ Audit crashed:", err);
  process.exit(1);
});
