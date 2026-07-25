import type {
  Pool,
  PoolClient,
} from "pg";

type Queryable =
  | Pick<Pool, "query">
  | Pick<PoolClient, "query">;

export const PARTICIPANT_PRESENCE_STATUSES = [
  "waiting",
  "joining",
  "in_meeting",
  "away",
  "reconnecting",
  "left",
  "removed",
  "offline",
] as const;

export type ParticipantPresenceStatus =
  (typeof PARTICIPANT_PRESENCE_STATUSES)[number];

export type MeetingParticipantRuntimeRecord = {
  id: string;
  runtime_id: string;
  clientSessionId?: string;
  meeting_id: string;
  invitation_id: string | null;

  user_id: string | null;
  display_name: string | null;
  email: string | null;

  participant_status: string;
  participant_role: string;
  access_type: string;
  preferred_language: string | null;

  presence_status: ParticipantPresenceStatus | string;

  camera_enabled: boolean;
  microphone_enabled: boolean;
  screen_sharing: boolean;
  speaking: boolean;
  hand_raised: boolean;

  connection_status: string;
  connection_quality: string | null;

  joined_at: string | Date | null;
  last_seen_at: string | Date | null;
  left_at: string | Date | null;
  disconnected_at: string | Date | null;

  metadata: Record<string, unknown>;
  runtime_metadata: Record<string, unknown>;

  created_at: string | Date;
  updated_at: string | Date;

  meeting_code?: string;
  meeting_title?: string;
};

export type JoinMeetingParticipantInput = {
  invitationId?: string | null;
  runtimeId?: string | null;
  clientSessionId?: string | null;

  userId?: string | null;
  displayName: string;
  email?: string | null;

  role?: string;
  accessType?: string;
  preferredLanguage?: string;

  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;

  connectionQuality?: string | null;

  metadata?: Record<string, unknown>;
  runtimeMetadata?: Record<string, unknown>;
};

function nullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredDisplayName(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(
      "A participant display name is required."
    );
  }

  return text.slice(0, 120);
}

function normalizeRole(value: unknown) {
  const role = String(value ?? "")
    .trim()
    .toLowerCase();

  return role || "participant";
}

function normalizeLanguage(value: unknown) {
  const language = String(value ?? "")
    .trim()
    .toLowerCase();

  return language || "en";
}

export async function joinMeetingParticipant(
  db: Queryable,
  meetingId: string,
  input: JoinMeetingParticipantInput
): Promise<MeetingParticipantRuntimeRecord> {
  const runtimeId = nullableText(input.runtimeId);
  const clientSessionId = nullableText(
    input.clientSessionId
  );
  const userId = nullableText(input.userId);
  const displayName = requiredDisplayName(
    input.displayName
  );

  const invitationId = nullableText(
    input.invitationId
  );
  const email = nullableText(input.email);
  const role = normalizeRole(input.role);
  const accessType =
    nullableText(input.accessType) ||
    "general_link";
  const preferredLanguage = normalizeLanguage(
    input.preferredLanguage
  );
  const cameraEnabled = Boolean(
    input.cameraEnabled
  );
  const microphoneEnabled = Boolean(
    input.microphoneEnabled
  );
  const connectionQuality = nullableText(
    input.connectionQuality
  );
  const metadata = input.metadata || {};
  const runtimeMetadata =
    input.runtimeMetadata || {};

  async function resumeParticipant(
    identitySql: string,
    identityValue: string
  ): Promise<MeetingParticipantRuntimeRecord | null> {
    const result = await db.query(
      `UPDATE riomind_team_meeting_participants
       SET
         invitation_id = COALESCE(
           $3::uuid,
           invitation_id
         ),
         user_id = COALESCE($4, user_id),
         client_session_id = COALESCE(
           $5,
           client_session_id
         ),
         display_name = $6,
         email = COALESCE($7, email),
         participant_status = 'joined',
         participant_role = $8,
         access_type = $9,
         preferred_language = $10,
         presence_status = 'in_meeting',
         camera_enabled = $11,
         microphone_enabled = $12,
         connection_status = 'connected',
         connection_quality = $13,
         joined_at = COALESCE(
           joined_at,
           now()
         ),
         last_seen_at = now(),
         left_at = NULL,
         disconnected_at = NULL,
         metadata = metadata || $14::jsonb,
         runtime_metadata =
           runtime_metadata || $15::jsonb,
         updated_at = now()
       WHERE id = (
         SELECT id
         FROM riomind_team_meeting_participants
         WHERE meeting_id = $1
           AND ${identitySql}
         ORDER BY
           last_seen_at DESC NULLS LAST,
           created_at DESC
         LIMIT 1
       )
       RETURNING *`,
      [
        meetingId,
        identityValue,
        invitationId,
        userId,
        clientSessionId,
        displayName,
        email,
        role,
        accessType,
        preferredLanguage,
        cameraEnabled,
        microphoneEnabled,
        connectionQuality,
        metadata,
        runtimeMetadata,
      ]
    );

    return result.rows[0] || null;
  }

  // First choice: exact runtime identity.
  if (runtimeId) {
    const existingRuntime =
      await resumeParticipant(
        "runtime_id = $2::uuid",
        runtimeId
      );

    if (existingRuntime) {
      return existingRuntime;
    }
  }

  // Second choice: persistent browser/tab session.
  if (clientSessionId) {
    const existingSession =
      await resumeParticipant(
        "client_session_id = $2",
        clientSessionId
      );

    if (existingSession) {
      return existingSession;
    }
  }

  // Third choice: authenticated participant identity.
  if (userId) {
    const existingUser =
      await resumeParticipant(
        `user_id = $2
         AND presence_status <> 'left'`,
        userId
      );

    if (existingUser) {
      return existingUser;
    }
  }

  // No resumable participant exists: create a new runtime.
  const created = await db.query(
    `INSERT INTO riomind_team_meeting_participants (
       meeting_id,
       invitation_id,
       user_id,
       client_session_id,
       display_name,
       email,
       participant_status,
       participant_role,
       access_type,
       preferred_language,
       presence_status,
       camera_enabled,
       microphone_enabled,
       connection_status,
       connection_quality,
       joined_at,
       last_seen_at,
       metadata,
       runtime_metadata
     )
     VALUES (
       $1,
       $2::uuid,
       $3,
       $4,
       $5,
       $6,
       'joined',
       $7,
       $8,
       $9,
       'in_meeting',
       $10,
       $11,
       'connected',
       $12,
       now(),
       now(),
       $13::jsonb,
       $14::jsonb
     )
     RETURNING *`,
    [
      meetingId,
      invitationId,
      userId,
      clientSessionId,
      displayName,
      email,
      role,
      accessType,
      preferredLanguage,
      cameraEnabled,
      microphoneEnabled,
      connectionQuality,
      metadata,
      runtimeMetadata,
    ]
  );

  return created.rows[0];
}

