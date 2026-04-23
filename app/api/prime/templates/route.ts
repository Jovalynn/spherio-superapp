import { NextResponse } from "next/server";
import { PRIME_TEMPLATES, PRIME_TREASURY_RECIPIENT } from "@/lib/prime/templates";
import { PRIME_APPROVED_HYBRIDS } from "@/lib/prime/hybrids";

export async function GET() {
  return NextResponse.json({
    ok: true,
    templates: PRIME_TEMPLATES,
    hybrids: PRIME_APPROVED_HYBRIDS,
    treasuryRecipient: PRIME_TREASURY_RECIPIENT,
  });
}
