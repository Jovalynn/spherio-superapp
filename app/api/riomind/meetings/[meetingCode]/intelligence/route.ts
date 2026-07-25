import { NextRequest, NextResponse } from "next/server";

import {
  MEETING_INTELLIGENCE_SOURCE_TYPES,
  MEETING_INTELLIGENCE_STATUSES,
  MEETING_INTELLIGENCE_TYPES,
  listMeetingIntelligence,
  upsertMeetingIntelligence,
  type MeetingIntelligenceSourceType,
  type MeetingIntelligenceStatus,
  type MeetingIntelligenceType,
} from "@/lib/riomind/teams/meeting-intelligence";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    meetingCode: string;
  }>;
};

function jsonError(
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(details === undefined ? {} : { details }),
    },
    { status }
  );
}

function isMeetingType(
  value: unknown
): value is MeetingIntelligenceType {
  return (
    typeof value === "string" &&
    MEETING_INTELLIGENCE_TYPES.includes(
      value as MeetingIntelligenceType
    )
  );
}

function isMeetingStatus(
  value: unknown
): value is MeetingIntelligenceStatus {
  return (
    typeof value === "string" &&
    MEETING_INTELLIGENCE_STATUSES.includes(
      value as MeetingIntelligenceStatus
    )
  );
}

function isMeetingSourceType(
  value: unknown
): value is MeetingIntelligenceSourceType {
  return (
    typeof value === "string" &&
    MEETING_INTELLIGENCE_SOURCE_TYPES.includes(
      value as MeetingIntelligenceSourceType
    )
  );
}

