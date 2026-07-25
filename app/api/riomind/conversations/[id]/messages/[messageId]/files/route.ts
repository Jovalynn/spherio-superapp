import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params:
    | Promise<{ id: string; messageId: string }>
    | { id: string; messageId: string };
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id, messageId } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const fileIds = Array.isArray(body?.fileIds)
      ? body.fileIds.map((item: unknown) => String(item)).filter(Boolean)
      : [];

    if (!fileIds.length) {
      return NextResponse.json({
        ok: true,
        product: "RioMind Nexus",
        attached: 0,
      });
    }

    const messageResult = await db.query(
      `
        SELECT m.id
        FROM riomind_conversations c
        JOIN riomind_messages m ON m.conversation_id = c.id
        WHERE c.id = $1
          AND c.owner_key = $2
          AND m.id = $3
        LIMIT 1
      `,
      [id, ownerKey, messageId]
    );

    if (!messageResult.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "message_not_found" },
        { status: 404 }
      );
    }

    const result = await db.query(
      `
        UPDATE riomind_files
        SET conversation_id = $1,
            message_id = $2,
            metadata = metadata || jsonb_build_object('attached_to_message_at', now())
        WHERE owner_key = $3
          AND id = ANY($4::uuid[])
        RETURNING id
      `,
      [id, messageId, ownerKey, fileIds]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      attached: result.rowCount ?? 0,
      fileIds: result.rows.map((row) => row.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "message_file_attach_failed",
      },
      { status: 500 }
    );
  }
}
