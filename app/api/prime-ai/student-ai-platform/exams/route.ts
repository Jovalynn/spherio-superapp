import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "student_ai_platform_exams",
    items: [],
    message: "Student AI Platform exams endpoint scaffold is ready.",
  });
}
