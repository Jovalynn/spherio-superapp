import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";

import {
  hashInvitationToken,
  type MeetingInvitationRole,
} from "@/lib/riomind/teams/meeting-invitations";
import {
  normalizeMeetingCode,
} from "@/lib/riomind/teams/meeting-identity";

const INVITATION_TOKEN_VERSION = 1;
const DEFAULT_INVITATION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

export type MeetingInvitationTokenPayload = {
  version: number;
  invitationId: string;
  tokenId: string;
  meetingCode: string;
  role: MeetingInvitationRole;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

export type CreateMeetingInvitationTokenInput = {
  invitationId: string;
  tokenId: string;
  meetingCode: string;
  role?: MeetingInvitationRole;
  expiresAt?: string | Date | number | null;
  ttlSeconds?: number;
};

export type CreatedMeetingInvitationToken = {
  token: string;
  tokenHash: string;
  payload: MeetingInvitationTokenPayload;
};

export type VerifyMeetingInvitationTokenOptions = {
  expectedMeetingCode?: string;
  expectedInvitationId?: string;
  expectedTokenId?: string;
  now?: number;
};

export type VerifiedMeetingInvitationToken = {
  ok: true;
  payload: MeetingInvitationTokenPayload;
  tokenHash: string;
};

export type RejectedMeetingInvitationToken = {
  ok: false;
  error:
    | "missing_secret"
    | "malformed_token"
    | "unsupported_version"
    | "invalid_signature"
    | "invalid_payload"
    | "expired_token"
    | "meeting_mismatch"
    | "invitation_mismatch"
    | "token_id_mismatch";
};

export type MeetingInvitationTokenVerification =
  | VerifiedMeetingInvitationToken
  | RejectedMeetingInvitationToken;

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const paddingLength =
    normalized.length % 4 === 0
      ? 0
      : 4 - (normalized.length % 4);

  return Buffer.from(
    normalized + "=".repeat(paddingLength),
    "base64"
  );
}

function invitationTokenSecret() {
  const secret =
    process.env.RIOMIND_MEETING_INVITATION_SECRET ||
    process.env.RIOMIND_INVITATION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "";

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return secret;
}

function signTokenBody(body: string, secret: string) {
  return createHmac("sha256", secret)
    .update(body, "utf8")
    .digest();
}

function normalizeExpiry(
  expiresAt: CreateMeetingInvitationTokenInput["expiresAt"],
  ttlSeconds: number
) {
  if (typeof expiresAt === "number") {
    return expiresAt > 10_000_000_000
      ? Math.floor(expiresAt / 1000)
      : Math.floor(expiresAt);
  }

  if (expiresAt instanceof Date) {
    return Math.floor(expiresAt.getTime() / 1000);
  }

  if (typeof expiresAt === "string" && expiresAt.trim()) {
    const parsed = new Date(expiresAt);

    if (!Number.isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  return Math.floor(Date.now() / 1000) + ttlSeconds;
}

function isPayloadShape(
  value: unknown
): value is MeetingInvitationTokenPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    payload.version === INVITATION_TOKEN_VERSION &&
    typeof payload.invitationId === "string" &&
    payload.invitationId.length > 0 &&
    typeof payload.tokenId === "string" &&
    payload.tokenId.length > 0 &&
    typeof payload.meetingCode === "string" &&
    payload.meetingCode.length > 0 &&
    typeof payload.role === "string" &&
    payload.role.length > 0 &&
    typeof payload.issuedAt === "number" &&
    Number.isFinite(payload.issuedAt) &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt) &&
    typeof payload.nonce === "string" &&
    payload.nonce.length > 0
  );
}

