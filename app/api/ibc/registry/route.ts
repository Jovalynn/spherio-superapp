import { NextResponse } from "next/server";
import { getSpherioIbcRegistry } from "@/lib/ibc/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ibc: getSpherioIbcRegistry(),
  });
}
