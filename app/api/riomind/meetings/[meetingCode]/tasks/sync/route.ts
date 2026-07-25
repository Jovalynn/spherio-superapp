import { NextRequest, NextResponse } from "next/server";
import { syncMeetingActionItemsToWorkflowTasks } from "@/lib/riomind/meetings/meeting-task-sync";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await context.params;
    const body = await req.json().catch(() => ({}));

    const result = await syncMeetingActionItemsToWorkflowTasks({
      meetingCode,
      aiLayer: body.aiLayer || body.ai_layer || "nexus_ai",
      surface: body.surface || "nexus_teams",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown meeting task sync error" },
      { status: 500 }
    );
  }
}
