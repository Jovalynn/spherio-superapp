import { NextResponse } from "next/server";
import { RIOMIND_TRANSLATION_LANGUAGES } from "@/lib/riomind/voice/supported-languages";

export async function GET() {
  return NextResponse.json({
    ok: true,
    count: RIOMIND_TRANSLATION_LANGUAGES.length,
    languages: RIOMIND_TRANSLATION_LANGUAGES,
  });
}