export function createMeetingInvitationToken(
  input: CreateMeetingInvitationTokenInput
): CreatedMeetingInvitationToken {
  const secret = invitationTokenSecret();

  if (!secret) {
    throw new Error(
      "Meeting invitation token secret is missing or too short. Set RIOMIND_MEETING_INVITATION_SECRET to at least 32 characters."
    );
  }

  const ttlSeconds = Math.max(
    60,
    Math.floor(
      input.ttlSeconds ||
        DEFAULT_INVITATION_TTL_SECONDS
    )
  );

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = normalizeExpiry(
    input.expiresAt,
    ttlSeconds
  );

  if (expiresAt <= issuedAt) {
    throw new Error(
      "Meeting invitation expiry must be in the future."
    );
  }

  const payload: MeetingInvitationTokenPayload = {
    version: INVITATION_TOKEN_VERSION,
    invitationId: String(input.invitationId).trim(),
    tokenId: String(input.tokenId).trim(),
    meetingCode: normalizeMeetingCode(
      input.meetingCode
    ),
    role: input.role || "participant",
    issuedAt,
    expiresAt,
    nonce: encodeBase64Url(randomBytes(16)),
  };

  const header = encodeBase64Url(
    JSON.stringify({
      alg: "HS256",
      typ: "NEXUS-MEETING-INVITE",
      version: INVITATION_TOKEN_VERSION,
    })
  );

  const encodedPayload = encodeBase64Url(
    JSON.stringify(payload)
  );

  const body = `${header}.${encodedPayload}`;
  const signature = encodeBase64Url(
    signTokenBody(body, secret)
  );

  const token = `${body}.${signature}`;

  return {
    token,
    tokenHash: hashInvitationToken(token),
    payload,
  };
}

export function verifyMeetingInvitationToken(
  token: string,
  options: VerifyMeetingInvitationTokenOptions = {}
): MeetingInvitationTokenVerification {
  const secret = invitationTokenSecret();

  if (!secret) {
    return {
      ok: false,
      error: "missing_secret",
    };
  }

  const parts = String(token || "").split(".");

  if (parts.length !== 3) {
    return {
      ok: false,
      error: "malformed_token",
    };
  }

  const [
    encodedHeader,
    encodedPayload,
    encodedSignature,
  ] = parts;

  try {
    const header = JSON.parse(
      decodeBase64Url(encodedHeader).toString("utf8")
    ) as Record<string, unknown>;

    if (
      header.alg !== "HS256" ||
      header.typ !== "NEXUS-MEETING-INVITE" ||
      header.version !== INVITATION_TOKEN_VERSION
    ) {
      return {
        ok: false,
        error: "unsupported_version",
      };
    }

    const body = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = signTokenBody(
      body,
      secret
    );

    const receivedSignature =
      decodeBase64Url(encodedSignature);

    if (
      receivedSignature.length !==
      expectedSignature.length
    ) {
      return {
        ok: false,
        error: "invalid_signature",
      };
    }

    if (
      !timingSafeEqual(
        receivedSignature,
        expectedSignature
      )
    ) {
      return {
        ok: false,
        error: "invalid_signature",
      };
    }

    const payload = JSON.parse(
      decodeBase64Url(encodedPayload).toString(
        "utf8"
      )
    ) as unknown;

    if (!isPayloadShape(payload)) {
      return {
        ok: false,
        error: "invalid_payload",
      };
    }

    const now =
      options.now ??
      Math.floor(Date.now() / 1000);

    if (payload.expiresAt <= now) {
      return {
        ok: false,
        error: "expired_token",
      };
    }

    if (
      options.expectedMeetingCode &&
      normalizeMeetingCode(
        options.expectedMeetingCode
      ) !== payload.meetingCode
    ) {
      return {
        ok: false,
        error: "meeting_mismatch",
      };
    }

    if (
      options.expectedInvitationId &&
      options.expectedInvitationId !==
        payload.invitationId
    ) {
      return {
        ok: false,
        error: "invitation_mismatch",
      };
    }

    if (
      options.expectedTokenId &&
      options.expectedTokenId !== payload.tokenId
    ) {
      return {
        ok: false,
        error: "token_id_mismatch",
      };
    }

    return {
      ok: true,
      payload,
      tokenHash: hashInvitationToken(token),
    };
  } catch {
    return {
      ok: false,
      error: "malformed_token",
    };
  }
}

export function meetingInvitationJoinPath(
  meetingCode: string,
  token: string
) {
  return `/nexus/meet/${encodeURIComponent(
    normalizeMeetingCode(meetingCode)
  )}?t=${encodeURIComponent(token)}`;
}

export function meetingInvitationAbsoluteUrl(
  origin: string,
  meetingCode: string,
  token: string
) {
  const normalizedOrigin = String(origin || "")
    .trim()
    .replace(/\/+$/g, "");

  return `${normalizedOrigin}${meetingInvitationJoinPath(
    meetingCode,
    token
  )}`;
}
