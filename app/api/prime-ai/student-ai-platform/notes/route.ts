import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "student_ai_platform_notes",
    items: [],
    message: "Student AI Platform notes endpoint scaffold is ready.",
  });
}
