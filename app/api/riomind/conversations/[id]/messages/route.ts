import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

const allowedRoles = new Set(["user", "assistant", "system", "tool"]);

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getRioMindPgPool();

    await db.query(
      "ALTER TABLE riomind_messages ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb"
    );
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const role = String(body?.role || "").trim();
    const content = String(body?.content || "").trim();
    const metadata =
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    if (!allowedRoles.has(role)) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "invalid_message_role" },
        { status: 400 }
      );
    }

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
        INSERT INTO riomind_messages (conversation_id, role, content, metadata)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id, role, content, metadata, created_at
      `,
      [id, role, content, JSON.stringify(metadata)]
    );

    await db.query(
      `
        UPDATE riomind_conversations
        SET updated_at = now()
        WHERE id = $1
      `,
      [id]
    );

    const message = messageResult.rows[0];

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
        artifact: message.metadata?.artifact ?? null,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "message_create_failed",
      },
      { status: 500 }
    );
  }
}
