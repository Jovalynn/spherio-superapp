import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "science_virtual_lab_simulations",
    items: [],
    message: "Science & Virtual Lab simulations endpoint scaffold is ready.",
  });
}
