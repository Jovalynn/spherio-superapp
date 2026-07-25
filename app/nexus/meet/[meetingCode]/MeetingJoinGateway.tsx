"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type InvitationClaims = {
  invitationId?: string;
  tokenId?: string;
  meetingCode?: string;
  role?: string;
  issuedAt?: number;
  expiresAt?: number;
};

type InvitationRecord = {
  id?: string;
  invitee_email?: string | null;
  invitee_display_name?: string | null;
  invited_role?: string | null;
  preferred_language?: string | null;
  invitation_status?: string | null;
  expires_at?: string | null;
  invited_by_display_name?: string | null;
};

type VerificationResponse = {
  ok?: boolean;
  verified?: boolean;
  error?: string;
  status?: string;
  invitation?: InvitationRecord;
};

type MeetingResponse = {
  ok?: boolean;
  error?: string;
  meeting?: Record<string, unknown>;
};

type ParticipantRuntimeResponse = {
  ok?: boolean;
  error?: string;
  runtimeId?: string;
  participant?: {
    id?: string;
    runtime_id?: string;
    display_name?: string | null;
    participant_role?: string | null;
    presence_status?: string | null;
  };
};

const LANGUAGE_OPTIONS = [
  ["en", "English"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["pt", "Portuguese"],
  ["de", "German"],
  ["zh", "Chinese"],
  ["ar", "Arabic"],
  ["hi", "Hindi"],
  ["yo", "Yoruba"],
  ["ha", "Hausa"],
  ["ig", "Igbo"],
  ["pcm", "Nigerian Pidgin"],
  ["sw", "Swahili"],
] as const;

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const remainder = normalized.length % 4;
  const padding =
    remainder === 0 ? "" : "=".repeat(4 - remainder);

  return window.atob(`${normalized}${padding}`);
}

function decodeInvitationClaims(
  token: string
): InvitationClaims | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      decodeBase64Url(parts[1])
    ) as Record<string, unknown>;

    return {
      invitationId:
        typeof payload.invitationId === "string"
          ? payload.invitationId
          : undefined,
      tokenId:
        typeof payload.tokenId === "string"
          ? payload.tokenId
          : undefined,
      meetingCode:
        typeof payload.meetingCode === "string"
          ? payload.meetingCode
          : undefined,
      role:
        typeof payload.role === "string"
          ? payload.role
          : undefined,
      issuedAt:
        typeof payload.issuedAt === "number"
          ? payload.issuedAt
          : undefined,
      expiresAt:
        typeof payload.expiresAt === "number"
          ? payload.expiresAt
          : undefined,
    };
  } catch {
    return null;
  }
}

function meetingTitleFromRecord(
  meeting: Record<string, unknown> | null
) {
  if (!meeting) {
    return "Nexus Teams Meeting";
  }

  const candidate =
    meeting.title ??
    meeting.name ??
    meeting.meeting_title;

  return typeof candidate === "string" &&
    candidate.trim()
    ? candidate
    : "Nexus Teams Meeting";
}

function initialFromName(value: string) {
  const clean = value.trim();

  return clean
    ? clean.slice(0, 1).toUpperCase()
    : "G";
}

