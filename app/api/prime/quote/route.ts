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

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
