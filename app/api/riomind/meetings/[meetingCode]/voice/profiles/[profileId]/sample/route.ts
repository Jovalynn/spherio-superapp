import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string; profileId: string }> }
) {
  try {
    const { meetingCode, profileId } = await params;
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Audio file is required." },
        { status: 400 }
      );
    }

    const pool = await getReadyRioMindTeamsPool();

    const meetingResult = await pool.query(
      `SELECT id FROM riomind_team_meetings WHERE meeting_code = $1 LIMIT 1`,
      [meetingCode]
    );

    const meeting = meetingResult.rows[0];

    if (!meeting) {
      return NextResponse.json(
        { ok: false, error: "Meeting not found." },
        { status: 404 }
      );
    }

    const profileResult = await pool.query(
      `SELECT * FROM riomind_team_speaker_voice_profiles
       WHERE id = $1 AND meeting_id = $2
       LIMIT 1`,
      [profileId, meeting.id]
    );

    const profile = profileResult.rows[0];

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Speaker voice profile not found." },
        { status: 404 }
      );
    }

    const bytes = Buffer.from(await audio.arrayBuffer());
    const ext = (audio.name?.split(".").pop() || "webm").toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "webm";

    const dir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "riomind",
      "voice-samples",
      meetingCode
    );

    await mkdir(dir, { recursive: true });

    const filename = `${profileId}-${crypto.randomUUID()}.${safeExt}`;
    const absolutePath = path.join(dir, filename);
    await writeFile(absolutePath, bytes);

    const publicUrl = `/uploads/riomind/voice-samples/${meetingCode}/${filename}`;

    const metadata = {
      ...(profile.metadata || {}),
      sampleMimeType: audio.type || "audio/webm",
      sampleBytes: bytes.length,
      sampleRecordedAt: new Date().toISOString(),
      sampleFilename: filename,
    };

    const updateResult = await pool.query(
      `UPDATE riomind_team_speaker_voice_profiles
       SET sample_audio_url = $1,
           profile_status = 'enrolled_foundation',
           metadata = $2::jsonb,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [publicUrl, JSON.stringify(metadata), profileId]
    );

    return NextResponse.json({
      ok: true,
      profile: updateResult.rows[0],
      sampleAudioUrl: publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save voice sample." },
      { status: 500 }
    );
  }
}
