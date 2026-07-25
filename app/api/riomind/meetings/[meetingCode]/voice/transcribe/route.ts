import { NextRequest, NextResponse } from "next/server";
import { transcribeAudioWithRouter } from "@/lib/riomind/providers/audio-transcribe-router";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const sourceLanguage = String(formData.get("sourceLanguage") || "en").trim();

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Audio file is required." },
        { status: 400 }
      );
    }

    const result = await transcribeAudioWithRouter(audio, sourceLanguage);

    if (!result.ok || !result.text) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Transcription returned empty text.",
          provider: result.provider || null,
          attempts: result.attempts || [],
          recoverable: result.recoverable ?? true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      transcriptText: result.text,
      provider: result.provider || "unknown",
      attempts: result.attempts || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to transcribe recorded audio.",
      },
      { status: 500 }
    );
  }
}
