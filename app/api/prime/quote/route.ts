import { enforceAPIMarketIntegrity } from "@/lib/market-integrity/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { quotePrimeFee } from "@/lib/prime/fees";

export async function POST(request: NextRequest) {


  try {
    const body = await request.json();

    const quote = quotePrimeFee({
      templateId: body.templateId,
      rioPriceUsd: Number(body.rioPriceUsd),
      hybridLabel: body.hybridLabel,
    });

    return NextResponse.json({ok:false,available:false,authoritative:false,executionAllowed:false,reason:"CANONICAL_REFERENCE_PRICE_UNAVAILABLE",quote,configurationAvailable:true},{status:503});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
