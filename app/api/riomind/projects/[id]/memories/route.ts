import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey } from "@/lib/riomind/db";
import {
  createRioMindProjectMemory,
  listRioMindProjectMemories,
} from "@/lib/riomind/project-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectMemoriesRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: ProjectMemoriesRouteContext) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const url = new URL(request.url);

    const memories = await listRioMindProjectMemories({
      ownerKey,
      projectId: id,
      memoryType: url.searchParams.get("type"),
      search: url.searchParams.get("search"),
      limit: Number(url.searchParams.get("limit") || 50),
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      memories,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "project_memories_list_failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: ProjectMemoriesRouteContext) {
  try {
    const ownerKey = getRioMindOwnerKey(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const memory = await createRioMindProjectMemory({
      ownerKey,
      projectId: id,
      memoryType: body.memoryType,
      title: body.title,
      content: body.content,
      importance: body.importance,
      source: body.source,
      metadata: body.metadata,
    });

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      memory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "project_memory_create_failed",
      },
      { status: 400 }
    );
  }
}
