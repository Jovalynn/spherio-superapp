import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params:
    | Promise<{ id: string; messageId: string }>
    | { id: string; messageId: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, messageId } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const content = String(body?.content || "").trim();
    const truncateAfter = body?.truncateAfter !== false;

    if (!content) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "message_content_required" },
        { status: 400 }
      );
    }

    const conversationResult = await db.query(
      `
        SELECT id
        FROM riomind_conversations
        WHERE id = $1 AND owner_key = $2
        LIMIT 1
      `,
      [id, ownerKey]
    );

    if (!conversationResult.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "conversation_not_found" },
        { status: 404 }
      );
    }

    const messageResult = await db.query(
      `
        SELECT id, role, created_at
        FROM riomind_messages
        WHERE id = $1 AND conversation_id = $2
        LIMIT 1
      `,
      [messageId, id]
    );

    if (!messageResult.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "message_not_found" },
        { status: 404 }
      );
    }

    const original = messageResult.rows[0];

    if (original.role !== "user") {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "only_user_messages_can_be_edited" },
        { status: 400 }
      );
    }

    await db.query(
      `
        UPDATE riomind_messages
        SET content = $1,
            metadata = metadata || jsonb_build_object('edited', true, 'edited_at', now())
        WHERE id = $2 AND conversation_id = $3
      `,
      [content.slice(0, 24000), messageId, id]
    );

    let deletedAfter = 0;

    if (truncateAfter) {
      const deleted = await db.query(
        `
          DELETE FROM riomind_messages
          WHERE conversation_id = $1
            AND created_at > $2
        `,
        [id, original.created_at]
      );

      deletedAfter = deleted.rowCount ?? 0;
    }

    await db.query(
      `
        UPDATE riomind_conversations
        SET updated_at = now()
        WHERE id = $1
      `,
      [id]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      message: {
        id: messageId,
        role: "user",
        content,
      },
      deletedAfter,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "message_edit_failed",
      },
      { status: 500 }
    );
  }
}
