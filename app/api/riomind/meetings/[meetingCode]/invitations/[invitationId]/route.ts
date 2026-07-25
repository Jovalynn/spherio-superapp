import { NextRequest, NextResponse } from "next/server";

import {
  MEETING_INVITATION_ROLES,
  MEETING_INVITATION_STATUSES,
  deleteDraftMeetingInvitation,
  getMeetingInvitationById,
  revokeMeetingInvitation,
  updateMeetingInvitation,
  type MeetingInvitationRecord,
  type MeetingInvitationRole,
  type MeetingInvitationStatus,
  type UpdateMeetingInvitationInput,
} from "@/lib/riomind/teams/meeting-invitations";
import {
  resolveMeetingRequestContext,
} from "@/lib/riomind/teams/meeting-request-context";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    meetingCode: string;
    invitationId: string;
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

function isInvitationRole(
  value: unknown
): value is MeetingInvitationRole {
  return (
    typeof value === "string" &&
    MEETING_INVITATION_ROLES.includes(
      value as MeetingInvitationRole
    )
  );
}

function isInvitationStatus(
  value: unknown
): value is MeetingInvitationStatus {
  return (
    typeof value === "string" &&
    MEETING_INVITATION_STATUSES.includes(
      value as MeetingInvitationStatus
    )
  );
}

function publicInvitation(
  invitation: MeetingInvitationRecord
) {
  const {
    token_hash: _tokenHash,
    ...safeInvitation
  } = invitation;

  return safeInvitation;
}

function nullableString(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || null;
}

function hasAny(
  body: Record<string, unknown>,
  ...keys: string[]
) {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(
      body,
      key
    )
  );
}

