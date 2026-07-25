import { NextResponse } from "next/server";

import { verifyRioMindApiAccess } from "@/lib/riomind/api/access";

export async function POST(request: Request) {
  const access = verifyRioMindApiAccess(request);

  if (!access.ok) {
    return NextResponse.json(
      {
        ok: false,
        source: "riomind_public_api_chat",
        version: "v1",
        status: access.status,
        error: access.error,
      },
      { status: access.status === "api_keys_not_configured" ? 503 : 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message : "";

  if (!message.trim()) {
    return NextResponse.json(
      {
        ok: false,
        source: "riomind_public_api_chat",
        version: "v1",
        status: "missing_message",
        error: "Missing required message field.",
      },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;

  const internalResponse = await fetch(`${origin}/api/riomind/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await internalResponse.json().catch(() => null);

  if (!internalResponse.ok || !data) {
    return NextResponse.json(
      {
        ok: false,
        source: "riomind_public_api_chat",
        version: "v1",
        status: "internal_runtime_error",
        error: "RioMind internal chat runtime failed.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: "riomind_public_api_chat",
    version: "v1",
    status: "completed",
    apiKeyId: access.apiKeyId,
    billing: {
      mode: "metering_pending",
      billable: true,
      units: {
        requests: 1,
      },
    },
    result: data,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "riomind_public_api_chat",
    version: "v1",
    status: "ready_for_post",
    usage: {
      method: "POST",
      headers: {
        "x-riomind-api-key": "<your RioMind API key>",
      },
      body: {
        message: "Build me an Android wallet app",
      },
    },
  });
}
