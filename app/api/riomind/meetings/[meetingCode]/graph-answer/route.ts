import { NextRequest, NextResponse } from "next/server";
import { answerMeetingFromKnowledgeGraph } from "@/lib/riomind/meetings/meeting-graph-answer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await context.params;
    const { searchParams } = new URL(req.url);

    const result = await answerMeetingFromKnowledgeGraph({
      meetingCode,
      question: searchParams.get("question") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown meeting graph answer error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await context.params;
    const body = await req.json();

    const result = await answerMeetingFromKnowledgeGraph({
      meetingCode,
      question: body.question,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown meeting graph answer error" },
      { status: 500 }
    );
  }
}