async function resolveOwnedInvitation(
  meetingCode: string,
  invitationId: string
) {
  const context =
    await resolveMeetingRequestContext(
      meetingCode
    );

  const invitation =
    await getMeetingInvitationById(
      context.pool,
      invitationId
    );

  if (
    !invitation ||
    invitation.meeting_id !==
      String(context.meeting.id)
  ) {
    throw new Error(
      "Meeting invitation was not found."
    );
  }

  return {
    ...context,
    invitation,
  };
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected meeting invitation error.";

  if (
    message.startsWith("Meeting not found") ||
    message.includes("invitation was not found")
  ) {
    return jsonError(message, 404);
  }

  if (
    message.includes("supported") ||
    message.includes("valid date") ||
    message.includes("future")
  ) {
    return jsonError(message, 400);
  }

  const databaseError = error as {
    code?: string;
  };

  if (databaseError?.code === "23505") {
    return jsonError(
      "An active invitation already exists for this invitee.",
      409
    );
  }

  console.error(
    "[meeting-invitation-record-api]",
    error
  );

  return jsonError(
    "Meeting invitation record request failed.",
    500
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      meetingCode,
      invitationId,
    } = await context.params;

    const {
      pool,
      meeting,
      invitation,
    } = await resolveOwnedInvitation(
      meetingCode,
      invitationId
    );

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "A valid JSON request body is required.",
        400
      );
    }

    const requestedStatus =
      body.status ??
      body.invitationStatus ??
      body.invitation_status;

    if (
      requestedStatus !== undefined &&
      !isInvitationStatus(requestedStatus)
    ) {
      return jsonError(
        "Unsupported invitation status.",
        400,
        {
          allowed: MEETING_INVITATION_STATUSES,
        }
      );
    }

    const requestedRole =
      body.invitedRole ??
      body.invited_role ??
      body.role;

    if (
      requestedRole !== undefined &&
      !isInvitationRole(requestedRole)
    ) {
      return jsonError(
        "Unsupported invitation role.",
        400,
        {
          allowed: MEETING_INVITATION_ROLES,
        }
      );
    }

    const update: UpdateMeetingInvitationInput = {};

    if (isInvitationStatus(requestedStatus)) {
      update.status = requestedStatus;
    }

    if (isInvitationRole(requestedRole)) {
      update.invitedRole = requestedRole;
    }

    if (
      hasAny(
        body,
        "inviteeUserId",
        "invitee_user_id"
      )
    ) {
      update.inviteeUserId = nullableString(
        body.inviteeUserId ??
          body.invitee_user_id
      ) ?? null;
    }

    if (
      hasAny(
        body,
        "inviteeEmail",
        "invitee_email"
      )
    ) {
      update.inviteeEmail = nullableString(
        body.inviteeEmail ??
          body.invitee_email
      ) ?? null;
    }

    if (
      hasAny(
        body,
        "inviteeDisplayName",
        "invitee_display_name"
      )
    ) {
      update.inviteeDisplayName =
        nullableString(
          body.inviteeDisplayName ??
            body.invitee_display_name
        ) ?? null;
    }

    if (
      hasAny(
        body,
        "preferredLanguage",
        "preferred_language"
      )
    ) {
      update.preferredLanguage =
        nullableString(
          body.preferredLanguage ??
            body.preferred_language
        ) ?? null;
    }

    if (
      hasAny(
        body,
        "translationLanguage",
        "translation_language"
      )
    ) {
      update.translationLanguage =
        nullableString(
          body.translationLanguage ??
            body.translation_language
        ) ?? null;
    }

    if (
      hasAny(
        body,
        "expiresAt",
        "expires_at"
      )
    ) {
      const rawExpiry =
        body.expiresAt ?? body.expires_at;

      if (
        rawExpiry === null ||
        rawExpiry === ""
      ) {
        update.expiresAt = null;
      } else {
        const expiry = new Date(
          String(rawExpiry)
        );

        if (Number.isNaN(expiry.getTime())) {
          return jsonError(
            "expiresAt must be a valid date.",
            400
          );
        }

        if (expiry.getTime() <= Date.now()) {
          return jsonError(
            "expiresAt must be in the future.",
            400
          );
        }

        update.expiresAt = expiry;
      }
    }

    if (
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
    ) {
      update.metadata =
        body.metadata as Record<string, unknown>;
    }

    const updated =
      await updateMeetingInvitation(
        pool,
        invitation.id,
        update
      );

    if (!updated) {
      return jsonError(
        "Meeting invitation was not found.",
        404
      );
    }

    return NextResponse.json({
      ok: true,
      updated: true,
      mode: "persistent",
      meetingId: meeting.id,
      meetingCode:
        updated.meeting_code ||
        invitation.meeting_code,
      invitation: publicInvitation(updated),
    });
  } catch (error) {
    return mapError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      meetingCode,
      invitationId,
    } = await context.params;

    const {
      pool,
      meeting,
      invitation,
      meetingCode: normalizedMeetingCode,
    } = await resolveOwnedInvitation(
      meetingCode,
      invitationId
    );

    if (invitation.invitation_status === "draft") {
      const deleted =
        await deleteDraftMeetingInvitation(
          pool,
          invitation.id
        );

      return NextResponse.json({
        ok: true,
        deleted,
        revoked: false,
        meetingId: meeting.id,
        meetingCode: normalizedMeetingCode,
        invitationId: invitation.id,
      });
    }

    const body = await request
      .json()
      .catch(() => ({})) as Record<
        string,
        unknown
      >;

    const revoked =
      await revokeMeetingInvitation(
        pool,
        invitation.id,
        {
          revokeReason:
            typeof body.reason === "string"
              ? body.reason.trim()
              : null,
          revokedThrough: "invitation-api",
        }
      );

    if (!revoked) {
      return jsonError(
        "Meeting invitation was not found.",
        404
      );
    }

    return NextResponse.json({
      ok: true,
      deleted: false,
      revoked: true,
      meetingId: meeting.id,
      meetingCode: normalizedMeetingCode,
      invitation: publicInvitation(revoked),
    });
  } catch (error) {
    return mapError(error);
  }
}
