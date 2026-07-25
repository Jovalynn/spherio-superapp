import { NextRequest, NextResponse } from "next/server";
import { buildLiveMeetingIntelligence } from "@/lib/riomind/meetings/live-meeting-intelligence";
import { normalizeRioMindTranslationTargets, RIOMIND_TRANSLATION_LANGUAGES } from "@/lib/riomind/voice/supported-languages";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await context.params;
    const { searchParams } = new URL(req.url);
    const targets = searchParams.get("targets")
      ? searchParams.get("targets")!.split(",").map((item) => item.trim())
      : [];

    const intelligence = await buildLiveMeetingIntelligence({
      meetingCode,
      targetLanguages: normalizeRioMindTranslationTargets(targets),
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      supportedLanguages: RIOMIND_TRANSLATION_LANGUAGES,
      intelligence,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown live meeting intelligence error" },
      { status: 500 }
    );
  }
}
