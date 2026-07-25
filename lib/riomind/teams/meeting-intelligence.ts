import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";

import { getReadyRioMindTeamsPool } from "./db";

export const MEETING_INTELLIGENCE_TYPES = [
  "decision",
  "action",
  "risk",
  "question",
  "commitment",
  "insight",
  "recommendation",
  "blocker",
  "follow_up",
] as const;

export type MeetingIntelligenceType =
  (typeof MEETING_INTELLIGENCE_TYPES)[number];

export const MEETING_INTELLIGENCE_STATUSES = [
  "detected",
  "accepted",
  "resolved",
  "dismissed",
  "completed",
  "answered",
  "archived",
] as const;

export type MeetingIntelligenceStatus =
  (typeof MEETING_INTELLIGENCE_STATUSES)[number];

export const MEETING_INTELLIGENCE_SOURCE_TYPES = [
  "chat",
  "transcript",
  "manual",
  "assistant",
  "system",
] as const;

export type MeetingIntelligenceSourceType =
  (typeof MEETING_INTELLIGENCE_SOURCE_TYPES)[number];

export type MeetingIntelligenceRecord = {
  id: string;
  meeting_id: string;
  meeting_code: string;

  intelligence_type: MeetingIntelligenceType;
  title: string;
  detail: string;
  status: MeetingIntelligenceStatus;

  speaker_id: string | null;
  speaker_name: string | null;
  participant_id: string | null;

  owner_user_id: string | null;
  owner_name: string | null;
  due_at: string | null;

  source_type: MeetingIntelligenceSourceType;
  source_id: string | null;
  source_text: string | null;
  source_language: string | null;

  confidence: number | null;
  semantic_signature: string;
  detected_by: string;

  tags: string[];
  metadata: Record<string, unknown>;

  detected_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;

  created_at: string;
  updated_at: string;
};

