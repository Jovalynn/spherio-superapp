import { NextResponse } from "next/server";
import { getSpherioEvmRepresentationRegistry } from "@/lib/bridge/evm-representation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    evmRepresentation: getSpherioEvmRepresentationRegistry(),
  });
}
