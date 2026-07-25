import {
  createHash,
  timingSafeEqual,
} from "crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  getMeetingInvitationById,
  updateMeetingInvitation,
  type MeetingInvitationRecord,
  type MeetingInvitationStatus,
} from "@/lib/riomind/teams/meeting-invitations";
import {
  verifyMeetingInvitationToken,
} from "@/lib/riomind/teams/meeting-invitation-tokens";
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

const VERIFY_ACTION_STATUSES = {
  view: "viewed",
  viewed: "viewed",
  accept: "accepted",
  accepted: "accepted",
  decline: "declined",
  declined: "declined",
  join: "joined",
  joined: "joined",
  leave: "left",
  left: "left",
} as const;

type VerifyAction =
  keyof typeof VERIFY_ACTION_STATUSES;

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

function publicInvitation(
  invitation: MeetingInvitationRecord
) {
  const {
    token_hash: _tokenHash,
    ...safeInvitation
  } = invitation;

  return safeInvitation;
}

function secureHashEqual(
  left: string,
  right: string
) {
  const leftDigest = createHash("sha256")
    .update(left, "utf8")
    .digest();

  const rightDigest = createHash("sha256")
    .update(right, "utf8")
    .digest();

  return timingSafeEqual(
    leftDigest,
    rightDigest
  );
}

function requestIpHash(request: NextRequest) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  const address =
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    "";

  if (!address) {
    return null;
  }

  return createHash("sha256")
    .update(address, "utf8")
    .digest("hex");
}

function mapTokenError(error: string) {
  switch (error) {
    case "expired_token":
      return jsonError(
        "This meeting invitation has expired.",
        410
      );

    case "meeting_mismatch":
    case "invitation_mismatch":
    case "token_id_mismatch":
      return jsonError(
        "The invitation token does not belong to this meeting invitation.",
        403
      );

    case "invalid_signature":
    case "malformed_token":
    case "invalid_payload":
    case "unsupported_version":
      return jsonError(
        "The meeting invitation token is invalid.",
        401
      );

    case "missing_secret":
      return jsonError(
        "Meeting invitation verification is unavailable.",
        503
      );

    default:
      return jsonError(
        "Meeting invitation verification failed.",
        401
      );
  }
}

function mapError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected meeting invitation verification error.";

  if (message.startsWith("Meeting not found")) {
    return jsonError(message, 404);
  }

  console.error(
    "[meeting-invitation-verify-api]",
    error
  );

  return jsonError(
    "Meeting invitation verification failed.",
    500
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      meetingCode: rawMeetingCode,
      invitationId,
    } = await context.params;

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

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    if (!token) {
      return jsonError(
        "An invitation token is required.",
        400
      );
    }

    const invitation =
      await getMeetingInvitationById(
        pool,
        invitationId
      );

    if (
      !invitation ||
      invitation.meeting_id !==
        String(meeting.id)
    ) {
      return jsonError(
        "Meeting invitation was not found.",
        404
      );
    }

    if (
      invitation.invitation_status === "revoked"
    ) {
      return jsonError(
        "This meeting invitation has been revoked.",
        410
      );
    }

    if (
      invitation.invitation_status === "expired"
    ) {
      return jsonError(
        "This meeting invitation has expired.",
        410
      );
    }

    if (
      invitation.expires_at &&
      new Date(invitation.expires_at).getTime() <=
        Date.now()
    ) {
      await updateMeetingInvitation(
        pool,
        invitation.id,
        {
          status: "expired",
        }
      );

      return jsonError(
        "This meeting invitation has expired.",
        410
      );
    }

    const verification =
      verifyMeetingInvitationToken(
        token,
        {
          expectedMeetingCode: meetingCode,
          expectedInvitationId:
            invitation.id,
          expectedTokenId:
            invitation.token_id,
        }
      );

    if (!verification.ok) {
      return mapTokenError(
        verification.error
      );
    }

    if (
      !secureHashEqual(
        verification.tokenHash,
        invitation.token_hash
      )
    ) {
      return jsonError(
        "The invitation token is no longer valid.",
        401
      );
    }

    const rawAction =
      typeof body.action === "string"
        ? body.action.trim().toLowerCase()
        : "viewed";

    if (
      !Object.prototype.hasOwnProperty.call(
        VERIFY_ACTION_STATUSES,
        rawAction
      )
    ) {
      return jsonError(
        "Unsupported invitation verification action.",
        400,
        {
          allowed: Object.keys(
            VERIFY_ACTION_STATUSES
          ),
        }
      );
    }

    const targetStatus =
      VERIFY_ACTION_STATUSES[
        rawAction as VerifyAction
      ] as MeetingInvitationStatus;

    if (
      invitation.invitation_status ===
        "declined" &&
      targetStatus !== "declined"
    ) {
      return jsonError(
        "This meeting invitation was declined.",
        409
      );
    }

    if (
      invitation.invitation_status ===
        "left" &&
      targetStatus !== "left"
    ) {
      return jsonError(
        "This meeting invitation is no longer active.",
        409
      );
    }

    const updated =
      await updateMeetingInvitation(
        pool,
        invitation.id,
        {
          status: targetStatus,
          lastIpHash: requestIpHash(request),
          lastUserAgent:
            request.headers
              .get("user-agent")
              ?.slice(0, 1000) || null,
          metadata: {
            lastVerifiedAt:
              new Date().toISOString(),
            lastVerificationAction:
              rawAction,
          },
        }
      );

    if (!updated) {
      return jsonError(
        "Meeting invitation was not found.",
        404
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      mode: "persistent",
      action: rawAction,
      status: updated.invitation_status,
      meetingId: meeting.id,
      meetingCode,
      invitation: publicInvitation(updated),
      claims: {
        invitationId:
          verification.payload.invitationId,
        tokenId:
          verification.payload.tokenId,
        meetingCode:
          verification.payload.meetingCode,
        role:
          verification.payload.role,
        issuedAt:
          verification.payload.issuedAt,
        expiresAt:
          verification.payload.expiresAt,
      },
    });
  } catch (error) {
    return mapError(error);
  }
}
