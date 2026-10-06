import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));

    const model =
      body.model ||
      process.env.RIOMIND_OPENAI_REALTIME_MODEL ||
      "gpt-4o-realtime-preview";

    const voice =
      body.voice ||
      process.env.RIOMIND_OPENAI_REALTIME_VOICE ||
      "alloy";

    const instructions =
      body.instructions ||
      "You are RioMind Nexus realtime meeting translation assistant. Preserve meaning, names, numbers, proper nouns, technical terms, and speaker intent. Do not summarize or omit meaningful content.";

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model,
            output_modalities: ["audio"],
            audio: {
              output: {
                voice,
              },
            },
            instructions,
          },
        }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message ||
            data?.error ||
            "Failed to create OpenAI realtime client secret.",
          details: data,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "openai_realtime",
      clientSecret:
        data?.value ||
        data?.client_secret?.value ||
        data?.client_secret ||
        null,
      expiresAt:
        data?.expires_at ||
        data?.client_secret?.expires_at ||
        null,
      model,
      voice,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create OpenAI realtime client secret.",
      },
      { status: 500 },
    );
  }
}
