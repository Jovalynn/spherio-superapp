import { randomBytes } from "crypto";

const MEETING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MEETING_CODE_GROUP_LENGTH = 4;

export type NexusMeetingType =
  | "scheduled"
  | "instant"
  | "personal"
  | "team_room";

export type NexusMeetingAccessPolicy =
  | "private"
  | "team"
  | "invited"
  | "public";

function randomCodeGroup(length = MEETING_CODE_GROUP_LENGTH) {
  const bytes = randomBytes(length);
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += MEETING_CODE_ALPHABET[
      bytes[index] % MEETING_CODE_ALPHABET.length
    ];
  }

  return result;
}

export function generateMeetingCodeCandidate() {
  return `NX-${randomCodeGroup()}-${randomCodeGroup()}`;
}

export function normalizeMeetingCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function isSupportedMeetingCode(value: unknown) {
  const meetingCode = normalizeMeetingCode(value);

  return (
    /^NX-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(meetingCode) ||
    /^NX-\d{4}-[A-Z0-9]+$/.test(meetingCode)
  );
}

export function meetingApplicationPath(meetingCode: string) {
  return `/nexus/meetings/${encodeURIComponent(
    normalizeMeetingCode(meetingCode)
  )}/v2`;
}

export function meetingJoinPath(meetingCode: string) {
  return `/nexus/meet/${encodeURIComponent(
    normalizeMeetingCode(meetingCode)
  )}`;
}

export async function generateUniqueMeetingCode(
  pool: {
    query: (
      text: string,
      values?: unknown[]
    ) => Promise<{ rows: Array<Record<string, unknown>> }>;
  },
  attempts = 12
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = generateMeetingCodeCandidate();

    const existing = await pool.query(
      `SELECT 1
       FROM riomind_team_meetings
       WHERE meeting_code = $1
       LIMIT 1`,
      [candidate]
    );

    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to generate a unique Nexus meeting code after multiple attempts"
  );
}
