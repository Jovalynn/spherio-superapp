import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "science_virtual_lab_reports",
    items: [],
    message: "Science & Virtual Lab reports endpoint scaffold is ready.",
  });
}
