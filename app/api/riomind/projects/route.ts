import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { createRioMindProject, listRioMindProjects } from "@/lib/riomind/project-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const url = new URL(request.url);

    const projects = await listRioMindProjects({
      ownerKey,
      status: url.searchParams.get("status"),
      search: url.searchParams.get("search"),
      limit: Number(url.searchParams.get("limit") || 50),
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      projects,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "project_list_failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const project = await createRioMindProject({
      ownerKey,
      name: body.name,
      description: body.description,
      status: body.status,
      languagePreferences: body.languagePreferences,
      metadata: body.metadata,
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      project,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "project_create_failed",
      },
      { status: 400 }
    );
  }
}
