import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getRioMindPgPool();

    await db.query(
      "ALTER TABLE riomind_messages ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
    );
    const ownerKey = getRioMindOwnerKey(request.headers);

    const conversationResult = await db.query(
      `
        SELECT id, title, created_at, updated_at
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

    const messagesResult = await db.query(
      `
        SELECT id, role, content, metadata, created_at
        FROM riomind_messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `,
      [id]
    );

    const conversation = conversationResult.rows[0];

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
        messages: messagesResult.rows.map((row) => ({
          id: row.id,
          role: row.role,
          content: row.content,
          artifact: row.metadata?.artifact ?? null,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "conversation_read_failed",
      },
      { status: 500 }
    );
  }
}


export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const title = String(body?.title || "").replace(/\s+/g, " ").trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "conversation_title_required" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
        UPDATE riomind_conversations
        SET title = $1,
            updated_at = now()
        WHERE id = $2 AND owner_key = $3
        RETURNING id, title, created_at, updated_at
      `,
      [title.slice(0, 120), id, ownerKey]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "conversation_not_found" },
        { status: 404 }
      );
    }

    const conversation = result.rows[0];

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "conversation_rename_failed",
      },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);

    const result = await db.query(
      `
        DELETE FROM riomind_conversations
        WHERE id = $1 AND owner_key = $2
        RETURNING id
      `,
      [id, ownerKey]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "conversation_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      deletedConversationId: id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "conversation_delete_failed",
      },
      { status: 500 }
    );
  }
}
