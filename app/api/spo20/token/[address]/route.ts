import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ address: string }> | { address: string };
};

function candidateBases() {
  return [
    process.env.INDEXER_INTERNAL_URL,
    process.env.NEXT_PUBLIC_INDEXER_URL,
    "http://indexer:4000",
    "http://spherio_indexer:4000",
    "http://127.0.0.1:4000",
  ].filter(Boolean) as string[];
}

function candidatePaths(address: string) {
  const encoded = encodeURIComponent(address);

  return [
    `/api/spo20/token/${encoded}`,
    `/spo20/token/${encoded}`,
    `/api/spo20/tokens/${encoded}`,
    `/spo20/tokens/${encoded}`,
    `/api/pump/token/${encoded}`,
    `/pump/token/${encoded}`,
    `/api/pump/tokens/${encoded}`,
    `/pump/tokens/${encoded}`,
  ];
}

async function fetchJson(target: string) {
  const res = await fetch(target, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    return { ok: false, status: res.status, text, json: null as any };
  }

  if (!contentType.includes("application/json")) {
    return { ok: false, status: res.status, text, json: null as any };
  }

  try {
    return { ok: true, status: res.status, text, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, text, json: null as any };
  }
}

function findTokenInCollection(payload: any, address: string) {
  const rows =
    Array.isArray(payload?.tokens)
      ? payload.tokens
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

  const normalizedAddress = address.toLowerCase();

  return rows.find((row: any) => {
    const rowAddress = String(
      row?.token_address ||
        row?.tokenAddress ||
        row?.contract_address ||
        row?.contractAddress ||
        "",
    ).toLowerCase();

    return rowAddress === normalizedAddress;
  }) || null;
}

async function fetchCollectionToken(base: string, address: string) {
  for (const path of ["/api/spo20/tokens", "/spo20/tokens"]) {
    const target = `${base}${path}`;

    const result = await fetchJson(target);

    if (!result.ok || !result.json) continue;

    const token = findTokenInCollection(result.json, address);

    if (token) {
      return {
        target,
        payload: {
          ...token,
          source: "spo20_tokens_collection",
        },
      };
    }
  }

  return null;
}

function normalizeTokenPayload(payload: any, address: string) {
  const source =
    payload?.token ||
    payload?.item ||
    payload?.data ||
    payload?.row ||
    payload;

  const tokenAddress =
    source?.token_address ||
    source?.tokenAddress ||
    source?.contract_address ||
    source?.contractAddress ||
    address;

  const symbol =
    source?.symbol ||
    source?.token_symbol ||
    source?.tokenSymbol ||
    source?.onchain?.symbol ||
    null;

  const name =
    source?.token_name ||
    source?.tokenName ||
    source?.name ||
    source?.onchain?.name ||
    symbol ||
    "SPO-20 Token";

  return {
    token_address: tokenAddress,
    symbol,
    creator:
      source?.creator ||
      source?.creator_address ||
      source?.creatorAddress ||
      null,
    factory_address:
      source?.factory_address ||
      source?.factoryAddress ||
      source?.factory ||
      null,
    tx_hash:
      source?.tx_hash ||
      source?.txHash ||
      source?.tx ||
      null,
    height:
      source?.height ||
      source?.created_height ||
      source?.createdHeight ||
      0,
    created_at:
      source?.created_at ||
      source?.createdAt ||
      source?.created ||
      new Date(0).toISOString(),
    contract_address: tokenAddress,
    factory:
      source?.factory ||
      source?.factory_address ||
      source?.factoryAddress ||
      null,
    tx:
      source?.tx ||
      source?.tx_hash ||
      source?.txHash ||
      null,
    created_height:
      source?.created_height ||
      source?.createdHeight ||
      source?.height ||
      0,
    created:
      source?.created ||
      source?.created_at ||
      source?.createdAt ||
      null,
    onchain: {
      name,
      symbol,
      decimals: Number(source?.decimals ?? source?.onchain?.decimals ?? 6),
      total_supply: String(
        source?.total_supply ||
          source?.totalSupply ||
          source?.onchain?.total_supply ||
          source?.onchain?.totalSupply ||
          "0",
      ),
    },
    source: source?.source || payload?.source || "indexer_proxy",
    description: source?.description || null,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const resolvedParams = await context.params;
  const address = String(resolvedParams.address || "").trim();

  if (!address) {
    return NextResponse.json(
      { error: "Token address is required." },
      { status: 400 },
    );
  }

  let lastError = "unknown_error";

  for (const base of candidateBases()) {
    for (const path of candidatePaths(address)) {
      const target = `${base}${path}`;

      try {
        const result = await fetchJson(target);

        if (!result.ok || !result.json) {
          lastError = `upstream_${result.status}_${target}`;
          continue;
        }

        return NextResponse.json(normalizeTokenPayload(result.json, address), {
          headers: {
            "x-spherio-upstream": target,
          },
        });
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    try {
      const collectionMatch = await fetchCollectionToken(base, address);

      if (collectionMatch) {
        return NextResponse.json(
          normalizeTokenPayload(collectionMatch.payload, address),
          {
            headers: {
              "x-spherio-upstream": collectionMatch.target,
            },
          },
        );
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return NextResponse.json(
    {
      error: "Token metadata is not indexed yet.",
      token_address: address,
      details: lastError,
    },
    { status: 404 },
  );
}
