import { NextRequest, NextResponse } from "next/server";

import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";

export const runtime = "nodejs";

type RouteContext = {
  params:
    | Promise<{ id: string; messageId: string }>
    | { id: string; messageId: string };
};

const allowedRatings = new Set(["like", "dislike"]);

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id, messageId } = await context.params;
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);
    const body = await request.json().catch(() => ({}));

    const rating = String(body?.rating || "").trim();

    if (!allowedRatings.has(rating)) {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "invalid_feedback_rating" },
        { status: 400 }
      );
    }

    const messageResult = await db.query(
      `
        SELECT m.id, m.role
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

    if (messageResult.rows[0].role !== "assistant") {
      return NextResponse.json(
        { ok: false, product: "RioMind Nexus", error: "only_assistant_messages_can_receive_feedback" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
        INSERT INTO riomind_message_feedback (
          owner_key,
          conversation_id,
          message_id,
          rating,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (owner_key, message_id)
        DO UPDATE SET
          rating = EXCLUDED.rating,
          updated_at = now(),
          metadata = riomind_message_feedback.metadata || EXCLUDED.metadata
        RETURNING id, rating, created_at, updated_at
      `,
      [
        ownerKey,
        id,
        messageId,
        rating,
        JSON.stringify({
          source: "nexus_chat_ui",
        }),
      ]
    );

    return NextResponse.json({
      ok: true,
      product: "RioMind Nexus",
      feedback: {
        id: result.rows[0].id,
        rating: result.rows[0].rating,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        product: "RioMind Nexus",
        error: error instanceof Error ? error.message : "feedback_save_failed",
      },
      { status: 500 }
    );
  }
}