export type CreateMeetingIntelligenceInput = {
  meetingCode: string;

  intelligenceType: MeetingIntelligenceType;
  title: string;
  detail?: string;
  status?: MeetingIntelligenceStatus;

  speakerId?: string | null;
  speakerName?: string | null;
  participantId?: string | null;

  ownerUserId?: string | null;
  ownerName?: string | null;
  dueAt?: string | null;

  sourceType: MeetingIntelligenceSourceType;
  sourceId?: string | null;
  sourceText?: string | null;
  sourceLanguage?: string | null;

  confidence?: number | null;
  detectedBy?: string;

  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type UpdateMeetingIntelligenceInput = {
  status?: MeetingIntelligenceStatus;
  title?: string;
  detail?: string;

  ownerUserId?: string | null;
  ownerName?: string | null;
  dueAt?: string | null;

  tags?: string[];
  metadata?: Record<string, unknown>;
};

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

function normalizeSignatureValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createMeetingIntelligenceSignature(input: {
  intelligenceType: MeetingIntelligenceType;
  speakerName?: string | null;
  title: string;
  detail?: string | null;
}) {
  const canonical = [
    input.intelligenceType,
    normalizeSignatureValue(input.speakerName),
    normalizeSignatureValue(input.title),
    normalizeSignatureValue(input.detail),
  ].join("|");

  return createHash("sha256")
    .update(canonical)
    .digest("hex");
}

function assertMeetingIntelligenceType(
  value: string
): asserts value is MeetingIntelligenceType {
  if (
    !MEETING_INTELLIGENCE_TYPES.includes(
      value as MeetingIntelligenceType
    )
  ) {
    throw new Error(
      `Unsupported meeting intelligence type: ${value}`
    );
  }
}

function assertMeetingIntelligenceStatus(
  value: string
): asserts value is MeetingIntelligenceStatus {
  if (
    !MEETING_INTELLIGENCE_STATUSES.includes(
      value as MeetingIntelligenceStatus
    )
  ) {
    throw new Error(
      `Unsupported meeting intelligence status: ${value}`
    );
  }
}

function assertMeetingIntelligenceSourceType(
  value: string
): asserts value is MeetingIntelligenceSourceType {
  if (
    !MEETING_INTELLIGENCE_SOURCE_TYPES.includes(
      value as MeetingIntelligenceSourceType
    )
  ) {
    throw new Error(
      `Unsupported meeting intelligence source: ${value}`
    );
  }
}

async function resolveMeetingId(
  database: Queryable,
  meetingCode: string
) {
  const normalizedCode = meetingCode.trim();

  if (!normalizedCode) {
    throw new Error("meetingCode is required.");
  }

  const result = await database.query<{
    id: string;
    meeting_code: string;
  }>(
    `
      SELECT id, meeting_code
      FROM riomind_team_meetings
      WHERE meeting_code = $1
      LIMIT 1
    `,
    [normalizedCode]
  );

  const meeting = result.rows[0];

  if (!meeting) {
    throw new Error(
      `Meeting not found for code: ${normalizedCode}`
    );
  }

  return meeting;
}

export async function listMeetingIntelligence(
  meetingCode: string,
  options?: {
    statuses?: MeetingIntelligenceStatus[];
    types?: MeetingIntelligenceType[];
    limit?: number;
  }
) {
  const pool = await getReadyRioMindTeamsPool();
  const meeting = await resolveMeetingId(pool, meetingCode);

  const values: unknown[] = [meeting.id];
  const conditions = ["intelligence.meeting_id = $1"];

  if (options?.statuses?.length) {
    values.push(options.statuses);
    conditions.push(
      `intelligence.status = ANY($${values.length}::text[])`
    );
  }

  if (options?.types?.length) {
    values.push(options.types);
    conditions.push(
      `intelligence.intelligence_type = ANY($${values.length}::text[])`
    );
  }

  const limit = Math.min(
    Math.max(options?.limit ?? 500, 1),
    1000
  );

  values.push(limit);

  const result = await pool.query<MeetingIntelligenceRecord>(
    `
      SELECT
        intelligence.*,
        meeting.meeting_code
      FROM riomind_team_meeting_intelligence intelligence
      INNER JOIN riomind_team_meetings meeting
        ON meeting.id = intelligence.meeting_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY
        intelligence.detected_at DESC,
        intelligence.created_at DESC
      LIMIT $${values.length}
    `,
    values
  );

  return {
    meetingId: meeting.id,
    meetingCode: meeting.meeting_code,
    records: result.rows,
  };
}

export async function upsertMeetingIntelligence(
  input: CreateMeetingIntelligenceInput
) {
  assertMeetingIntelligenceType(input.intelligenceType);
  assertMeetingIntelligenceSourceType(input.sourceType);

  const status = input.status ?? "detected";
  assertMeetingIntelligenceStatus(status);

  const title = input.title.trim();
  const detail = String(input.detail ?? "").trim();

  if (!title) {
    throw new Error("Meeting intelligence title is required.");
  }

  if (
    input.confidence !== undefined &&
    input.confidence !== null &&
    (
      !Number.isFinite(input.confidence) ||
      input.confidence < 0 ||
      input.confidence > 100
    )
  ) {
    throw new Error(
      "confidence must be between 0 and 100."
    );
  }

  const pool = await getReadyRioMindTeamsPool();
  const meeting = await resolveMeetingId(
    pool,
    input.meetingCode
  );

  const signature = createMeetingIntelligenceSignature({
    intelligenceType: input.intelligenceType,
    speakerName: input.speakerName,
    title,
    detail,
  });

  const result = await pool.query<MeetingIntelligenceRecord>(
    `
      INSERT INTO riomind_team_meeting_intelligence (
        meeting_id,
        intelligence_type,
        title,
        detail,
        status,

        speaker_id,
        speaker_name,
        participant_id,

        owner_user_id,
        owner_name,
        due_at,

        source_type,
        source_id,
        source_text,
        source_language,

        confidence,
        semantic_signature,
        detected_by,

        tags,
        metadata,

        accepted_at,
        resolved_at,
        dismissed_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,

        $6,
        $7,
        $8,

        $9,
        $10,
        $11,

        $12,
        $13,
        $14,
        $15,

        $16,
        $17,
        $18,

        $19::text[],
        $20::jsonb,

        CASE WHEN $5 = 'accepted' THEN now() ELSE NULL END,
        CASE
          WHEN $5 IN ('resolved', 'completed', 'answered')
          THEN now()
          ELSE NULL
        END,
        CASE WHEN $5 = 'dismissed' THEN now() ELSE NULL END
      )
      ON CONFLICT (
        meeting_id,
        intelligence_type,
        semantic_signature
      )
      DO UPDATE SET
        source_id = COALESCE(
          riomind_team_meeting_intelligence.source_id,
          EXCLUDED.source_id
        ),
        source_text = COALESCE(
          riomind_team_meeting_intelligence.source_text,
          EXCLUDED.source_text
        ),
        source_language = COALESCE(
          riomind_team_meeting_intelligence.source_language,
          EXCLUDED.source_language
        ),
        confidence = GREATEST(
          COALESCE(
            riomind_team_meeting_intelligence.confidence,
            0
          ),
          COALESCE(EXCLUDED.confidence, 0)
        ),
        tags = (
          SELECT ARRAY(
            SELECT DISTINCT tag
            FROM unnest(
              riomind_team_meeting_intelligence.tags ||
              EXCLUDED.tags
            ) AS tag
          )
        ),
        metadata =
          riomind_team_meeting_intelligence.metadata ||
          EXCLUDED.metadata,
        updated_at = now()
      RETURNING *
    `,
    [
      meeting.id,
      input.intelligenceType,
      title,
      detail,
      status,

      input.speakerId ?? null,
      input.speakerName ?? null,
      input.participantId ?? null,

      input.ownerUserId ?? null,
      input.ownerName ?? null,
      input.dueAt ?? null,

      input.sourceType,
      input.sourceId ?? null,
      input.sourceText ?? null,
      input.sourceLanguage ?? null,

      input.confidence ?? null,
      signature,
      input.detectedBy ?? "riomind-core",

      input.tags ?? [],
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  const record = result.rows[0];

  if (!record) {
    throw new Error(
      "Meeting intelligence could not be persisted."
    );
  }

  return {
    meetingId: meeting.id,
    meetingCode: meeting.meeting_code,
    record: {
      ...record,
      meeting_code: meeting.meeting_code,
    },
  };
}

export async function updateMeetingIntelligence(
  meetingCode: string,
  recordId: string,
  input: UpdateMeetingIntelligenceInput
) {
  if (input.status) {
    assertMeetingIntelligenceStatus(input.status);
  }

  const pool = await getReadyRioMindTeamsPool();
  const meeting = await resolveMeetingId(pool, meetingCode);

  const result = await pool.query<MeetingIntelligenceRecord>(
    `
      UPDATE riomind_team_meeting_intelligence
      SET
        status = COALESCE($3, status),
        title = COALESCE($4, title),
        detail = COALESCE($5, detail),

        owner_user_id = CASE
          WHEN $6::boolean THEN $7
          ELSE owner_user_id
        END,

        owner_name = CASE
          WHEN $8::boolean THEN $9
          ELSE owner_name
        END,

        due_at = CASE
          WHEN $10::boolean THEN $11::timestamptz
          ELSE due_at
        END,

        tags = COALESCE($12::text[], tags),
        metadata = CASE
          WHEN $13::jsonb IS NULL THEN metadata
          ELSE metadata || $13::jsonb
        END,

        accepted_at = CASE
          WHEN $3 = 'accepted'
          THEN COALESCE(accepted_at, now())
          ELSE accepted_at
        END,

        resolved_at = CASE
          WHEN $3 IN ('resolved', 'completed', 'answered')
          THEN COALESCE(resolved_at, now())
          ELSE resolved_at
        END,

        dismissed_at = CASE
          WHEN $3 = 'dismissed'
          THEN COALESCE(dismissed_at, now())
          ELSE dismissed_at
        END,

        updated_at = now()
      WHERE id = $1
        AND meeting_id = $2
      RETURNING *
    `,
    [
      recordId,
      meeting.id,
      input.status ?? null,
      input.title?.trim() || null,
      input.detail?.trim() || null,

      Object.prototype.hasOwnProperty.call(
        input,
        "ownerUserId"
      ),
      input.ownerUserId ?? null,

      Object.prototype.hasOwnProperty.call(
        input,
        "ownerName"
      ),
      input.ownerName ?? null,

      Object.prototype.hasOwnProperty.call(
        input,
        "dueAt"
      ),
      input.dueAt ?? null,

      input.tags ?? null,
      input.metadata
        ? JSON.stringify(input.metadata)
        : null,
    ]
  );

  const record = result.rows[0];

  if (!record) {
    throw new Error(
      "Meeting intelligence record was not found."
    );
  }

  return {
    meetingId: meeting.id,
    meetingCode: meeting.meeting_code,
    record: {
      ...record,
      meeting_code: meeting.meeting_code,
    },
  };
}

export async function deleteMeetingIntelligence(
  meetingCode: string,
  recordId: string
) {
  const pool = await getReadyRioMindTeamsPool();
  const meeting = await resolveMeetingId(pool, meetingCode);

  const result = await pool.query<{ id: string }>(
    `
      DELETE FROM riomind_team_meeting_intelligence
      WHERE id = $1
        AND meeting_id = $2
      RETURNING id
    `,
    [recordId, meeting.id]
  );

  return {
    meetingId: meeting.id,
    meetingCode: meeting.meeting_code,
    deleted: Boolean(result.rows[0]),
    recordId,
  };
}
