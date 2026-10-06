import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PARTICIPANT_PRESENCE_STATUSES,
  getParticipantRuntime,
  heartbeatParticipantRuntime,
  joinMeetingParticipant,
  leaveParticipantRuntime,
  listActiveMeetingParticipants,
  type ParticipantPresenceStatus,
} from "@/lib/riomind/teams/meeting-participant-runtime";
import {
  resolveMeetingRequestContext,
} from "@/lib/riomind/teams/meeting-request-context";

import { meetingEngine } from "@/lib/riomind/meetings/engine";
import type {
  ParticipantRole,
} from "@/lib/riomind/meetings/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    meetingCode: string;
  }>;
};

const MEETING_PARTICIPANT_ROLES: readonly ParticipantRole[] = [
  "owner",
  "host",
  "cohost",
  "presenter",
  "participant",
  "viewer",
  "guest",
];

function isMeetingParticipantRole(
  value: string
): value is ParticipantRole {
  return MEETING_PARTICIPANT_ROLES.includes(
    value as ParticipantRole
  );
}

function toIsoString(
  value: string | Date | null
): string {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date
    ? value.toISOString()
    : value;
}

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    {
      status,
    }
  );
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function readMetadata(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isPresenceStatus(
  value: unknown
): value is ParticipantPresenceStatus {
  return (
    typeof value === "string" &&
    PARTICIPANT_PRESENCE_STATUSES.includes(
      value as ParticipantPresenceStatus
    )
  );
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected participant runtime error.";

  if (message.startsWith("Meeting not found")) {
    return jsonError(message, 404);
  }

  if (
    message.includes("required") ||
    message.includes("invalid input syntax")
  ) {
    return jsonError(message, 400);
  }

  console.error(
    "[meeting-participant-runtime-api]",
    error
  );

  return jsonError(
    "Participant runtime operation failed.",
    500
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode } =
      await context.params;

    const {
      pool,
      meeting,
    } = await resolveMeetingRequestContext(
      meetingCode
    );

    const runtimeId =
      request.nextUrl.searchParams.get(
        "runtimeId"
      );

    if (runtimeId) {
      const participant =
        await getParticipantRuntime(
          pool,
          String(meeting.id),
          runtimeId
        );

      if (!participant) {
        return jsonError(
          "Participant runtime was not found.",
          404
        );
      }

      try {
        await meetingEngine.removeParticipant(
          meetingCode,
          participant.runtime_id
        );
      } catch (error) {
        console.error(
          "[MeetingEngine] Failed to remove participant runtime",
          error
        );
      }

      return NextResponse.json({
        ok: true,
        participant,
      });
    }

    const participants =
      await listActiveMeetingParticipants(
        pool,
        String(meeting.id)
      );

    return NextResponse.json({
      ok: true,
      count: participants.length,
      participants,
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
    const { meetingCode } =
      await context.params;

    const {
      pool,
      meeting,
    } = await resolveMeetingRequestContext(
      meetingCode
    );

    const body = await request
      .json()
      .catch(() => ({}));

    const displayName =
      optionalString(body.displayName);

    if (!displayName) {
      return jsonError(
        "A participant display name is required.",
        400
      );
    }

    const participant =
      await joinMeetingParticipant(
        pool,
        String(meeting.id),
        {
          invitationId:
            optionalString(body.invitationId),
          runtimeId:
            optionalString(body.runtimeId),
          clientSessionId:
          optionalString(body.clientSessionId),
          userId:
            optionalString(body.userId),
          displayName,
          email:
            optionalString(body.email),
          role:
            optionalString(body.role) ||
            "participant",
          accessType:
            optionalString(body.accessType) ||
            "general_link",
          preferredLanguage:
            optionalString(
              body.preferredLanguage
            ) || "en",
          cameraEnabled:
            body.cameraEnabled === true,
          microphoneEnabled:
            body.microphoneEnabled === true,
          connectionQuality:
            optionalString(
              body.connectionQuality
            ),
          metadata:
            readMetadata(body.metadata),
          runtimeMetadata:
            readMetadata(
              body.runtimeMetadata
            ),
        }
      );

    try {
      await meetingEngine.ensureMeetingLoaded(meetingCode);

      await meetingEngine.addParticipant(
        meetingCode,
        {
          id: participant.runtime_id,
          displayName:
            participant.display_name ??
            "Participant",
          email:
            participant.email ??
            undefined,
          role: isMeetingParticipantRole(
            participant.participant_role
          )
            ? participant.participant_role
            : "participant",
          status: "connected",
          joinedAt: toIsoString(
            participant.joined_at
          ),
          leftAt: undefined,
          cameraEnabled:
            participant.camera_enabled,
          microphoneEnabled:
            participant.microphone_enabled,
          screenSharing:
            participant.screen_sharing,
          handRaised:
            participant.hand_raised,
          preferredLanguage:
            participant.preferred_language ??
            "en",
          metadata: {
            ...participant.metadata,
            runtimeMetadata:
              participant.runtime_metadata,
            accessType:
              participant.access_type,
            presenceStatus:
              participant.presence_status,
            connectionStatus:
              participant.connection_status,
            connectionQuality:
              participant.connection_quality,
          },
        }
      );
    } catch (error) {
      console.error(
        "[MeetingEngine] Failed to register participant runtime",
        error
      );
    }

    return NextResponse.json(
      {
        ok: true,
        participant,
        runtimeId:
          participant.runtime_id,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return mapError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode } =
      await context.params;

    const {
      pool,
      meeting,
    } = await resolveMeetingRequestContext(
      meetingCode
    );

    const body = await request
      .json()
      .catch(() => ({}));

    const runtimeId =
      optionalString(body.runtimeId);

    if (!runtimeId) {
      return jsonError(
        "runtimeId is required.",
        400
      );
    }

    const action =
      optionalString(body.action) ||
      "heartbeat";

    if (action === "leave") {
      const participant =
        await leaveParticipantRuntime(
          pool,
          String(meeting.id),
          runtimeId
        );

      if (!participant) {
        return jsonError(
          "Participant runtime was not found.",
          404
        );
      }

      return NextResponse.json({
        ok: true,
        action: "left",
        participant,
      });
    }

    const presenceStatus =
      isPresenceStatus(body.presenceStatus)
        ? body.presenceStatus
        : undefined;

    const participant =
      await heartbeatParticipantRuntime(
        pool,
        String(meeting.id),
        runtimeId,
        {
          cameraEnabled:
            typeof body.cameraEnabled ===
            "boolean"
              ? body.cameraEnabled
              : undefined,
          microphoneEnabled:
            typeof body.microphoneEnabled ===
            "boolean"
              ? body.microphoneEnabled
              : undefined,
          screenSharing:
            typeof body.screenSharing ===
            "boolean"
              ? body.screenSharing
              : undefined,
          speaking:
            typeof body.speaking ===
            "boolean"
              ? body.speaking
              : undefined,
          handRaised:
            typeof body.handRaised ===
            "boolean"
              ? body.handRaised
              : undefined,
          presenceStatus,
          connectionStatus:
            optionalString(
              body.connectionStatus
            ) || undefined,
          connectionQuality:
            optionalString(
              body.connectionQuality
            ),
          runtimeMetadata:
            readMetadata(
              body.runtimeMetadata
            ),
        }
      );

    if (!participant) {
      return jsonError(
        "Participant runtime was not found.",
        404
      );
    }

    return NextResponse.json({
      ok: true,
      action: "heartbeat",
      participant,
    });
  } catch (error) {
    return mapError(error);
  }
}
