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
      `SELECT * FROM riomind_team_speaker_voice_profiles
       WHERE meeting_id = $1
       ORDER BY created_at DESC`,
      [meeting.id]
    );

    return NextResponse.json({ ok: true, profiles: result.rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load voice profiles" }, { status: 500 });
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

    const speakerName = String(body.speakerName || "").trim();

    if (!speakerName) {
      return NextResponse.json({ ok: false, error: "Speaker name is required" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT * FROM riomind_team_speaker_voice_profiles
       WHERE meeting_id = $1
         AND lower(coalesce(speaker_email, '')) = lower($2)
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`,
      [meeting.id, body.speakerEmail || ""]
    );

    let result;

    if (existing.rows[0]) {
      result = await pool.query(
        `UPDATE riomind_team_speaker_voice_profiles
         SET speaker_name = $1,
             consent_status = $2,
             preferred_voice_style = $3,
             profile_status = COALESCE(NULLIF($4, ''), profile_status),
             metadata = COALESCE($5::jsonb, metadata),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          speakerName,
          body.consentStatus || "pending",
          body.preferredVoiceStyle || "alloy",
          body.profileStatus || "",
          JSON.stringify(body.metadata || {}),
          existing.rows[0].id,
        ]
      );
    } else {
      result = await pool.query(
        `INSERT INTO riomind_team_speaker_voice_profiles (
          meeting_id,
          speaker_name,
          speaker_email,
          consent_status,
          preferred_voice_style,
          sample_audio_url,
          profile_status,
          metadata
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
          meeting.id,
          speakerName,
          body.speakerEmail || null,
          body.consentStatus || "pending",
          body.preferredVoiceStyle || "alloy",
          body.sampleAudioUrl || null,
          body.profileStatus || "foundation",
          body.metadata || {},
        ]
      );
    }

    return NextResponse.json({ ok: true, profile: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to create voice profile" }, { status: 500 });
  }
}
