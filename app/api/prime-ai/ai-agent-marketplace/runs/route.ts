import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "prime_ai_agent_marketplace_runs",
    items: [],
    message: "AI Agent Marketplace runs endpoint scaffold is ready.",
  });
}
