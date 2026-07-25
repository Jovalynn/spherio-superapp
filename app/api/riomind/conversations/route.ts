import { NextRequest, NextResponse } from "next/server";

import {
  getRioMindOwnerKey,
  getRioMindPgPool,
  makeConversationTitle,
} from "@/lib/riomind/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);

    const result = await db.query(
      `
        SELECT
          c.id,
          c.title,
          c.created_at,
          c.updated_at,
          COALESCE(COUNT(m.id), 0)::int AS message_count
        FROM riomind_conversations c
        LEFT JOIN riomind_messages m ON m.conversation_id = c.id
        WHERE c.owner_key = $1
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT 40
      `,
      [ownerKey]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      conversations: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        messageCount: row.message_count,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "conversation_list_failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const title = makeConversationTitle(body?.title || body?.message || "New chat");
    const metadata =
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    const result = await db.query(
      `
        INSERT INTO riomind_conversations (owner_key, title, metadata)
        VALUES ($1, $2, $3::jsonb)
        RETURNING id, title, created_at, updated_at
      `,
      [ownerKey, title, JSON.stringify(metadata)]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      conversation: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "conversation_create_failed",
      },
      { status: 500 }
    );
  }
}
