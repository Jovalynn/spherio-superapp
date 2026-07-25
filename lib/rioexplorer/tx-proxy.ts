import { NextResponse } from "next/server";

const INTERNAL_INDEXER_URL =
  process.env.INDEXER_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_INDEXER_URL ||
  process.env.INDEXER_URL ||
  "http://indexer:4000";

function normalizeTxHash(value: string) {
  return String(value || "").trim().toUpperCase();
}

export async function proxyRioExplorerTx(hash: string) {
  const txHash = normalizeTxHash(hash);

  if (!txHash) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_tx_hash",
      },
      { status: 400 }
    );
  }

  try {
    const url = `${INTERNAL_INDEXER_URL.replace(/\/$/, "")}/api/explorer/tx/${txHash}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : { ok: false, error: await response.text() };

    return NextResponse.json(
      {
        ...body,
        proxiedBy: "spherio_superapp_rioexplorer_tx_proxy",
        upstream: {
          url,
          status: response.status,
        },
      },
      { status: response.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "failed_to_proxy_rioexplorer_tx",
        txHash,
        upstream: {
          baseUrl: INTERNAL_INDEXER_URL,
        },
      },
      { status: 502 }
    );
  }
}
