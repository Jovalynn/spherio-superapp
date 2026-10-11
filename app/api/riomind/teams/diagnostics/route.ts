import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { requireTeamsOperator, TeamAuthorizationError } from "@/lib/riomind/teams/authorization";
import { NextRequest, NextResponse } from "next/server";
import { getNexusTeamsRuntimeDiagnostics } from "@/lib/riomind/teams/runtime/runtime-manager";

export async function GET(req: NextRequest) {
  try {
    requireTeamsOperator(await getRioMindOwnerKey(req.headers));
    const result = await getNexusTeamsRuntimeDiagnostics();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown Teams diagnostics error" },
      { status: error instanceof TeamAuthorizationError ? 403 : 500 }
    );
  }
}