function readStringArray(
  searchParams: URLSearchParams,
  key: string
) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function groupRecords(
  records: Awaited<
    ReturnType<typeof listMeetingIntelligence>
  >["records"]
) {
  return {
    decisions: records.filter(
      (record) => record.intelligence_type === "decision"
    ),
    actions: records.filter(
      (record) => record.intelligence_type === "action"
    ),
    risks: records.filter(
      (record) => record.intelligence_type === "risk"
    ),
    questions: records.filter(
      (record) => record.intelligence_type === "question"
    ),
    commitments: records.filter(
      (record) => record.intelligence_type === "commitment"
    ),
    insights: records.filter(
      (record) => record.intelligence_type === "insight"
    ),
    recommendations: records.filter(
      (record) =>
        record.intelligence_type === "recommendation"
    ),
    blockers: records.filter(
      (record) => record.intelligence_type === "blocker"
    ),
    followUps: records.filter(
      (record) => record.intelligence_type === "follow_up"
    ),
  };
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected meeting intelligence error.";

  if (message.startsWith("Meeting not found")) {
    return jsonError(message, 404);
  }

  if (
    message.includes("required") ||
    message.includes("Unsupported") ||
    message.includes("confidence")
  ) {
    return jsonError(message, 400);
  }

  console.error(
    "[meeting-intelligence-api]",
    error
  );

  return jsonError(
    "Meeting intelligence request failed.",
    500
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    const requestedStatuses = readStringArray(
      searchParams,
      "status"
    );

    const requestedTypes = readStringArray(
      searchParams,
      "type"
    );

    const invalidStatus = requestedStatuses.find(
      (value) => !isMeetingStatus(value)
    );

    if (invalidStatus) {
      return jsonError(
        `Unsupported meeting intelligence status: ${invalidStatus}`,
        400
      );
    }

    const invalidType = requestedTypes.find(
      (value) => !isMeetingType(value)
    );

    if (invalidType) {
      return jsonError(
        `Unsupported meeting intelligence type: ${invalidType}`,
        400
      );
    }

    const requestedLimit = Number(
      searchParams.get("limit") || 500
    );

    const limit = Number.isFinite(requestedLimit)
      ? requestedLimit
      : 500;

    const result = await listMeetingIntelligence(
      decodeURIComponent(meetingCode),
      {
        statuses:
          requestedStatuses.length > 0
            ? (requestedStatuses as MeetingIntelligenceStatus[])
            : undefined,

        types:
          requestedTypes.length > 0
            ? (requestedTypes as MeetingIntelligenceType[])
            : undefined,

        limit,
      }
    );

    return NextResponse.json({
      ok: true,
      meetingId: result.meetingId,
      meetingCode: result.meetingCode,
      mode: "persistent",
      synced: true,
      count: result.records.length,
      records: result.records,
      grouped: groupRecords(result.records),
    });
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode } = await context.params;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "A valid JSON request body is required.",
        400
      );
    }

    const intelligenceType =
      body.intelligenceType ??
      body.intelligence_type ??
      body.type;

    const sourceType =
      body.sourceType ??
      body.source_type ??
      "system";

    const status =
      body.status ?? "detected";

    if (!isMeetingType(intelligenceType)) {
      return jsonError(
        "A supported intelligenceType is required.",
        400,
        {
          allowed: MEETING_INTELLIGENCE_TYPES,
        }
      );
    }

    if (!isMeetingSourceType(sourceType)) {
      return jsonError(
        "A supported sourceType is required.",
        400,
        {
          allowed: MEETING_INTELLIGENCE_SOURCE_TYPES,
        }
      );
    }

    if (!isMeetingStatus(status)) {
      return jsonError(
        "A supported status is required.",
        400,
        {
          allowed: MEETING_INTELLIGENCE_STATUSES,
        }
      );
    }

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    if (!title) {
      return jsonError(
        "title is required.",
        400
      );
    }

    const confidence =
      body.confidence === null ||
      body.confidence === undefined
        ? null
        : Number(body.confidence);

    if (
      confidence !== null &&
      (
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 100
      )
    ) {
      return jsonError(
        "confidence must be between 0 and 100.",
        400
      );
    }

    const result = await upsertMeetingIntelligence({
      meetingCode: decodeURIComponent(meetingCode),

      intelligenceType,
      title,

      detail:
        typeof body.detail === "string"
          ? body.detail
          : "",

      status,

      speakerId:
        typeof body.speakerId === "string"
          ? body.speakerId
          : typeof body.speaker_id === "string"
          ? body.speaker_id
          : null,

      speakerName:
        typeof body.speakerName === "string"
          ? body.speakerName
          : typeof body.speaker_name === "string"
          ? body.speaker_name
          : null,

      participantId:
        typeof body.participantId === "string"
          ? body.participantId
          : typeof body.participant_id === "string"
          ? body.participant_id
          : null,

      ownerUserId:
        typeof body.ownerUserId === "string"
          ? body.ownerUserId
          : typeof body.owner_user_id === "string"
          ? body.owner_user_id
          : null,

      ownerName:
        typeof body.ownerName === "string"
          ? body.ownerName
          : typeof body.owner_name === "string"
          ? body.owner_name
          : null,

      dueAt:
        typeof body.dueAt === "string"
          ? body.dueAt
          : typeof body.due_at === "string"
          ? body.due_at
          : null,

      sourceType,

      sourceId:
        typeof body.sourceId === "string"
          ? body.sourceId
          : typeof body.source_id === "string"
          ? body.source_id
          : null,

      sourceText:
        typeof body.sourceText === "string"
          ? body.sourceText
          : typeof body.source_text === "string"
          ? body.source_text
          : null,

      sourceLanguage:
        typeof body.sourceLanguage === "string"
          ? body.sourceLanguage
          : typeof body.source_language === "string"
          ? body.source_language
          : null,

      confidence,

      detectedBy:
        typeof body.detectedBy === "string"
          ? body.detectedBy
          : typeof body.detected_by === "string"
          ? body.detected_by
          : "riomind-core",

      tags: Array.isArray(body.tags)
        ? body.tags.filter(
            (tag): tag is string =>
              typeof tag === "string"
          )
        : [],

      metadata:
        body.metadata &&
        typeof body.metadata === "object" &&
        !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : {},
    });

    return NextResponse.json(
      {
        ok: true,
        created: true,
        mode: "persistent",
        meetingId: result.meetingId,
        meetingCode: result.meetingCode,
        record: result.record,
      },
      { status: 201 }
    );
  } catch (error) {
    return mapError(error);
  }
}
