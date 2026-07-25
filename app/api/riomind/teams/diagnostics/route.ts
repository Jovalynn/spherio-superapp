import { NextResponse } from "next/server";
import { getNexusTeamsRuntimeDiagnostics } from "@/lib/riomind/teams/runtime/runtime-manager";

export async function GET() {
  try {
    const result = await getNexusTeamsRuntimeDiagnostics();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown Teams diagnostics error" },
      { status: 500 }
    );
  }
}
