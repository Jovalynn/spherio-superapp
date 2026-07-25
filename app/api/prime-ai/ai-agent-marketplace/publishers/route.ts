import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "prime_ai_agent_marketplace_publishers",
    items: [],
    message: "AI Agent Marketplace publishers endpoint scaffold is ready.",
  });
}
