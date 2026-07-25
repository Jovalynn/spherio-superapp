import { createHash, randomUUID } from "crypto";
import type { Pool, PoolClient } from "pg";

export const MEETING_INVITATION_STATUSES = [
  "draft",
  "sent",
  "delivered",
  "viewed",
  "accepted",
  "declined",
  "joined",
  "left",
  "expired",
  "revoked",
] as const;

export type MeetingInvitationStatus =
  (typeof MEETING_INVITATION_STATUSES)[number];

export const MEETING_INVITATION_ROLES = [
  "host",
  "co_host",
  "presenter",
  "participant",
  "viewer",
  "interpreter",
  "moderator",
] as const;

export type MeetingInvitationRole =
  (typeof MEETING_INVITATION_ROLES)[number];

export type MeetingInvitationRecord = {
  id: string;
  meeting_id: string;
  team_id: string | null;

  invitee_user_id: string | null;
  invitee_email: string | null;
  invitee_display_name: string | null;

  invited_role: MeetingInvitationRole | string;
  access_scope: string;

  token_id: string;
  token_hash: string;

  invitation_status: MeetingInvitationStatus | string;

  invited_by_user_id: string | null;
  invited_by_display_name: string | null;

  preferred_language: string | null;
  translation_language: string | null;

  sent_at: string | Date | null;
  delivered_at: string | Date | null;
  viewed_at: string | Date | null;
  accepted_at: string | Date | null;
  declined_at: string | Date | null;
  joined_at: string | Date | null;
  left_at: string | Date | null;
  expires_at: string | Date | null;
  revoked_at: string | Date | null;

  last_ip_hash: string | null;
  last_user_agent: string | null;

  metadata: Record<string, unknown>;

  created_at: string | Date;
  updated_at: string | Date;

  meeting_code?: string;
  meeting_title?: string;
};

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export type CreateMeetingInvitationInput = {
  meetingId: string;
  teamId?: string | null;

  inviteeUserId?: string | null;
  inviteeEmail?: string | null;
  inviteeDisplayName?: string | null;

  invitedRole?: MeetingInvitationRole;
  accessScope?: string;

  tokenId?: string;
  tokenHash: string;

  status?: MeetingInvitationStatus;

  invitedByUserId?: string | null;
  invitedByDisplayName?: string | null;

  preferredLanguage?: string | null;
  translationLanguage?: string | null;

  expiresAt?: string | Date | null;

  metadata?: Record<string, unknown>;
};

export type UpdateMeetingInvitationInput = {
  status?: MeetingInvitationStatus;

  inviteeUserId?: string | null;
  inviteeEmail?: string | null;
  inviteeDisplayName?: string | null;

  invitedRole?: MeetingInvitationRole;
  preferredLanguage?: string | null;
  translationLanguage?: string | null;

  tokenHash?: string;
  expiresAt?: string | Date | null;

  lastIpHash?: string | null;
  lastUserAgent?: string | null;

  metadata?: Record<string, unknown>;
};

function normalizeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