export default function MeetingJoinGateway({
  meetingCode,
  token,
}: {
  meetingCode: string;
  token: string;
}) {
  const router = useRouter();

  const videoRef =
    useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const [meeting, setMeeting] =
    useState<Record<string, unknown> | null>(
      null
    );

  const [invitation, setInvitation] =
    useState<InvitationRecord | null>(null);

  const [displayName, setDisplayName] =
    useState("");

  const [preferredLanguage, setPreferredLanguage] =
    useState("en");

  const [cameraEnabled, setCameraEnabled] =
    useState(false);

  const [microphoneEnabled, setMicrophoneEnabled] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [status, setStatus] = useState(
    "Preparing meeting access…"
  );

  const [error, setError] = useState("");

  const claims = useMemo(
    () =>
      token
        ? decodeInvitationClaims(token)
        : null,
    [token]
  );

  const meetingTitle =
    meetingTitleFromRecord(meeting);

  const invitationId =
    claims?.invitationId ?? "";

  async function verifyInvitation(
    action: "viewed" | "accepted" | "joined"
  ) {
    if (!token || !invitationId) {
      throw new Error(
        "This secure invitation link is incomplete."
      );
    }

    const response = await fetch(
      `/api/riomind/meetings/${encodeURIComponent(
        meetingCode
      )}/invitations/${encodeURIComponent(
        invitationId
      )}/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          action,
        }),
      }
    );

    const result =
      (await response.json()) as VerificationResponse;

    if (!response.ok || !result.ok) {
      throw new Error(
        result.error ||
          "Invitation verification failed."
      );
    }

    if (result.invitation) {
      setInvitation(result.invitation);

      if (
        result.invitation.invitee_display_name
      ) {
        setDisplayName((current) =>
          current ||
          result.invitation
            ?.invitee_display_name ||
          ""
        );
      }

      if (
        result.invitation.preferred_language
      ) {
        setPreferredLanguage(
          result.invitation.preferred_language
        );
      }
    }

    return result;
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeGateway() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/riomind/meetings/${encodeURIComponent(
            meetingCode
          )}`,
          {
            cache: "no-store",
          }
        );

        const result =
          (await response.json()) as MeetingResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "The requested meeting could not be found."
          );
        }

        if (!cancelled) {
          setMeeting(result.meeting ?? null);
        }

        if (!token) {
          if (!cancelled) {
            setStatus(
              "General meeting link detected."
            );
          }
          return;
        }

        if (!claims?.invitationId) {
          throw new Error(
            "This invitation link is malformed."
          );
        }

        if (
          claims.meetingCode &&
          claims.meetingCode.toUpperCase() !==
            meetingCode.toUpperCase()
        ) {
          throw new Error(
            "This invitation belongs to another meeting."
          );
        }

        const verification =
          await verifyInvitation("viewed");

        if (!cancelled) {
          setStatus(
            verification.status === "joined"
              ? "Invitation verified. You may re-enter the meeting."
              : "Secure invitation verified."
          );
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to prepare this meeting."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeGateway();

    return () => {
      cancelled = true;
    };
  }, [
    claims?.invitationId,
    claims?.meetingCode,
    meetingCode,
    token,
  ]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  async function replaceMediaStream(
    constraints: MediaStreamConstraints
  ) {
    const nextStream =
      await navigator.mediaDevices.getUserMedia(
        constraints
      );

    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    mediaStreamRef.current = nextStream;

    if (videoRef.current) {
      videoRef.current.srcObject = nextStream;
      await videoRef.current
        .play()
        .catch(() => undefined);
    }

    setCameraEnabled(
      nextStream.getVideoTracks().length > 0
    );

    setMicrophoneEnabled(
      nextStream.getAudioTracks().length > 0
    );
  }

  async function toggleCamera() {
    setError("");

    if (cameraEnabled) {
      const stream = mediaStreamRef.current;

      stream
        ?.getVideoTracks()
        .forEach((track) => track.stop());

      const audioTracks =
        stream?.getAudioTracks().filter(
          (track) => track.readyState === "live"
        ) ?? [];

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraEnabled(false);

      if (audioTracks.length === 0) {
        mediaStreamRef.current = null;
      }

      return;
    }

    try {
      await replaceMediaStream({
        video: true,
        audio: microphoneEnabled,
      });
    } catch {
      setError(
        "Camera permission was not granted or no camera is available."
      );
    }
  }

  async function toggleMicrophone() {
    setError("");

    if (microphoneEnabled) {
      const stream = mediaStreamRef.current;

      stream
        ?.getAudioTracks()
        .forEach((track) => track.stop());

      setMicrophoneEnabled(false);

      const videoTracks =
        stream?.getVideoTracks().filter(
          (track) => track.readyState === "live"
        ) ?? [];

      if (videoTracks.length === 0) {
        mediaStreamRef.current = null;
      }

      return;
    }

    try {
      await replaceMediaStream({
        audio: true,
        video: cameraEnabled,
      });
    } catch {
      setError(
        "Microphone permission was not granted or no microphone is available."
      );
    }
  }

  async function joinMeeting() {
    setJoining(true);
    setError("");

    try {
      if (token) {
        await verifyInvitation("accepted");
        await verifyInvitation("joined");
      }

      const participantName =
        displayName.trim() ||
        invitation?.invitee_display_name ||
        "Guest";

      const participantRole =
        invitation?.invited_role ||
        claims?.role ||
        "participant";

      const invitationId =
        invitation?.id ||
        claims?.invitationId ||
        null;

      const storageKey =
        `nexus-meeting-entry:${meetingCode}`;

      let previousRuntimeId: string | null =
        null;

      try {
        const previousEntry =
          sessionStorage.getItem(storageKey);

        if (previousEntry) {
          const parsed = JSON.parse(
            previousEntry
          ) as {
            runtimeId?: unknown;
          };

          if (
            typeof parsed.runtimeId ===
            "string"
          ) {
            previousRuntimeId =
              parsed.runtimeId;
          }
        }
      } catch {
        previousRuntimeId = null;
      }

      const runtimeResponse = await fetch(
        `/api/riomind/meetings/${encodeURIComponent(
          meetingCode
        )}/participants/runtime`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            runtimeId:
              previousRuntimeId,
            invitationId,
            displayName:
              participantName,
            email:
              invitation?.invitee_email ||
              null,
            role:
              participantRole,
            accessType: token
              ? "secure_invitation"
              : "general_link",
            preferredLanguage,
            cameraEnabled,
            microphoneEnabled,
            connectionQuality:
              navigator.onLine
                ? "online"
                : "offline",
            metadata: {
              source:
                "nexus-join-gateway",
            },
            runtimeMetadata: {
              userAgent:
                navigator.userAgent,
              platform:
                navigator.platform,
              joinedFrom:
                window.location.pathname,
            },
          }),
        }
      );

      const runtimeResult =
        (await runtimeResponse.json()) as
          ParticipantRuntimeResponse;

      if (
        !runtimeResponse.ok ||
        !runtimeResult.ok ||
        !runtimeResult.runtimeId
      ) {
        throw new Error(
          runtimeResult.error ||
            "Unable to establish the participant runtime."
        );
      }

      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          participantId:
            runtimeResult.participant?.id ||
            null,
          runtimeId:
            runtimeResult.runtimeId,
          meetingCode,
          displayName:
            runtimeResult.participant
              ?.display_name ||
            participantName,
          preferredLanguage,
          role:
            runtimeResult.participant
              ?.participant_role ||
            participantRole,
          presenceStatus:
            runtimeResult.participant
              ?.presence_status ||
            "in_meeting",
          cameraEnabled,
          microphoneEnabled,
          invitationId,
          accessType: token
            ? "secure_invitation"
            : "general_link",
          enteredAt:
            new Date().toISOString(),
        })
      );

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      router.push(
        `/nexus/meetings/${encodeURIComponent(
          meetingCode
        )}/v2`
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to join this meeting."
      );

      setJoining(false);
    }
  }

  const effectiveName =
    displayName ||
    invitation?.invitee_display_name ||
    "Guest";

  const expiry =
    invitation?.expires_at ||
    (claims?.expiresAt
      ? new Date(
          claims.expiresAt * 1000
        ).toISOString()
      : null);

  return (
    <main className="min-h-screen bg-[#050b12] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl place-items-center">
        <section className="w-full overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#08111b] shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                RioMind Nexus Teams
              </div>

              <div className="mt-1 text-sm text-slate-400">
                Secure meeting gateway
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300">
              {meetingCode}
            </div>
          </header>

          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <section className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full object-cover transition-opacity ${
                    cameraEnabled
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />

                {!cameraEnabled ? (
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%)]">
                    <div className="text-center">
                      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-3xl font-black text-cyan-100">
                        {initialFromName(
                          effectiveName
                        )}
                      </div>

                      <div className="mt-4 text-sm font-bold text-slate-300">
                        Camera is off
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void toggleMicrophone()
                  }
                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                    microphoneEnabled
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  {microphoneEnabled
                    ? "Microphone on"
                    : "Microphone off"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void toggleCamera()
                  }
                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                    cameraEnabled
                      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  {cameraEnabled
                    ? "Camera on"
                    : "Camera off"}
                </button>
              </div>
            </section>

            <section className="p-6 sm:p-8">
              <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
                You are joining
              </div>

              <h1 className="mt-3 text-3xl font-black leading-tight text-white">
                {meetingTitle}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Review your identity and device settings
                before entering the meeting.
              </p>

              {loading ? (
                <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4 text-sm font-bold text-cyan-100">
                  Verifying meeting access…
                </div>
              ) : null}

              {error ? (
                <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/[0.07] p-4">
                  <div className="font-black text-rose-100">
                    Meeting access notice
                  </div>

                  <p className="mt-2 text-sm leading-6 text-rose-200/80">
                    {error}
                  </p>
                </div>
              ) : null}

              {!loading && !error ? (
                <>
                  <div className="mt-6 grid gap-4">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-400">
                        Display name
                      </span>

                      <input
                        value={displayName}
                        onChange={(event) =>
                          setDisplayName(
                            event.target.value
                          )
                        }
                        placeholder="Your name"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-400">
                        Meeting language
                      </span>

                      <select
                        value={preferredLanguage}
                        onChange={(event) =>
                          setPreferredLanguage(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-[#09131f] px-4 py-3 text-sm text-white outline-none"
                      >
                        {LANGUAGE_OPTIONS.map(
                          ([value, label]) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">
                        Access
                      </span>

                      <span className="font-black text-emerald-200">
                        {token
                          ? "Secure invitation"
                          : "General meeting link"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-slate-400">
                        Role
                      </span>

                      <span className="font-black capitalize text-white">
                        {invitation?.invited_role ||
                          claims?.role ||
                          "participant"}
                      </span>
                    </div>

                    {invitation?.invited_by_display_name ? (
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="text-slate-400">
                          Invited by
                        </span>

                        <span className="font-black text-white">
                          {
                            invitation.invited_by_display_name
                          }
                        </span>
                      </div>
                    ) : null}

                    {expiry ? (
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="text-slate-400">
                          Link expires
                        </span>

                        <span className="text-right font-bold text-slate-200">
                          {new Date(
                            expiry
                          ).toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={joining}
                    onClick={() =>
                      void joinMeeting()
                    }
                    className="mt-6 w-full rounded-2xl bg-indigo-500 px-5 py-4 text-base font-black text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {joining
                      ? "Joining meeting…"
                      : "Join meeting"}
                  </button>

                  <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                    Your selected name, language and
                    device state will be transferred into
                    the Nexus meeting workspace.
                  </p>
                </>
              ) : null}

              {status && !error ? (
                <div className="mt-5 text-center text-xs font-bold text-emerald-300">
                  {status}
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
