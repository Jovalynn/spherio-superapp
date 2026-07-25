import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "DEEPGRAM_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const tokenRes = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ttl_seconds: 300,
      }),
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));

    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            tokenJson?.error ||
            tokenJson?.err_msg ||
            "Could not create Deepgram realtime token.",
          details: tokenJson,
        },
        { status: tokenRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: "deepgram",
      accessToken: tokenJson.access_token,
      expiresIn: tokenJson.expires_in || 300,
      websocketUrl:
        "wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&interim_results=true&endpointing=600&vad_events=true",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create Deepgram realtime session.",
      },
      { status: 500 }
    );
  }
}
