import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey } from "@/lib/riomind/db";
import { getRioMindProject, updateRioMindProject } from "@/lib/riomind/project-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: ProjectRouteContext) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;

    const project = await getRioMindProject({
      ownerKey,
      projectId: id,
    });

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "project_not_found",
        },
        { status: 404 }
      );
    }

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
        error: error instanceof Error ? error.message : "project_read_failed",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: ProjectRouteContext) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const project = await updateRioMindProject({
      ownerKey,
      projectId: id,
      name: body.name,
      description: body.description,
      status: body.status,
      languagePreferences: body.languagePreferences,
      metadata: body.metadata,
    });

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          product: "RioMind Nexus",
          error: "project_not_found",
        },
        { status: 404 }
      );
    }

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
        error: error instanceof Error ? error.message : "project_update_failed",
      },
      { status: 400 }
    );
  }
}
