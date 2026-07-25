import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "student_ai_platform_reports",
    items: [],
    message: "Student AI Platform reports endpoint scaffold is ready.",
  });
}
