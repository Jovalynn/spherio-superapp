import { NextResponse } from "next/server";
import { listRioMindVoiceProviders } from "@/lib/riomind/voice/voice-provider-registry";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providers: listRioMindVoiceProviders(),
  });
}
