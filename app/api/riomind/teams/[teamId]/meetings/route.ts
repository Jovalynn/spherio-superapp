import { NextRequest, NextResponse } from "next/server";
import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import {
  generateUniqueMeetingCode,
  meetingApplicationPath,
  meetingJoinPath,
  type NexusMeetingAccessPolicy,
  type NexusMeetingType,
} from "@/lib/riomind/teams/meeting-identity";

const MEETING_TYPES = new Set<NexusMeetingType>([
  "scheduled",
  "instant",
  "personal",
  "team_room",
]);

const ACCESS_POLICIES = new Set<NexusMeetingAccessPolicy>([
  "private",
  "team",
  "invited",
  "public",
]);

function meetingTypeFromBody(value: unknown): NexusMeetingType {
  const candidate = String(value || "scheduled") as NexusMeetingType;
  return MEETING_TYPES.has(candidate) ? candidate : "scheduled";
}

function accessPolicyFromBody(
  value: unknown
): NexusMeetingAccessPolicy {
  const candidate = String(value || "team") as NexusMeetingAccessPolicy;
  return ACCESS_POLICIES.has(candidate) ? candidate : "team";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const pool = await getReadyRioMindTeamsPool();

    const result = await pool.query(
      `SELECT
         m.*,
         r.name AS room_name
       FROM riomind_team_meetings m
       LEFT JOIN riomind_team_rooms r
         ON r.id = m.room_id
       WHERE m.team_id = $1
       ORDER BY
         m.meeting_date ASC NULLS LAST,
         m.meeting_time ASC NULLS LAST,
         m.created_at DESC
       LIMIT 200`,
      [teamId]
    );

    return NextResponse.json({
      ok: true,
      count: result.rows.length,
      meetings: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to list meetings",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await req.json().catch(() => ({}));
    const pool = await getReadyRioMindTeamsPool();

    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: "Meeting title is required",
        },
        { status: 400 }
      );
    }

    const teamResult = await pool.query(
      `SELECT id, owner_user_id
       FROM riomind_teams
       WHERE id = $1
       LIMIT 1`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Team not found",
        },
        { status: 404 }
      );
    }

    const roomResult = await pool.query(
      `SELECT id
       FROM riomind_team_rooms
       WHERE team_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [teamId]
    );

    const roomId = body.roomId || roomResult.rows[0]?.id || null;
    const meetingType = meetingTypeFromBody(
      body.meetingType || body.meeting_type
    );
    const accessPolicy = accessPolicyFromBody(
      body.accessPolicy || body.access_policy
    );

    const ownerUserId = String(
      body.ownerUserId ||
      body.owner_user_id ||
      teamResult.rows[0]?.owner_user_id ||
      "local-user"
    );

    const ownerDisplayName = String(
      body.ownerDisplayName ||
      body.owner_display_name ||
      body.organizer ||
      "Organizer"
    );

    const meetingCode = await generateUniqueMeetingCode(pool);
    const meetingLink = meetingApplicationPath(meetingCode);
    const inviteLink = meetingJoinPath(meetingCode);
    const joinSlug = meetingCode.toLowerCase();

    const result = await pool.query(
      `INSERT INTO riomind_team_meetings (
         team_id,
         room_id,
         title,
         purpose,
         organizer,
         meeting_date,
         meeting_time,
         duration_minutes,
         language_mode,
         default_language,
         meeting_status,
         meeting_code,
         meeting_link,
         invite_link,
         meeting_type,
         owner_user_id,
         owner_display_name,
         access_policy,
         join_slug,
         lobby_enabled,
         invite_expires_at,
         metadata,
         identity_metadata
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23
       )
       RETURNING *`,
      [
        teamId,
        roomId,
        title,
        body.purpose || null,
        ownerDisplayName,
        body.meetingDate || body.meeting_date || null,
        body.meetingTime || body.meeting_time || null,
        Number(body.durationMinutes || body.duration_minutes || 60),
        body.languageMode || body.language_mode || "single",
        body.defaultLanguage || body.default_language || "en",
        meetingType === "instant" ? "live" : "scheduled",
        meetingCode,
        meetingLink,
        inviteLink,
        meetingType,
        ownerUserId,
        ownerDisplayName,
        accessPolicy,
        joinSlug,
        body.lobbyEnabled ??
          body.lobby_enabled ??
          body.waitingRoomEnabled ??
          true,
        body.inviteExpiresAt ||
          body.invite_expires_at ||
          null,
        body.metadata || {},
        {
          generator: "nexus-meeting-identity-v1",
          codeFormat: "NX-XXXX-XXXX",
          generatedAt: new Date().toISOString(),
          ...(body.identityMetadata ||
            body.identity_metadata ||
            {}),
        },
      ]
    );

    const meeting = result.rows[0];

    return NextResponse.json(
      {
        ok: true,
        created: true,
        meeting,
        identity: {
          id: meeting.id,
          meetingCode: meeting.meeting_code,
          meetingType: meeting.meeting_type,
          ownerUserId: meeting.owner_user_id,
          ownerDisplayName: meeting.owner_display_name,
          accessPolicy: meeting.access_policy,
          applicationPath: meeting.meeting_link,
          invitePath: meeting.invite_link,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to create meeting",
      },
      { status: 500 }
    );
  }
}
