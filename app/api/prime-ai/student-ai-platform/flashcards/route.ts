import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "student_ai_platform_flashcards",
    items: [],
    message: "Student AI Platform flashcards endpoint scaffold is ready.",
  });
}
