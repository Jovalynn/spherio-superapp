import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "science_virtual_lab_experiments",
    items: [],
    message: "Science & Virtual Lab experiments endpoint scaffold is ready.",
  });
}