function normalizeNullableText(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function invitationTimestampColumn(status: MeetingInvitationStatus) {
  switch (status) {
    case "sent":
      return "sent_at";
    case "delivered":
      return "delivered_at";
    case "viewed":
      return "viewed_at";
    case "accepted":
      return "accepted_at";
    case "declined":
      return "declined_at";
    case "joined":
      return "joined_at";
    case "left":
      return "left_at";
    case "revoked":
      return "revoked_at";
    default:
      return null;
  }
}

export function createInvitationTokenId() {
  return randomUUID();
}

export function hashInvitationToken(value: string) {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

export async function findMeetingByCode(
  db: Queryable,
  meetingCode: string
) {
  const result = await db.query(
    `SELECT *
     FROM riomind_team_meetings
     WHERE meeting_code = $1
     LIMIT 1`,
    [String(meetingCode || "").trim().toUpperCase()]
  );

  return result.rows[0] || null;
}

export async function listMeetingInvitations(
  db: Queryable,
  meetingId: string
): Promise<MeetingInvitationRecord[]> {
  const result = await db.query(
    `SELECT
       invitation.*,
       meeting.meeting_code,
       meeting.title AS meeting_title
     FROM riomind_team_meeting_invitations invitation
     JOIN riomind_team_meetings meeting
       ON meeting.id = invitation.meeting_id
     WHERE invitation.meeting_id = $1
     ORDER BY
       invitation.created_at DESC,
       invitation.id DESC`,
    [meetingId]
  );

  return result.rows;
}

export async function getMeetingInvitationById(
  db: Queryable,
  invitationId: string
): Promise<MeetingInvitationRecord | null> {
  const result = await db.query(
    `SELECT
       invitation.*,
       meeting.meeting_code,
       meeting.title AS meeting_title
     FROM riomind_team_meeting_invitations invitation
     JOIN riomind_team_meetings meeting
       ON meeting.id = invitation.meeting_id
     WHERE invitation.id = $1
     LIMIT 1`,
    [invitationId]
  );

  return result.rows[0] || null;
}

export async function getMeetingInvitationByTokenId(
  db: Queryable,
  tokenId: string
): Promise<MeetingInvitationRecord | null> {
  const result = await db.query(
    `SELECT
       invitation.*,
       meeting.meeting_code,
       meeting.title AS meeting_title
     FROM riomind_team_meeting_invitations invitation
     JOIN riomind_team_meetings meeting
       ON meeting.id = invitation.meeting_id
     WHERE invitation.token_id = $1
     LIMIT 1`,
    [tokenId]
  );

  return result.rows[0] || null;
}

export async function createMeetingInvitation(
  db: Queryable,
  input: CreateMeetingInvitationInput
): Promise<MeetingInvitationRecord> {
  const tokenId = input.tokenId || createInvitationTokenId();
  const status = input.status || "draft";
  const timestampColumn = invitationTimestampColumn(status);

  const result = await db.query(
    `INSERT INTO riomind_team_meeting_invitations (
       meeting_id,
       team_id,

       invitee_user_id,
       invitee_email,
       invitee_display_name,

       invited_role,
       access_scope,

       token_id,
       token_hash,

       invitation_status,

       invited_by_user_id,
       invited_by_display_name,

       preferred_language,
       translation_language,

       expires_at,
       ${timestampColumn ? `${timestampColumn},` : ""}
       metadata
     )
     VALUES (
       $1,$2,
       $3,$4,$5,
       $6,$7,
       $8,$9,
       $10,
       $11,$12,
       $13,$14,
       $15,
       ${timestampColumn ? "now()," : ""}
       $16
     )
     RETURNING *`,
    [
      input.meetingId,
      input.teamId || null,

      normalizeNullableText(input.inviteeUserId),
      normalizeEmail(input.inviteeEmail),
      normalizeNullableText(input.inviteeDisplayName),

      input.invitedRole || "participant",
      input.accessScope || "meeting",

      tokenId,
      input.tokenHash,

      status,

      normalizeNullableText(input.invitedByUserId),
      normalizeNullableText(input.invitedByDisplayName),

      normalizeNullableText(input.preferredLanguage),
      normalizeNullableText(input.translationLanguage),

      input.expiresAt || null,
      input.metadata || {},
    ]
  );

  return result.rows[0];
}

export async function updateMeetingInvitation(
  db: Queryable,
  invitationId: string,
  input: UpdateMeetingInvitationInput
): Promise<MeetingInvitationRecord | null> {
  const status = input.status || null;
  const timestampColumn = status
    ? invitationTimestampColumn(status)
    : null;

  const result = await db.query(
    `UPDATE riomind_team_meeting_invitations
     SET
       invitation_status =
         COALESCE($2, invitation_status),

       invitee_user_id =
         CASE WHEN $3::boolean
           THEN $4
           ELSE invitee_user_id
         END,

       invitee_email =
         CASE WHEN $5::boolean
           THEN $6
           ELSE invitee_email
         END,

       invitee_display_name =
         CASE WHEN $7::boolean
           THEN $8
           ELSE invitee_display_name
         END,

       invited_role =
         COALESCE($9, invited_role),

       preferred_language =
         CASE WHEN $10::boolean
           THEN $11
           ELSE preferred_language
         END,

       translation_language =
         CASE WHEN $12::boolean
           THEN $13
           ELSE translation_language
         END,

       token_hash =
         COALESCE($14, token_hash),

       expires_at =
         CASE WHEN $15::boolean
           THEN $16
           ELSE expires_at
         END,

       last_ip_hash =
         CASE WHEN $17::boolean
           THEN $18
           ELSE last_ip_hash
         END,

       last_user_agent =
         CASE WHEN $19::boolean
           THEN $20
           ELSE last_user_agent
         END,

       metadata =
         metadata || $21::jsonb,

       ${timestampColumn
         ? `${timestampColumn} = COALESCE(${timestampColumn}, now()),`
         : ""}

       updated_at = now()

     WHERE id = $1
     RETURNING *`,
    [
      invitationId,
      status,

      Object.prototype.hasOwnProperty.call(input, "inviteeUserId"),
      normalizeNullableText(input.inviteeUserId),

      Object.prototype.hasOwnProperty.call(input, "inviteeEmail"),
      normalizeEmail(input.inviteeEmail),

      Object.prototype.hasOwnProperty.call(input, "inviteeDisplayName"),
      normalizeNullableText(input.inviteeDisplayName),

      input.invitedRole || null,

      Object.prototype.hasOwnProperty.call(input, "preferredLanguage"),
      normalizeNullableText(input.preferredLanguage),

      Object.prototype.hasOwnProperty.call(input, "translationLanguage"),
      normalizeNullableText(input.translationLanguage),

      input.tokenHash || null,

      Object.prototype.hasOwnProperty.call(input, "expiresAt"),
      input.expiresAt || null,

      Object.prototype.hasOwnProperty.call(input, "lastIpHash"),
      normalizeNullableText(input.lastIpHash),

      Object.prototype.hasOwnProperty.call(input, "lastUserAgent"),
      normalizeNullableText(input.lastUserAgent),

      input.metadata || {},
    ]
  );

  return result.rows[0] || null;
}

export async function expireStaleMeetingInvitations(
  db: Queryable,
  meetingId?: string
) {
  const result = await db.query(
    `UPDATE riomind_team_meeting_invitations
     SET
       invitation_status = 'expired',
       updated_at = now()
     WHERE expires_at IS NOT NULL
       AND expires_at <= now()
       AND invitation_status NOT IN (
         'accepted',
         'declined',
         'joined',
         'left',
         'expired',
         'revoked'
       )
       AND ($1::uuid IS NULL OR meeting_id = $1::uuid)
     RETURNING id`,
    [meetingId || null]
  );

  return result.rows.map((row) => row.id);
}

export async function revokeMeetingInvitation(
  db: Queryable,
  invitationId: string,
  metadata: Record<string, unknown> = {}
) {
  return updateMeetingInvitation(db, invitationId, {
    status: "revoked",
    metadata,
  });
}

export async function deleteDraftMeetingInvitation(
  db: Queryable,
  invitationId: string
) {
  const result = await db.query(
    `DELETE FROM riomind_team_meeting_invitations
     WHERE id = $1
       AND invitation_status = 'draft'
     RETURNING id`,
    [invitationId]
  );

 return (result.rowCount ?? 0) > 0;
}
