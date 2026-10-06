import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";

import type {
  MeetingLifecycleState,
  MeetingRoom,
} from "./types";

type MeetingDatabaseRow = {
  id: string;
  meeting_code: string;
  title: string;
  meeting_status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

function timestampValue(
  value: string | Date | null | undefined
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export function lifecycleFromMeetingStatus(
  status: unknown
): MeetingLifecycleState {
  const normalized = String(status || "scheduled")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "scheduled":
      return "scheduled";

    case "lobby":
    case "waiting":
    case "waiting_room":
      return "lobby";

    case "joining":
    case "starting":
      return "joining";

    case "live":
    case "active":
    case "in_progress":
      return "live";

    case "paused":
      return "paused";

    case "ending":
    case "finishing":
      return "ending";

    case "archived":
    case "ended":
    case "completed":
    case "cancelled":
    case "canceled":
      return "archived";

    default:
      return "scheduled";
  }
}

export function meetingRoomFromDatabaseRow(
  row: MeetingDatabaseRow
): MeetingRoom {
  return {
    id: String(row.id),
    meetingCode: String(row.meeting_code),
    title: String(row.title || "Nexus Teams Meeting"),
    lifecycle: lifecycleFromMeetingStatus(
      row.meeting_status
    ),
    createdAt: timestampValue(row.created_at),
    updatedAt: timestampValue(
      row.updated_at || row.created_at
    ),
    participants: [],
  };
}

export async function loadMeetingRoom(
  meetingIdentifier: string
): Promise<MeetingRoom | null> {
  const identifier = String(meetingIdentifier || "").trim();

  if (!identifier) {
    return null;
  }

  const pool = await getReadyRioMindTeamsPool();

  const result = await pool.query<MeetingDatabaseRow>(
    `SELECT
       id,
       meeting_code,
       title,
       meeting_status,
       created_at,
       updated_at
     FROM riomind_team_meetings
     WHERE meeting_code = $1
        OR id::text = $1
     LIMIT 1`,
    [identifier]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return meetingRoomFromDatabaseRow(row);
}
