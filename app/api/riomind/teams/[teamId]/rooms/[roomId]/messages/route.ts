import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `SELECT * FROM riomind_team_room_messages
       WHERE team_id = $1 AND room_id = $2
       ORDER BY created_at ASC
       LIMIT 200`,
      [teamId, roomId]
    );

    return NextResponse.json({ ok: true, messages: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_room_messages (
        team_id, room_id, sender_user_id, sender_name, message,
        source_language, translated_language, translated_message, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        teamId,
        roomId,
        body.senderUserId || "local-user",
        body.senderName || "Local User",
        message,
        body.sourceLanguage || "en",
        body.translatedLanguage || null,
        body.translatedMessage || null,
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, message: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to save message" }, { status: 500 });
  }
}