export async function getParticipantRuntime(
  db: Queryable,
  meetingId: string,
  runtimeId: string
): Promise<MeetingParticipantRuntimeRecord | null> {
  const result = await db.query(
    `SELECT *
     FROM riomind_team_meeting_participants
     WHERE meeting_id = $1
       AND runtime_id = $2::uuid
     LIMIT 1`,
    [meetingId, runtimeId]
  );

  return result.rows[0] || null;
}

export async function heartbeatParticipantRuntime(
  db: Queryable,
  meetingId: string,
  runtimeId: string,
  input: {
    cameraEnabled?: boolean;
    microphoneEnabled?: boolean;
    screenSharing?: boolean;
    speaking?: boolean;
    handRaised?: boolean;
    presenceStatus?: ParticipantPresenceStatus;
    connectionStatus?: string;
    connectionQuality?: string | null;
    runtimeMetadata?: Record<string, unknown>;
  }
): Promise<MeetingParticipantRuntimeRecord | null> {
  const result = await db.query(
    `UPDATE riomind_team_meeting_participants
     SET
       camera_enabled = COALESCE(
         $3,
         camera_enabled
       ),
       microphone_enabled = COALESCE(
         $4,
         microphone_enabled
       ),
       screen_sharing = COALESCE(
         $5,
         screen_sharing
       ),
       speaking = COALESCE(
         $6,
         speaking
       ),
       hand_raised = COALESCE(
         $7,
         hand_raised
       ),
       presence_status = COALESCE(
         $8,
         presence_status
       ),
       connection_status = COALESCE(
         $9,
         connection_status
       ),
       connection_quality = COALESCE(
         $10,
         connection_quality
       ),
       runtime_metadata =
         runtime_metadata || $11::jsonb,
       last_seen_at = now(),
       disconnected_at = NULL,
       updated_at = now()
     WHERE meeting_id = $1
       AND runtime_id = $2::uuid
     RETURNING *`,
    [
      meetingId,
      runtimeId,
      typeof input.cameraEnabled === "boolean"
        ? input.cameraEnabled
        : null,
      typeof input.microphoneEnabled === "boolean"
        ? input.microphoneEnabled
        : null,
      typeof input.screenSharing === "boolean"
        ? input.screenSharing
        : null,
      typeof input.speaking === "boolean"
        ? input.speaking
        : null,
      typeof input.handRaised === "boolean"
        ? input.handRaised
        : null,
      input.presenceStatus || null,
      nullableText(input.connectionStatus),
      nullableText(input.connectionQuality),
      input.runtimeMetadata || {},
    ]
  );

  return result.rows[0] || null;
}

export async function leaveParticipantRuntime(
  db: Queryable,
  meetingId: string,
  runtimeId: string
): Promise<MeetingParticipantRuntimeRecord | null> {
  const result = await db.query(
    `UPDATE riomind_team_meeting_participants
     SET
       participant_status = 'left',
       presence_status = 'left',
       camera_enabled = false,
       microphone_enabled = false,
       screen_sharing = false,
       speaking = false,
       connection_status = 'disconnected',
       left_at = now(),
       last_seen_at = now(),
       disconnected_at = now(),
       updated_at = now()
     WHERE meeting_id = $1
       AND runtime_id = $2::uuid
     RETURNING *`,
    [meetingId, runtimeId]
  );

  return result.rows[0] || null;
}

export async function listActiveMeetingParticipants(
  db: Queryable,
  meetingId: string
): Promise<MeetingParticipantRuntimeRecord[]> {
  const result = await db.query(
    `SELECT *
     FROM riomind_team_meeting_participants
     WHERE meeting_id = $1
       AND presence_status IN (
         'waiting',
         'joining',
         'in_meeting',
         'away',
         'reconnecting'
       )
     ORDER BY
       joined_at ASC NULLS LAST,
       created_at ASC`,
    [meetingId]
  );

  return result.rows;
}



