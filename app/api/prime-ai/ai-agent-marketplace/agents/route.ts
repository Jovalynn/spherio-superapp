import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "prime_ai_agent_marketplace_agents",
    items: [],
    message: "AI Agent Marketplace agent catalog endpoint scaffold is ready.",
  });
}
