import { NextResponse } from "next/server";

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    process.env.NEXT_PUBLIC_INDEXER_URL ||
    "http://indexer:4000"
  );
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const text = await response.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = {
      ok: false,
      error: `Non-JSON response (${response.status})`,
      raw: text.slice(0, 240),
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
  };
}

function safeRows(value: any) {
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.swaps)) return value.swaps;
  if (Array.isArray(value?.liquidity)) return value.liquidity;
  return [];
}

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    const resolvedAddress = String(address || "").trim();

    if (!resolvedAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing address" },
        { status: 400 }
      );
    }

    const base = getIndexerBaseUrl();
    const origin = new URL(request.url).origin;

    const [poolRegistryRes, pairRes, liquidityRes, swapsRes] = await Promise.allSettled([
      fetchJson(`${base}/api/riodex/pool-registry/${encodeURIComponent(resolvedAddress)}`),
      fetchJson(`${origin}/api/v1/riodex/pairs/${encodeURIComponent(resolvedAddress)}`),
      fetchJson(`${origin}/api/v1/riodex/pairs/${encodeURIComponent(resolvedAddress)}/liquidity?limit=12`),
      fetchJson(`${origin}/api/v1/riodex/pairs/${encodeURIComponent(resolvedAddress)}/swaps?limit=12`),
    ]);

    const poolRegistry =
      poolRegistryRes.status === "fulfilled" && poolRegistryRes.value.ok
        ? poolRegistryRes.value.json?.pool || null
        : null;

    const pairDetail =
      pairRes.status === "fulfilled" && pairRes.value.ok
        ? pairRes.value.json || null
        : null;

    const liquidityRows =
      liquidityRes.status === "fulfilled" && liquidityRes.value.ok
        ? safeRows(liquidityRes.value.json)
        : [];

    const swapRows =
      swapsRes.status === "fulfilled" && swapsRes.value.ok
        ? safeRows(swapsRes.value.json)
        : [];

    const latestLiquidity =
      liquidityRows.length > 0
        ? liquidityRows[0]
        : pairDetail?.last_liquidity || null;

    const latestSwap =
      swapRows.length > 0
        ? swapRows[0]
        : pairDetail?.last_swap || null;

    const metadata = poolRegistry?.metadata_json || {};
    const registryQuality = String(metadata.registry_quality || "standard");
    const publicDiscoveryHidden = metadata.public_discovery === false;

    const proofSources = {
      pool_registry: Boolean(poolRegistry),
      riodex_pair: Boolean(pairDetail?.pair),
      liquidity_snapshots: liquidityRows.length,
      swaps: swapRows.length,
    };

    const classification = poolRegistry
      ? "pool_contract"
      : String(resolvedAddress).startsWith("rio1")
        ? "spherio_address_or_contract"
        : "unknown_identifier";

    const proofStatus =
      poolRegistry && pairDetail?.pair && liquidityRows.length > 0
        ? "resolved"
        : poolRegistry || pairDetail?.pair
          ? "partial"
          : "pending";

    return NextResponse.json(
      {
        ok: true,
        address: resolvedAddress,
        classification,
        proof_status: proofStatus,
        public_discovery: !publicDiscoveryHidden,
        registry_quality: registryQuality,
        source: {
          type: "rioexplorer_address_proof",
          upstream: "spherio_indexer",
          guarantees: [
            "proof_is_registry_backed_when_available",
            "liquidity_uses_indexed_snapshots",
            "swaps_are_empty_until_indexed",
            "legacy_records_remain_classified_not_deleted"
          ],
        },
        proof_sources: proofSources,
        pool_registry: poolRegistry,
        pair: pairDetail?.pair || null,
        latest_liquidity: latestLiquidity,
        latest_swap: latestSwap,
        liquidity: liquidityRows,
        swaps: swapRows,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to build RioExplorer address proof",
      },
      { status: 500 }
    );
  }
}
