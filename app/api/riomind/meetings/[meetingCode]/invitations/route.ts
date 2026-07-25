import { NextRequest, NextResponse } from "next/server";

import {
  MEETING_INVITATION_ROLES,
  createInvitationTokenId,
  createMeetingInvitation,
  deleteDraftMeetingInvitation,
  expireStaleMeetingInvitations,
  hashInvitationToken,
  listMeetingInvitations,
  updateMeetingInvitation,
  type MeetingInvitationRecord,
  type MeetingInvitationRole,
} from "@/lib/riomind/teams/meeting-invitations";
import {
  createMeetingInvitationToken,
  meetingInvitationJoinPath,
} from "@/lib/riomind/teams/meeting-invitation-tokens";
import {
  resolveMeetingRequestContext,
} from "@/lib/riomind/teams/meeting-request-context";

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

function nullableString(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
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

function publicInvitation(
  invitation: MeetingInvitationRecord
) {
  const {
    token_hash: _tokenHash,
    ...safeInvitation
  } = invitation;

  return safeInvitation;
}

function resolveExpiry(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );
  }

  const expiry = new Date(String(value));

  if (Number.isNaN(expiry.getTime())) {
    throw new Error(
      "expiresAt must be a valid date."
    );
  }

  if (expiry.getTime() <= Date.now()) {
    throw new Error(
      "expiresAt must be in the future."
    );
  }

  return expiry;
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected meeting invitation error.";

  if (message.startsWith("Meeting not found")) {
    return jsonError(message, 404);
  }

  if (
    message.includes("required") ||
    message.includes("supported") ||
    message.includes("valid date") ||
    message.includes("future") ||
    message.includes("missing or too short")
  ) {
    return jsonError(message, 400);
  }

  const databaseError = error as {
    code?: string;
    constraint?: string;
  };

  if (databaseError?.code === "23505") {
    return jsonError(
      "An active invitation already exists for this invitee.",
      409,
      {
        constraint: databaseError.constraint || null,
      }
    );
  }

  console.error("[meeting-invitations-api]", error);

  return jsonError(
    "Meeting invitation request failed.",
    500
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { meetingCode: rawMeetingCode } =
      await context.params;

    const {
      pool,
      meeting,
      meetingCode,
    } = await resolveMeetingRequestContext(
      rawMeetingCode
    );

    await expireStaleMeetingInvitations(
      pool,
      String(meeting.id)
    );

    const invitations =
      await listMeetingInvitations(
        pool,
        String(meeting.id)
      );

    return NextResponse.json({
      ok: true,
      mode: "persistent",
      meetingId: meeting.id,
      meetingCode,
      count: invitations.length,
      invitations: invitations.map(
        publicInvitation
      ),
    });
  } catch (error) {
    return mapError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  let createdDraftId: string | null = null;

  try {
    const { meetingCode: rawMeetingCode } =
      await context.params;

    const {
      pool,
      meeting,
      meetingCode,
    } = await resolveMeetingRequestContext(
      rawMeetingCode
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

    const invitedRole =
      body.invitedRole ??
      body.invited_role ??
      body.role ??
      "participant";

    if (!isInvitationRole(invitedRole)) {
      return jsonError(
        "A supported invitation role is required.",
        400,
        {
          allowed: MEETING_INVITATION_ROLES,
        }
      );
    }

    const expiresAt = resolveExpiry(
      body.expiresAt ?? body.expires_at
    );

    const inviteeEmail = nullableString(
      body.inviteeEmail ?? body.invitee_email
    );

    const inviteeUserId = nullableString(
      body.inviteeUserId ?? body.invitee_user_id
    );

    const inviteeDisplayName = nullableString(
      body.inviteeDisplayName ??
        body.invitee_display_name
    );

    const tokenId = createInvitationTokenId();

    /*
     * createMeetingInvitation currently requires a token
     * hash before the signed token can include the generated
     * invitation ID. We therefore create a draft with a
     * non-reusable placeholder hash and immediately replace
     * it with the real signed-token hash.
     */
    const placeholderHash = hashInvitationToken(
      `${tokenId}:pending:${Date.now()}`
    );

    const draft = await createMeetingInvitation(
      pool,
      {
        meetingId: String(meeting.id),
        teamId:
          nullableString(
            body.teamId ?? body.team_id
          ) ??
          (typeof meeting.team_id === "string"
            ? meeting.team_id
            : null),

        inviteeUserId,
        inviteeEmail,
        inviteeDisplayName,

        invitedRole,
        accessScope:
          nullableString(
            body.accessScope ?? body.access_scope
          ) || "meeting",

        tokenId,
        tokenHash: placeholderHash,
        status: "draft",

        invitedByUserId: nullableString(
          body.invitedByUserId ??
            body.invited_by_user_id
        ),

        invitedByDisplayName: nullableString(
          body.invitedByDisplayName ??
            body.invited_by_display_name
        ),

        preferredLanguage: nullableString(
          body.preferredLanguage ??
            body.preferred_language
        ),

        translationLanguage: nullableString(
          body.translationLanguage ??
            body.translation_language
        ),

        expiresAt,
        metadata: readMetadata(body.metadata),
      }
    );

    createdDraftId = draft.id;

    const signed =
      createMeetingInvitationToken({
        invitationId: draft.id,
        tokenId,
        meetingCode,
        role: invitedRole,
        expiresAt,
      });

    const invitation =
      await updateMeetingInvitation(
        pool,
        draft.id,
        {
          status: "sent",
          tokenHash: signed.tokenHash,
          expiresAt,
          metadata: {
            tokenVersion: signed.payload.version,
            tokenIssuedAt: new Date(
              signed.payload.issuedAt * 1000
            ).toISOString(),
          },
        }
      );

    if (!invitation) {
      throw new Error(
        "Invitation could not be finalized."
      );
    }

    createdDraftId = null;

    return NextResponse.json(
      {
        ok: true,
        created: true,
        mode: "persistent",
        meetingId: meeting.id,
        meetingCode,
        invitation: publicInvitation(invitation),
        token: signed.token,
        joinPath: meetingInvitationJoinPath(
          meetingCode,
          signed.token
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    if (createdDraftId) {
      try {
        const { meetingCode: rawMeetingCode } =
          await context.params;

        const { pool } =
          await resolveMeetingRequestContext(
            rawMeetingCode
          );

        await deleteDraftMeetingInvitation(
          pool,
          createdDraftId
        );
      } catch (cleanupError) {
        console.error(
          "[meeting-invitations-api-cleanup]",
          cleanupError
        );
      }
    }

    return mapError(error);
  }
}
