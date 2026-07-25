import { getReadyRioMindTeamsPool } from "@/lib/riomind/teams/db";
import {
  findMeetingByCode,
} from "@/lib/riomind/teams/meeting-invitations";
import {
  normalizeMeetingCode,
} from "@/lib/riomind/teams/meeting-identity";

export type MeetingRequestContext = {
  pool: Awaited<ReturnType<typeof getReadyRioMindTeamsPool>>;
  meeting: Record<string, unknown> & {
    id: string;
    meeting_code: string;
    team_id?: string | null;
    title?: string | null;
  };
  meetingCode: string;
};

export async function resolveMeetingRequestContext(
  rawMeetingCode: string
): Promise<MeetingRequestContext> {
  const meetingCode = normalizeMeetingCode(
    decodeURIComponent(String(rawMeetingCode || ""))
  );

  if (!meetingCode) {
    throw new Error("A valid meeting code is required.");
  }

  const pool = await getReadyRioMindTeamsPool();
  const meeting = await findMeetingByCode(
    pool,
    meetingCode
  );

  if (!meeting) {
    throw new Error(
      `Meeting not found for code ${meetingCode}.`
    );
  }

  return {
    pool,
    meeting,
    meetingCode,
  };
}
