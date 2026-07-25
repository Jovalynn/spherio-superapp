import { NextRequest, NextResponse } from "next/server";

import {
  MEETING_INTELLIGENCE_STATUSES,
  deleteMeetingIntelligence,
  updateMeetingIntelligence,
  type MeetingIntelligenceStatus,
} from "@/lib/riomind/teams/meeting-intelligence";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    meetingCode: string;
    recordId: string;
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

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected meeting intelligence error.";

  if (message.startsWith("Meeting not found")) {
    return jsonError(message, 404);
  }

  if (
    message.includes("record was not found") ||
    message.includes("not found")
  ) {
    return jsonError(message, 404);
  }

  if (
    message.includes("Unsupported") ||
    message.includes("required")
  ) {
    return jsonError(message, 400);
  }

  console.error(
    "[meeting-intelligence-record-api]",
    error
  );

  return jsonError(
    "Meeting intelligence record request failed.",
    500
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode, recordId } =
      await context.params;

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "A valid JSON request body is required.",
        400
      );
    }

    if (
      body.status !== undefined &&
      !isMeetingStatus(body.status)
    ) {
      return jsonError(
        "Unsupported meeting intelligence status.",
        400,
        {
          allowed: MEETING_INTELLIGENCE_STATUSES,
        }
      );
    }

    const hasOwnerUserId =
      Object.prototype.hasOwnProperty.call(
        body,
        "ownerUserId"
      ) ||
      Object.prototype.hasOwnProperty.call(
        body,
        "owner_user_id"
      );

    const hasOwnerName =
      Object.prototype.hasOwnProperty.call(
        body,
        "ownerName"
      ) ||
      Object.prototype.hasOwnProperty.call(
        body,
        "owner_name"
      );

    const hasDueAt =
      Object.prototype.hasOwnProperty.call(
        body,
        "dueAt"
      ) ||
      Object.prototype.hasOwnProperty.call(
        body,
        "due_at"
      );

    const result = await updateMeetingIntelligence(
      decodeURIComponent(meetingCode),
      recordId,
      {
        status:
          typeof body.status === "string"
            ? body.status as MeetingIntelligenceStatus
            : undefined,

        title:
          typeof body.title === "string"
            ? body.title
            : undefined,

        detail:
          typeof body.detail === "string"
            ? body.detail
            : undefined,

        ...(hasOwnerUserId
          ? {
              ownerUserId:
                typeof body.ownerUserId === "string"
                  ? body.ownerUserId
                  : typeof body.owner_user_id === "string"
                  ? body.owner_user_id
                  : null,
            }
          : {}),

        ...(hasOwnerName
          ? {
              ownerName:
                typeof body.ownerName === "string"
                  ? body.ownerName
                  : typeof body.owner_name === "string"
                  ? body.owner_name
                  : null,
            }
          : {}),

        ...(hasDueAt
          ? {
              dueAt:
                typeof body.dueAt === "string"
                  ? body.dueAt
                  : typeof body.due_at === "string"
                  ? body.due_at
                  : null,
            }
          : {}),

        tags: Array.isArray(body.tags)
          ? body.tags.filter(
              (tag): tag is string =>
                typeof tag === "string"
            )
          : undefined,

        metadata:
          body.metadata &&
          typeof body.metadata === "object" &&
          !Array.isArray(body.metadata)
            ? body.metadata as Record<string, unknown>
            : undefined,
      }
    );

    return NextResponse.json({
      ok: true,
      updated: true,
      mode: "persistent",
      meetingId: result.meetingId,
      meetingCode: result.meetingCode,
      record: result.record,
    });
  } catch (error) {
    return mapError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode, recordId } =
      await context.params;

    const result = await deleteMeetingIntelligence(
      decodeURIComponent(meetingCode),
      recordId
    );

    if (!result.deleted) {
      return jsonError(
        "Meeting intelligence record was not found.",
        404
      );
    }

    return NextResponse.json({
      ok: true,
      deleted: true,
      meetingId: result.meetingId,
      meetingCode: result.meetingCode,
      recordId: result.recordId,
    });
  } catch (error) {
    return mapError(error);
  }
}
