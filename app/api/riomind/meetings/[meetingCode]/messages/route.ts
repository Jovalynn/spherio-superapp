import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

async function getMeeting(pool: any, meetingCode: string) {
  const result = await pool.query(
    `SELECT * FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
    [meetingCode]
  );
  return result.rows[0] || null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT * FROM riomind_team_meeting_messages
       WHERE meeting_id = $1
       ORDER BY created_at ASC
       LIMIT 300`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, messages: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load meeting messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO riomind_team_meeting_messages (
        meeting_id, sender_name, sender_email, message,
        source_language, translated_language, translated_message,
        message_type, metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        meeting.id,
        body.senderName || "Guest",
        body.senderEmail || null,
        message,
        body.sourceLanguage || "en",
        body.translatedLanguage || null,
        body.translatedMessage || null,
        body.messageType || "chat",
        body.metadata || {},
      ]
    );

    return NextResponse.json({ ok: true, message: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to send meeting message" }, { status: 500 });
  }
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();
    const meeting = await getMeeting(pool, meetingCode);

    if (!meeting) {
      return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    }

    const messageId = String(body.messageId || "").trim();

    if (!messageId) {
      return NextResponse.json({ ok: false, error: "Message ID is required" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT * FROM riomind_team_meeting_messages WHERE meeting_id = $1 AND id = $2 LIMIT 1`,
      [meeting.id, messageId]
    );

    if (!existing.rowCount) {
      return NextResponse.json({ ok: false, error: "Message not found" }, { status: 404 });
    }

    const current = existing.rows[0];
    const currentMetadata = current.metadata || {};
    const patchMetadata = body.metadata || {};

    const metadata = {
      ...currentMetadata,
      ...patchMetadata,
    };

    const result = await pool.query(
      `UPDATE riomind_team_meeting_messages
       SET
        translated_language = COALESCE($3, translated_language),
        translated_message = COALESCE($4, translated_message),
        metadata = $5
       WHERE meeting_id = $1 AND id = $2
       RETURNING *`,
      [
        meeting.id,
        messageId,
        body.translatedLanguage || null,
        body.translatedMessage || null,
        metadata,
      ]
    );

    return NextResponse.json({ ok: true, message: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update meeting message" }, { status: 500 });
  }
}
