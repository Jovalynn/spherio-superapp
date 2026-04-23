import { NextResponse } from "next/server";

function getIndexerBaseUrl() {
  return (
    process.env.INTERNAL_INDEXER_URL ||
    process.env.INDEXER_URL ||
    "http://indexer:4000"
  );
}

export async function GET() {
  try {
    const response = await fetch(`${getIndexerBaseUrl()}/api/rio/accounts/classified`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "failed_to_fetch_rio_classified_accounts",
          upstream_status: response.status,
          upstream_body: text,
        },
        { status: 502 },
      );
    }

    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "failed_to_fetch_rio_classified_accounts",
      },
      { status: 500 },
    );
  }
}
