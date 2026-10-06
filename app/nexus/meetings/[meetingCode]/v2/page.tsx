"use client";

import SimpleMeetingShell, {
  type MeetingSurface,
  type ShareTarget,
} from "./modules/meeting/SimpleMeetingShell";

import NexusTeamsLiveIntelligencePanel from "@/components/nexus/teams/NexusTeamsLiveIntelligencePanel";
import { MeetingToolbar } from "./modules/toolbar";
import { MeetingStage } from "./modules/stage";
import {
   VoiceWorkspace,
} from "./modules/workspace/voice";
import LiveVoiceRuntime, {
  type LiveVoiceStatus,
  type LiveVoiceTranscript,
} from "./modules/voice/LiveVoiceRuntime";
import {
  ChatWorkspace,
} from "./modules/workspace/chat";
import {
  ParticipantsWorkspace,
} from "./modules/workspace/participants";
import {
  FilesWorkspace,
} from "./modules/workspace/files";
import {
  WorkspaceNavigation,
} from "./modules/workspace/navigation";
import type {
  WorkspaceId,
} from "./modules/workspace/navigation";
import {
  NotesWorkspace,
} from "./modules/workspace/notes";
import {
  DocumentsWorkspace,
} from "./modules/workspace/documents";
import {
  WhiteboardWorkspace,
} from "./modules/workspace/whiteboard";
import {
  TasksWorkspace,
} from "./modules/workspace/tasks";
import {
  PollsWorkspace,
} from "./modules/workspace/polls";
import {
  AppsWorkspace,
} from "./modules/workspace/apps";
import {
  buildStage,
} from "@/lib/riomind/meetings/stage-engine";
import { StageHeader } from "./modules/stage/header";
import { LobbyStage } from "./modules/stage/lobby";
import { ParticipantTile } from "./modules/stage/participants";
import { ParticipantMenu } from "./modules/stage/participants/menu";
import { ParticipantHeaderBadges } from "./modules/stage/participants/header-badges";
import { ParticipantIdentity } from "./modules/stage/participants/identity";
import { ParticipantAvatar } from "./modules/stage/participants/avatar";
import { ParticipantStatusBadges } from "./modules/stage/participants/status-badges";

import {
  PRIMARY_TOOLBAR_BUTTONS,
} from "@/lib/riomind/teams/modules/toolbar";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useMeetingPresence } from "@/hooks/useMeetingPresence";
import { useParams } from "next/navigation";
import NexusIntelligenceCenter from "@/components/nexus/intelligence/NexusIntelligenceCenter";
import TeamIntelligenceWorkspace from "@/components/nexus/teams/TeamIntelligenceWorkspace";
import {
  detectMeetingIntelligence,
  type MeetingDetection,
} from "@/lib/riomind/meeting-assistant/detector";

const NEXUS_LOGO_URL =
  "https://raw.githubusercontent.com/Lerivee/Nexus-logo/refs/heads/main/0ae5a7d5-8b81-4085-b7cf-50699dd2aa56.jpeg";

const MEETING_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ur", label: "Urdu" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "tr", label: "Turkish" },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "sw", label: "Swahili" },
  { code: "yo", label: "Yoruba" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "pcm", label: "Nigerian Pidgin" },
];

function languageLabel(code: string) {
  return MEETING_LANGUAGES.find((item) => item.code === code)?.label || code?.toUpperCase?.() || "English";
}


function NexusLogo({ compact = false }: { compact?: boolean }) {


  return (
    <div className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
      <img
        src={NEXUS_LOGO_URL}
        alt="Nexus Teams"
        className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-2xl object-cover shadow-[0_0_30px_rgba(99,102,241,0.45)]`}
      />
      {!compact ? (
        <div>
          <div className="text-xl font-black tracking-[0.18em] text-white">NEXUS</div>
          <div className="-mt-1 text-xs font-bold tracking-[0.45em] text-cyan-200">TEAMS</div>
        </div>
      ) : null}
    </div>
  );
}

function initials(name = "Guest") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("") || "G";
}

async function safeJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function MoreToolShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[430px] border-l border-white/10 bg-[#0a111a] p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2">
          Close
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function NexusTeamsV2Page() {
  const params = useParams();
  const meetingCode = String(params?.meetingCode || "");

  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [rightPanel, setRightPanel] = useState<
    "notes" | "files" | null
  >(null);
  const [
    bottomPanel,
    setBottomPanel,
  ] = useState<WorkspaceId>("voice");
  const [appView, setAppView] = useState<"meeting" | "calendar">("meeting");
  const [stageMode, setStageMode] = useState<
    "participants" | "presentation"
  >("participants");

  const [stageView, setStageView] = useState<
    "lobby" | "grid" | "presentation"
  >("grid");

  const [peopleDrawerOpen, setPeopleDrawerOpen] = useState(false);
  const [moreToolPanel, setMoreToolPanel] = useState<null | string>(null);

  const [toolActionStatus, setToolActionStatus] = useState("");
  const [activityOutcome, setActivityOutcome] = useState<Record<string, string>>({});
  const [callOutcome, setCallOutcome] = useState<Record<string, string>>({});
  const [lastLaunchedApp, setLastLaunchedApp] = useState("");
  const [participantControlState, setParticipantControlState] = useState<
    Record<
      string,
      {
        mic?: string;
        speaking?: boolean;
        hand?: boolean;
        handRaisedAt?: number;
        language?: string;
        role?: string;
        removed?: boolean;
        pinned?: boolean;
        spotlighted?: boolean;
        cameraEnabled?: boolean;
        screenSharing?: boolean;
        inLobby?: boolean;
        avatarUrl?: string;
      }
    >
  >({});
  const [openParticipantMenu, setOpenParticipantMenu] = useState<string | null>(null);

  const [meetingLifecycleDialog, setMeetingLifecycleDialog] = useState<
    | null
    | "leave"
    | "end"
    | "lock"
    | "unlock"
    | "record-start"
    | "record-stop"
    | "transfer-host"
    | "recording-consent"
    | "request-host"
    | "review-host-request"
    | "owner-recovery"
  >(null);

  const [meetingEnded, setMeetingEnded] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);

  const [meetingCategory, setMeetingCategory] = useState<
    | "private"
    | "internal"
    | "interview"
    | "training"
    | "webinar"
    | "public-broadcast"
    | "sensitive"
  >("internal");

  const [recordingPolicy, setRecordingPolicy] = useState<
    | "all_explicit_consent"
    | "acknowledge_or_leave"
    | "organization_authorized"
    | "recording_disabled"
  >("all_explicit_consent");

  const [recordingConsentRequested, setRecordingConsentRequested] = useState(false);

  const [recordingConsentState, setRecordingConsentState] = useState<
    Record<
      string,
      {
        status: "pending" | "agreed" | "declined" | "left" | "exempt";
        respondedAt?: string;
      }
    >
  >({});

  const [recordingConsentNoticeOpen, setRecordingConsentNoticeOpen] = useState(false);
  const [recordingConsentViewer, setRecordingConsentViewer] = useState("");

  const [transferHostTarget, setTransferHostTarget] = useState("");
  const [hostTransferMode, setHostTransferMode] = useState<
    "complete-transfer" | "make-cohost"
  >("complete-transfer");

  const meetingOwnerName = "John";

  const [hostControlRequest, setHostControlRequest] = useState<{
    requester: string;
    requestedAt: string;
    status: "pending" | "approved-host" | "approved-cohost" | "declined";
  } | null>(null);

  const [meetingLifecycleStatus, setMeetingLifecycleStatus] = useState("");

  const [reportAbuseOpen, setReportAbuseOpen] = useState(false);
  const [reportedParticipantName, setReportedParticipantName] = useState("");
  const [reportAbuseType, setReportAbuseType] = useState("");
  const [reportAbuseDescription, setReportAbuseDescription] = useState("");
  const [reportIncludeClip, setReportIncludeClip] = useState(false);
  const [reportIncludeTranscript, setReportIncludeTranscript] = useState(false);
  const [reportIncludeScreenshot, setReportIncludeScreenshot] = useState(false);
  const [reportIncludeSharedFile, setReportIncludeSharedFile] = useState(false);
  const [reportStatus, setReportStatus] = useState("");

  const [privateChatTarget, setPrivateChatTarget] = useState("");
  const [privateChatOpen, setPrivateChatOpen] = useState(false);
  const [privateChatDraft, setPrivateChatDraft] = useState("");
  const [privateChatStatus, setPrivateChatStatus] = useState("");

  const [privateChatMessages, setPrivateChatMessages] = useState<
    Array<{
      id: string;
      sender: string;
      recipient: string;
      body: string;
      time: string;
    }>
  >([]);

  const [profileViewerName, setProfileViewerName] = useState("");

  type MeetingIntelligenceRecord = {
    id: string;
    type?: "decision" | "action" | "risk" | "question" | "commitment";
    title: string;
    detail: string;
    speaker?: string;
    owner?: string;
    due?: string;
    confidence?: number;
    status: "detected" | "accepted" | "resolved" | "dismissed";
    createdAt: string;
    updatedAt?: string;
    resolvedAt?: string;
    meetingId?: string;
    participantId?: string;
    sourceType?: "chat" | "transcript" | "seed";
    sourceId?: string;
    sourceText?: string;
    detectedBy?: "rules" | "riomind-core" | "manual" | "seed";
    tags?: string[];
  };


function mapPersistentMeetingIntelligenceRecord(
  record: any
): MeetingIntelligenceRecord {
  const status = String(record?.status || "detected");

  return {
    id: String(record?.id || `${record?.intelligence_type || "insight"}-${record?.detected_at || Date.now()}`),
    type: record?.intelligence_type,
    title: String(record?.title || "Meeting intelligence"),
    detail: String(record?.detail || ""),
    speaker: record?.speaker_name || undefined,
    owner: record?.owner_name || undefined,
    due: record?.due_at || undefined,
    confidence:
      typeof record?.confidence === "number"
        ? record.confidence
        : undefined,
    status:
      status === "accepted"
        ? "accepted"
        : status === "resolved" ||
          status === "completed" ||
          status === "answered"
        ? "resolved"
        : status === "dismissed" || status === "archived"
        ? "dismissed"
        : "detected",
    createdAt: String(
      record?.detected_at ||
        record?.created_at ||
        new Date().toISOString()
    ),
    updatedAt: record?.updated_at || undefined,
    resolvedAt: record?.resolved_at || undefined,
    meetingId: record?.meeting_id || undefined,
    participantId: record?.participant_id || undefined,
    sourceType:
      record?.source_type === "chat" ||
      record?.source_type === "transcript"
        ? record.source_type
        : undefined,
    sourceId: record?.source_id || undefined,
    sourceText: record?.source_text || undefined,
    detectedBy:
      record?.detected_by === "rules" ||
      record?.detected_by === "manual" ||
      record?.detected_by === "seed"
        ? record.detected_by
        : "riomind-core",
    tags: Array.isArray(record?.tags) ? record.tags : [],
  };
}


  const [assistantSection, setAssistantSection] = useState<
    "summary" | "decisions" | "actions" | "risks" | "questions"
  >("summary");

  const [aiWorkspaceSection, setAiWorkspaceSection] = useState<
    | "summary"
    | "decisions"
    | "actions"
    | "risks"
    | "questions"
    | "commitments"
    | "timeline"
    | "ask"
  >("summary");

  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantThinking, setAssistantThinking] = useState(false);

  const [assistantConversation, setAssistantConversation] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      body: string;
      time: string;
    }>
  >([]);

  const [liveMeetingSummary, setLiveMeetingSummary] = useState(
    "No canonical live summary has been generated yet. Nexus will update this as permitted meeting activity is detected."
  );

  const [detectedDecisions, setDetectedDecisions] = useState<
    MeetingIntelligenceRecord[]
  >([]);

  const [detectedActions, setDetectedActions] = useState<
    MeetingIntelligenceRecord[]
  >([]);

  const [detectedRisks, setDetectedRisks] = useState<
    MeetingIntelligenceRecord[]
  >([]);

  const [openMeetingQuestions, setOpenMeetingQuestions] = useState<
    MeetingIntelligenceRecord[]
  >([]);

  const [assistantSuggestions, setAssistantSuggestions] =
    useState<
      Array<{
        id: string;
        title: string;
        detail: string;
        action: string;
        kind: string;
        dismissed: boolean;
      }>
    >([]);

  const [assistantNotice, setAssistantNotice] = useState("");

  const [expandedChatMessageIds, setExpandedChatMessageIds] = useState<
    Set<string>
  >(new Set());

  const [assistantViewAll, setAssistantViewAll] = useState<
    null | "decisions" | "actions" | "risks" | "questions"
  >(null);

  const [assistantAskOpen, setAssistantAskOpen] = useState(false);
  const [assistantSuggestionsOpen, setAssistantSuggestionsOpen] =
    useState(false);

  const [detectedCommitments, setDetectedCommitments] = useState<
    MeetingIntelligenceRecord[]
  >([]);

  const [intelligenceSyncStatus, setIntelligenceSyncStatus] =
    useState<"syncing" | "synced" | "error">("syncing");

  const [intelligenceTimeline, setIntelligenceTimeline] = useState<
    Array<{
      id: string;
      type: string;
      sourceType: string;
      speaker?: string;
      title: string;
      detectedAt: string;
    }>
  >([]);

  const processedChatIntelligenceIds = useRef<Set<string>>(
    new Set(["m1", "m2", "m3"])
  );

  const processedTranscriptIntelligenceIds = useRef<Set<string>>(
    new Set()
  );

  /*
   * C3.2A.1c — canonical intelligence session boundary.
   *
   * Existing chat/transcript history is registered as historical
   * during hydration. Only contributions arriving after this
   * browser session becomes ready may create live intelligence.
   */
  const intelligenceSessionStartedAt = useRef(Date.now());
  const intelligenceSessionReady = useRef(false);
  const intelligenceHydrationTimer = useRef<number | null>(null);

  const [meetingAuditEvents, setMeetingAuditEvents] = useState<
    Array<{
      id: string;
      action: string;
      actor: string;
      target?: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }>
  >([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatActionStatus, setChatActionStatus] = useState("");
  const [meetingChatMessages, setMeetingChatMessages] = useState([
    { id: "m1", sender: "John", role: "Host", time: "09:42", language: "en", body: "Welcome everyone. We are preparing the meeting room." },
    { id: "m2", sender: "Sarah", role: "Participant", time: "09:43", language: "fr", body: "Bonjour John, I can hear the room." },
    { id: "m3", sender: "Nexus AI", role: "Assistant", time: "09:44", language: "system", body: "Live chat is ready. I can summarize decisions and action items." },
  ]);
  const [meetingVoiceMode, setMeetingVoiceMode] = useState<"open" | "moderated" | "presentation" | "broadcast">("moderated");
  const [roomHardMuted, setRoomHardMuted] = useState(false);



  const [liveParticipants, setLiveParticipants] =
    useState<any[]>([]);

  useEffect(() => {
    if (!meetingCode) return;

    let cancelled = false;

    async function loadParticipants() {
      try {
        const response = await fetch(
          `/api/riomind/meetings/${meetingCode}/participants/runtime`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const json = await response.json();

        if (cancelled) return;

        if (Array.isArray(json?.participants) && json.participants.length > 0) {
          setLiveParticipants(
            json.participants.map((participant: any) => ({
              name:
                participant.participant_role === "owner"
                  ? meeting?.owner_display_name ||
                    participant.display_name ||
                    "Owner"
                  : participant.display_name ||
                    participant.user_id ||
                    "Participant",

              role:
                participant.participant_role ||
                participant.role ||
                "participant",

              status:
                participant.presence_status || "online",

              language:
                participant.preferred_language || "en",

              mic:
                participant.microphone_enabled
                  ? "live"
                  : "muted",

              speaking:
                Boolean(participant.speaking),

              hand:
                Boolean(participant.hand_raised),

              handRaisedAt:
                participant.hand_raised
                  ? Date.now()
                  : undefined,
            }))
          );
        }
      } catch (error) {
        console.error(
          "[runtime-participants]",
          error
        );
      }
    }

    loadParticipants();

    const timer = window.setInterval(
      loadParticipants,
      3000
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [meetingCode]);

  const speakingParticipant = liveParticipants.find((participant) => participant.speaking);
  const languageModeLabel = speakingParticipant ? "Speaking..." : "Listening...";


  useEffect(() => {
    if (!meetingCode) return;

    let cancelled = false;
    let summaryLoaded = false;

    async function syncPersistentIntelligence() {
      try {
        setIntelligenceSyncStatus("syncing");

        const response = await fetch(
          `/api/riomind/meetings/${encodeURIComponent(meetingCode)}/intelligence?limit=500`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Persistent meeting intelligence request failed.");
        }

        const payload = await response.json();
        const records: MeetingIntelligenceRecord[] =
          Array.isArray(payload?.records)
            ? payload.records.map(mapPersistentMeetingIntelligenceRecord)
            : [];

        if (cancelled) return;

        setDetectedDecisions(
          records.filter((record) => record.type === "decision")
        );
        setDetectedActions(
          records.filter((record) => record.type === "action")
        );
        setDetectedRisks(
          records.filter((record) => record.type === "risk")
        );
        setOpenMeetingQuestions(
          records.filter((record) => record.type === "question")
        );
        setDetectedCommitments(
          records.filter((record) => record.type === "commitment")
        );

        setIntelligenceTimeline(
          records
            .map((record) => ({
              id: record.id,
              type: record.type || "insight",
              sourceType: record.sourceType || "system",
              speaker: record.speaker,
              title: record.title,
              detectedAt: record.createdAt,
            }))
            .slice(0, 100)
        );

        if (!summaryLoaded) {
          summaryLoaded = true;

          try {
            const summaryResponse = await fetch(
              `/api/riomind/meetings/${encodeURIComponent(meetingCode)}/live-intelligence`,
              { cache: "no-store" }
            );

            if (summaryResponse.ok) {
              const summaryPayload = await summaryResponse.json();
              const runtimeSummary = summaryPayload?.intelligence?.liveSummary;

              if (!cancelled && typeof runtimeSummary === "string" && runtimeSummary.trim()) {
                setLiveMeetingSummary(runtimeSummary);
              }
            }
          } catch (summaryError) {
            console.error("[live-meeting-intelligence-summary]", summaryError);
          }
        }

        setIntelligenceSyncStatus("synced");
      } catch (error) {
        if (cancelled) return;
        console.error("[meeting-intelligence-sync]", error);
        setIntelligenceSyncStatus("error");
      }
    }

    syncPersistentIntelligence();

    const timer = window.setInterval(
      syncPersistentIntelligence,
      3000
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [meetingCode]);

  useEffect(() => {
    intelligenceSessionReady.current = false;

    /*
     * Existing seeded/local chat is historical context, not new
     * intelligence for this session.
     */
    processedChatIntelligenceIds.current = new Set(
      meetingChatMessages.map((message) => String(message.id))
    );

    /*
     * Existing transcript rows are also historical. New WebSocket
     * transcript IDs arriving afterward remain eligible.
     */
    processedTranscriptIntelligenceIds.current = new Set(
      transcripts.map((transcript: any, index: number) =>
        String(
          transcript?.id ||
          transcript?.segment_id ||
          transcript?.message_id ||
          `historical-transcript-${index}`
        )
      )
    );

    intelligenceSessionStartedAt.current = Date.now();

    /*
     * Clear any local rule-generated noise that may have been
     * produced before the canonical session boundary was installed.
     * Accepted records are retained by the existing cleanup helper.
     */
    clearRuleGeneratedTestIntelligence();

    intelligenceHydrationTimer.current = window.setTimeout(() => {
      intelligenceSessionStartedAt.current = Date.now();
      intelligenceSessionReady.current = true;
      setAssistantNotice("");
    }, 0);

    return () => {
      if (intelligenceHydrationTimer.current !== null) {
        window.clearTimeout(
          intelligenceHydrationTimer.current
        );
      }
    };
  }, []);

  function completeActivityAction(action: string) {
    if (!moreToolPanel) return;
    setActivityOutcome((current) => ({ ...current, [moreToolPanel]: action }));
    setToolActionStatus(`${moreToolPanel}: ${action}`);
  }

  function completeCallAction(action: string) {
    if (!moreToolPanel) return;
    setCallOutcome((current) => ({ ...current, [moreToolPanel]: action }));
    setToolActionStatus(`${moreToolPanel}: ${action}`);
    if (action === "Start now") setStageMode("participants");
  }

  function launchWorkspaceApp(app: string, href: string) {
    setLastLaunchedApp(app);
    setToolActionStatus(`${app}: launching`);
    window.setTimeout(() => {
      window.location.href = href;
    }, 350);
  }


  const [allowPresent, setAllowPresent] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [allowUnmute, setAllowUnmute] = useState(false);
  const [allowCamera, setAllowCamera] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [autoAdmitEnabled, setAutoAdmitEnabled] = useState(true);
  const [pauseEntryEnabled, setPauseEntryEnabled] = useState(false);
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [guestAccessEnabled, setGuestAccessEnabled] = useState(true);
  const [domainRestrictionEnabled, setDomainRestrictionEnabled] = useState(false);

  const [cameraMode, setCameraMode] = useState("None");

  // Authoritative server participant runtime identity.
  const [runtimeId, setRuntimeId] = useState<string | null>(null);

  // Local media/presence values that will be synchronized by heartbeat.
  const [meetingPresence, setMeetingPresence] = useState({
    cameraEnabled: false,
    microphoneEnabled: false,
    screenSharing: false,
    speaking: false,
    handRaised: false,
    connectionQuality: "excellent",
  });
  const [leftUtilityPanel, setLeftUtilityPanel] = useState<null | "activity" | "teams" | "calls" | "apps">(null);

  async function startSystemCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraMode("System camera");
      setCameraStatus("System camera connected");
    } catch (error: any) {
      setCameraStatus(error?.message || "Camera permission denied");
    }
  }

  const [cameraStatus, setCameraStatus] = useState("Camera idle");
  const [micMode, setMicMode] = useState("Translation mic input");
  const [shareSource, setShareSource] = useState("Screen");
  const [includeSound, setIncludeSound] = useState(false);
  const [videoMode, setVideoMode] = useState("Upload video");
  const [videoStatus, setVideoStatus] = useState("No video selected");

  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState("");
  const [videoPlaybackType, setVideoPlaybackType] = useState<"none" | "file" | "embed" | "direct">("none");
  const [videoPlaybackTitle, setVideoPlaybackTitle] = useState("");

  const meetingSurfaceFromWorkspace = (): MeetingSurface => {
    switch (bottomPanel) {
      case "participants":
        return "people";
      case "ai":
        return "riomind";
      case "files":
        return "share";
      case "voice":
      default:
        return "talk";
    }
  };

  const handleMeetingSurfaceChange = (surface: MeetingSurface) => {
    switch (surface) {
      case "talk":
        setBottomPanel("voice");
        break;

      case "people":
        setBottomPanel("participants");
        break;

      case "riomind":
        setBottomPanel("ai");
        break;

      case "share":
        setBottomPanel("files");
        break;

      case "more":
        break;
    }
  };

  const handleMeetingShellShare = (target: ShareTarget) => {
    switch (target) {
      case "screen":
        setShareSource("Screen");
        setToolActionStatus("Screen sharing selected");
        break;

      case "video":
        setShareSource("Video");
        setToolActionStatus("Video sharing selected");
        break;

      case "document":
        setBottomPanel("documents");
        setToolActionStatus("Document sharing selected");
        break;

      case "file":
        setBottomPanel("files");
        setToolActionStatus("File sharing selected");
        break;
    }
  };

  const handleMeetingShellMore = (action: string) => {
    switch (action) {
      case "Notes":
        setBottomPanel("notes");
        break;

      case "Tasks":
        setBottomPanel("tasks");
        break;

      case "Polls":
        setBottomPanel("polls");
        break;

      case "Whiteboard":
        setBottomPanel("whiteboard");
        break;

      case "Documents":
        setBottomPanel("documents");
        break;

      case "Apps":
        setBottomPanel("apps");
        break;

      case "Language":
        setBottomPanel("voice");
        break;

      default:
        setToolActionStatus(action);
        break;
    }
  };

  const handleMeetingShellLeave = () => {
    setMeetingLifecycleDialog("leave");
  };

  // 🧠 Nexus Unified Presentation Kernel (STEP 1)
  const [meetingAssetUrl, setMeetingAssetUrl] = useState("");
  const [meetingAssetName, setMeetingAssetName] = useState("");
  const [meetingAssetKind, setMeetingAssetKind] = useState<"presentation" | "doc" | "spreadsheet" | "image" | "video" | "">("");

  const runtimeJoinStarted = useRef(false);

const runtimeStorageKey = useMemo(
  () =>
    meetingCode
      ? `riomind-meeting-runtime:${meetingCode}`
      : null,
  [meetingCode]
);

const clientSessionKey = useMemo(
  () =>
    meetingCode
      ? `riomind-client-session:${meetingCode}`
      : null,
  [meetingCode]
);

function generateClientSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

useEffect(() => {
  if (!meetingCode) return;
  if (runtimeJoinStarted.current) return;

  runtimeJoinStarted.current = true;

  async function registerRuntime() {
    try {
      let clientSessionId =
        clientSessionKey
          ? localStorage.getItem(clientSessionKey)
          : null;

      if (!clientSessionId) {
        clientSessionId = generateClientSessionId();

        if (clientSessionKey) {
          localStorage.setItem(
            clientSessionKey,
            clientSessionId
          );
        }
      }

      const savedRuntimeId =
        runtimeStorageKey
          ? localStorage.getItem(runtimeStorageKey)
          : null;

      const response = await fetch(
        `/api/riomind/meetings/${meetingCode}/participants/runtime`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            runtimeId:
              savedRuntimeId || undefined,

            clientSessionId,

            displayName: "Owner",

            role: "owner",

            preferredLanguage: "en",

            microphoneEnabled: true,

            cameraEnabled: false,
          }),
        }
      );

      const json =
        await response.json();

      if (json?.runtimeId) {
        setRuntimeId(json.runtimeId);

        if (runtimeStorageKey) {
          localStorage.setItem(
            runtimeStorageKey,
            json.runtimeId
          );
        }
      }
    } catch (error) {
      console.error(
        "[meeting-runtime-registration]",
        error
      );
    }
  }

  registerRuntime();
}, [
  meetingCode,
  runtimeStorageKey,
  clientSessionKey,
]);

  useMeetingPresence({
    meetingCode,
    runtimeId,
    enabled: Boolean(runtimeId),
    state: meetingPresence,
  });



  const [presentationAsset, setPresentationAsset] = useState<{
    type: "video" | "image" | "doc" | "spreadsheet" | "presentation" | "none";
    url: string;
    name: string;
  } | null>(null);

  function handleMeetingAssetUpload(
    kind: "presentation" | "doc" | "spreadsheet" | "image" | "video",
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    openPresentationAsset({
      type: kind,
      url: objectUrl,
      name: file.name,
    });

    if (kind === "video") {
      setVideoMode("Upload video");
      setVideoPlaybackUrl(objectUrl);
      setVideoPlaybackType("file");
      setVideoPlaybackTitle(file.name);
      setVideoStatus(`Playing uploaded video: ${file.name}`);
      setStageMode("presentation");
    }
  }

  function openPresentationAsset(asset: {
    type: "video" | "image" | "doc" | "spreadsheet" | "presentation";
    url: string;
    name: string;
  }) {
    setPresentationAsset(asset);
    setMeetingAssetUrl(asset.url);
    setMeetingAssetName(asset.name);
    setMeetingAssetKind(asset.type as any);
    setStageMode("presentation");
    setStageView("presentation");
    setBottomPanel("files");

    if (asset.type === "video") {
      setVideoMode("Upload video");
      setVideoPlaybackUrl(asset.url);
      setVideoPlaybackType("file");
      setVideoPlaybackTitle(asset.name);
      setVideoStatus(`Playing ${asset.name}`);
    }
  }

  function openVideoInStage(asset: {
    url: string;
    title: string;
    type: "file" | "embed" | "direct";
    mode: string;
  }) {
    setVideoMode(asset.mode);
    setVideoPlaybackUrl(asset.url);
    setVideoPlaybackType(asset.type);
    setVideoPlaybackTitle(asset.title);
    setVideoStatus(`Playing ${asset.mode.toLowerCase()}: ${asset.title}`);
    setStageMode("presentation");
    setStageView("presentation");
  }

  function normalizeExternalVideoUrl(rawUrl: string) {
    try {
      const url = new URL(rawUrl.trim());
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace("/", "");
        return id ? `https://www.youtube.com/embed/${id}` : rawUrl;
      }
      if (url.hostname.includes("youtube.com")) {
        const id = url.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        if (url.pathname.includes("/shorts/")) {
          const shortId = url.pathname.split("/shorts/")[1]?.split("/")[0];
          if (shortId) return `https://www.youtube.com/embed/${shortId}`;
        }
        if (url.pathname.includes("/embed/")) return rawUrl;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    openPresentationAsset({
      type: "video",
      url: objectUrl,
      name: file.name,
    });
  }

  const [videoUrlDialogOpen, setVideoUrlDialogOpen] =
    useState(false);
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [videoUrlTitleDraft, setVideoUrlTitleDraft] =
    useState("");
  const [videoUrlError, setVideoUrlError] = useState("");

  function openExternalVideo() {
    setVideoUrlDraft("");
    setVideoUrlTitleDraft("");
    setVideoUrlError("");
    setOpenMenu(null);
    setVideoUrlDialogOpen(true);
  }

  function submitExternalVideoUrl() {
    const rawUrl = videoUrlDraft.trim();

    if (!rawUrl) {
      setVideoUrlError("Enter a video or livestream URL.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      setVideoUrlError(
        "Enter a complete URL beginning with http:// or https://."
      );
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setVideoUrlError("Only HTTP and HTTPS video URLs are supported.");
      return;
    }

    const playableUrl = normalizeExternalVideoUrl(rawUrl);
    const isEmbed =
      playableUrl.includes("youtube.com/embed/") ||
      playableUrl.includes("player.vimeo.com/video/");

    const playbackTitle =
      videoUrlTitleDraft.trim() || "Video URL";

    setPresentationAsset({
      type: "video",
      url: playableUrl,
      name: playbackTitle,
    });

    setMeetingAssetUrl("");
    setMeetingAssetName("");
    setMeetingAssetKind("");

    setVideoMode("Video URL");
    setVideoPlaybackUrl(playableUrl);
    setVideoPlaybackType(isEmbed ? "embed" : "direct");
    setVideoPlaybackTitle(playbackTitle);
    setVideoStatus(`Playing: ${playbackTitle}`);

    setStageMode("presentation");
    setStageView("presentation");
    setVideoUrlDialogOpen(false);
    setVideoUrlError("");
  }
  const [openMenu, setOpenMenu] = useState<
    null | "camera" | "mic" | "react" | "controls" | "share" | "video" | "view" | "more"
  >(null);

  useEffect(() => {
    if (!openMenu) return;

    function closeToolbarMenuFromOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;

      if (
        target?.closest("[data-nexus-toolbar-menu-root]") ||
        target?.closest("[data-nexus-toolbar-dropdown]")
      ) {
        return;
      }

      setOpenMenu(null);
    }

    function closeToolbarMenuFromKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener(
      "mousedown",
      closeToolbarMenuFromOutside
    );
    document.addEventListener(
      "keydown",
      closeToolbarMenuFromKeyboard
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeToolbarMenuFromOutside
      );
      document.removeEventListener(
        "keydown",
        closeToolbarMenuFromKeyboard
      );
    };
  }, [openMenu]);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [listenLanguage, setListenLanguage] = useState("fr");
  const [voiceRole, setVoiceRole] = useState<"listener" | "speaker">("listener");

  useEffect(() => {
    async function load() {
      const meetingJson =
        (await safeJson(`/api/riomind/meetings/${meetingCode}`)) ||
        (await safeJson(`/api/riomind/meetings/${meetingCode}/summary`));

      const transcriptsJson = await safeJson(`/api/riomind/meetings/${meetingCode}/voice/transcripts`);

      const m = meetingJson?.meeting || meetingJson?.data?.meeting || meetingJson?.data || meetingJson || null;
      const p =
        meetingJson?.participants ||
        meetingJson?.data?.participants ||
        m?.participants ||
        [];

      setMeeting(m);
      setParticipants(Array.isArray(p) ? p : []);
      setTranscripts(Array.isArray(transcriptsJson?.transcripts) ? transcriptsJson.transcripts : []);

      if (m?.default_language) setSourceLanguage(m.default_language);
      if (m?.preferred_language) setListenLanguage(m.preferred_language);
    }

    if (meetingCode) load();
  }, [meetingCode]);

  const title = meeting?.title || meeting?.meeting_title || "Nexus Teams Meeting";
  const hostName = meeting?.organizer || meeting?.host_name || meeting?.created_by || "Host";
  const participantCount = participants.length;
  const activeParticipants = participants.filter((p) => p?.status !== "declined");

  const inviteUrl = typeof window !== "undefined" ? window.location.href.replace(/\/v2$/, "") : "";

  const latestTranscript = transcripts[0] || transcripts[transcripts.length - 1];

  const presenceParticipants = liveParticipants
    .map(getParticipantState)
    .filter((participant) => !participant.removed);

  // Canonical meeting participant source:
  // prefer API/database participants when available, otherwise use live presence.
  const apiMeetingParticipants = activeParticipants
    .map(getParticipantState)
    .filter((participant) => !participant.removed);

  const meetingParticipants =
    apiMeetingParticipants.length > 0
      ? apiMeetingParticipants
      : presenceParticipants;

  const humanMeetingParticipants = meetingParticipants.filter(
    (participant: any) =>
      participant.role !== "Assistant" &&
      participant.role !== "AI" &&
      participant.name !== "Nexus AI" &&
      participant.display_name !== "Nexus AI"
  );

  const unifiedParticipantCount = humanMeetingParticipants.length;

  function participantIdentity(participant: any, index = 0) {
    return String(
      participant?.runtime_id ||
      participant?.runtimeId ||
      participant?.id ||
      participant?.participant_id ||
      participant?.user_id ||
      participant?.email ||
      participantName(participant, index)
    );
  }

  function participantName(participant: any, index = 0) {
    return (
      participant?.name ||
      participant?.display_name ||
      participant?.participant_name ||
      participant?.email ||
      `Guest ${index + 1}`
    );
  }

  function participantRole(participant: any) {
    const rawRole =
      participant?.participant_role ||
      participant?.role ||
      participant?.meeting_role ||
      participantControlState[
        participantName(participant)
      ]?.role ||
      participant?.status ||
      "Participant";

    const normalized = String(rawRole)
      .trim()
      .toLowerCase();

    const labels: Record<string, string> = {
      owner: "Owner",
      host: "Host",
      cohost: "Co-host",
      "co-host": "Co-host",
      admin: "Admin",
      presenter: "Presenter",
      participant: "Participant",
      viewer: "Viewer",
      guest: "Guest",
      assistant: "Assistant",
      ai: "AI",
    };

    return labels[normalized] || String(rawRole);
  }

  function participantAvatar(participant: any) {
    const name = participantName(participant);

    return (
      participantControlState[name]?.avatarUrl ||
      participant?.avatar_url ||
      participant?.profile_image_url ||
      participant?.profile_image ||
      participant?.photo_url ||
      participant?.image_url ||
      ""
    );
  }

  function isAssistantParticipant(participant: any) {
    const name = participantName(participant);
    const role = participantRole(participant);
    return name === "Nexus AI" || role === "Assistant" || role === "AI";
  }

  function isHostParticipant(participant: any) {
    const role = participantRole(participant);
    return (
      role === "Host" ||
      role === "Co-host" ||
      role === "Owner" ||
      role === "Admin"
    );
  }

  function isSpeakingParticipant(participant: any) {
    const name = participantName(participant);
    return Boolean(
      participant?.speaking ||
      participantControlState[name]?.speaking
    );
  }

  function participantHandRaised(participant: any) {
    const name = participantName(participant);
    return Boolean(
      participant?.hand ||
      participantControlState[name]?.hand
    );
  }

  const raisedHandQueue = meetingParticipants
    .filter(participantHandRaised)
    .sort((a: any, b: any) => {
      const aName = participantName(a);
      const bName = participantName(b);

      const aRaisedAt =
        participantControlState[aName]?.handRaisedAt ??
        a?.handRaisedAt ??
        a?.hand_raised_at ??
        Number.MAX_SAFE_INTEGER;

      const bRaisedAt =
        participantControlState[bName]?.handRaisedAt ??
        b?.handRaisedAt ??
        b?.hand_raised_at ??
        Number.MAX_SAFE_INTEGER;

      return Number(aRaisedAt) - Number(bRaisedAt);
    });

  const raisedHandCount = raisedHandQueue.length;

  const raisedHandRankByName = Object.fromEntries(
    raisedHandQueue.map((participant: any, index: number) => [
      participantName(participant, index),
      index + 1,
    ])
  );

  const meetingLanguageCodes = Array.from(
    new Set(
      [
        listenLanguage,
        ...meetingParticipants
          .filter((participant: any) => !isAssistantParticipant(participant))
          .map((participant: any) => participant?.language || sourceLanguage),
      ].filter(Boolean)
    )
  );

  const currentViewerName = "John";

  const currentViewerParticipant = meetingParticipants.find(
    (participant: any) => participantName(participant) === currentViewerName
  );

  const currentViewerRole = participantRole(currentViewerParticipant || {});
  const currentViewerIsHostOrAdmin =
    currentViewerRole === "Host" ||
    currentViewerRole === "Co-host" ||
    currentViewerRole === "Owner" ||
    currentViewerRole === "Admin";

  const currentViewerIsMeetingOwner =
    currentViewerName === meetingOwnerName;

  const activeHosts = meetingParticipants.filter((participant: any) => {
    const role = participantRole(participant);
    return role === "Host" || role === "Owner";
  });

  const activeCoHosts = meetingParticipants.filter(
    (participant: any) => participantRole(participant) === "Co-host"
  );

  const primaryHostName =
    activeHosts.length > 0
      ? participantName(activeHosts[0])
      : meetingOwnerName;

  const eligibleHostTargets = meetingParticipants.filter(
    (participant: any) =>
      !isAssistantParticipant(participant) &&
      participantName(participant) !== currentViewerName &&
      !participant?.removed
  );

  const consentEligibleParticipants = meetingParticipants.filter(
    (participant: any) => !isAssistantParticipant(participant)
  );

  const recordingConsentRows = consentEligibleParticipants.map(
    (participant: any, index: number) => {
      const name = participantName(participant, index);
      const consent = recordingConsentState[name] || {
        status: "pending" as const,
      };

      return {
        name,
        role: participantRole(participant),
        status: consent.status,
        respondedAt: consent.respondedAt,
      };
    }
  );

  const agreedConsentCount = recordingConsentRows.filter(
    (row) => row.status === "agreed" || row.status === "exempt"
  ).length;

  const pendingConsentCount = recordingConsentRows.filter(
    (row) => row.status === "pending"
  ).length;

  const declinedConsentCount = recordingConsentRows.filter(
    (row) => row.status === "declined"
  ).length;

  const recordingPolicySatisfied =
    recordingPolicy === "recording_disabled"
      ? false
      : recordingPolicy === "organization_authorized"
      ? recordingConsentRows.every(
          (row) =>
            row.status === "agreed" ||
            row.status === "exempt" ||
            row.status === "pending"
        )
      : recordingPolicy === "acknowledge_or_leave"
      ? recordingConsentRows.every(
          (row) =>
            row.status === "agreed" ||
            row.status === "left" ||
            row.status === "exempt"
        )
      : recordingConsentRows.length > 0 &&
        recordingConsentRows.every(
          (row) => row.status === "agreed" || row.status === "exempt"
        );

  function defaultRecordingPolicyForCategory(
    category:
      | "private"
      | "internal"
      | "interview"
      | "training"
      | "webinar"
      | "public-broadcast"
      | "sensitive"
  ) {
    if (
      category === "private" ||
      category === "interview" ||
      category === "sensitive"
    ) {
      return "all_explicit_consent" as const;
    }

    if (
      category === "training" ||
      category === "webinar" ||
      category === "public-broadcast"
    ) {
      return "acknowledge_or_leave" as const;
    }

    return "all_explicit_consent" as const;
  }

  function updateMeetingCategory(
    category:
      | "private"
      | "internal"
      | "interview"
      | "training"
      | "webinar"
      | "public-broadcast"
      | "sensitive"
  ) {
    setMeetingCategory(category);
    setRecordingPolicy(defaultRecordingPolicyForCategory(category));
  }

  function recordingPolicyLabel() {
    if (recordingPolicy === "all_explicit_consent") {
      return "All active participants must agree";
    }

    if (recordingPolicy === "acknowledge_or_leave") {
      return "Participants acknowledge recording or leave";
    }

    if (recordingPolicy === "organization_authorized") {
      return "Organization policy authorizes recording with notice";
    }

    return "Recording disabled";
  }

  const stageEligibleParticipants =
    meetingParticipants.filter(
      (participant: any, index: number) => {
        const name = participantName(
          participant,
          index
        );

        const controls =
          participantControlState[name] || {};

        return (
          controls.removed !== true &&
          controls.inLobby !== true
        );
      }
    );

  const stageSourceById = new Map<
    string,
    any
  >();

  const stageModelParticipants =
    stageEligibleParticipants.map(
      (participant: any, index: number) => {
        const name = participantName(
          participant,
          index
        );

        const id = participantIdentity(
          participant,
          index
        );

        const controls =
          participantControlState[name] || {};

        stageSourceById.set(id, participant);

        return {
          id,
          name,
          role: participantRole(
            participant
          ).toLowerCase(),
          speaking:
            isSpeakingParticipant(
              participant
            ),
          spotlighted:
            controls.spotlighted === true,
          pinned:
            controls.pinned === true,
          screenSharing:
            controls.screenSharing ??
            Boolean(
              participant?.screen_sharing ||
              participant?.screenSharing ||
              participant?.sharing_screen
            ),
          inLobby:
            controls.inLobby === true,
        };
      }
    );

  const computedStage = buildStage(
    stageModelParticipants
  );

  const participantStageLimit =
    computedStage.participants.length <= 16
      ? computedStage.participants.length
      : computedStage.participants.length <= 25
      ? 20
      : computedStage.participants.length <= 49
      ? 28
      : 35;

  const stageParticipants =
    computedStage.participants
      .slice(0, participantStageLimit)
      .map((stageParticipant) =>
        stageSourceById.get(
          stageParticipant.id
        )
      )
      .filter(Boolean);

  const hiddenParticipantCount = Math.max(
    computedStage.participants.length -
      stageParticipants.length,
    0
  );

  const participantGridClass: string = {
    single:
      "mx-auto max-w-4xl grid-cols-1",
    two:
      "grid-cols-1 md:grid-cols-2",
    "grid-2":
      "grid-cols-1 sm:grid-cols-2",
    "grid-3":
      "grid-cols-2 lg:grid-cols-3",
    "grid-4":
      "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
    "grid-5":
      "grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
    "grid-7":
      "grid-cols-3 md:grid-cols-5 xl:grid-cols-7",
  }[computedStage.layout];

  const visibleStageCount =
    stageParticipants.length;

  const participantTilePadding =
    computedStage.layout === "single"
      ? "min-h-[300px] p-8"
      : visibleStageCount <= 4
      ? "min-h-[220px] p-6"
      : visibleStageCount <= 9
      ? "min-h-[170px] p-5"
      : visibleStageCount <= 25
      ? "min-h-[140px] p-4"
      : "min-h-[112px] p-2.5";

  const participantAvatarSize =
    computedStage.layout === "single"
      ? "h-32 w-32 text-4xl"
      : visibleStageCount <= 4
      ? "h-24 w-24 text-2xl"
      : visibleStageCount <= 9
      ? "h-20 w-20 text-xl"
      : visibleStageCount <= 25
      ? "h-16 w-16 text-lg"
      : "h-11 w-11 text-sm";

  const participantLanguageByName = Object.fromEntries(
    presenceParticipants.map((participant) => [participant.name, participant.language])
  );

  function chatLanguageLabel(message: any) {
    if (message.role === "Assistant" || message.sender === "Nexus AI" || message.language === "system") {
      return "Meeting Assistant";
    }

    return languageLabel(participantLanguageByName[message.sender] || message.language || listenLanguage);
  }

  const computedRoomState =
    unifiedParticipantCount === 0
      ? "Waiting lobby"
      : unifiedParticipantCount < 10
      ? meetingVoiceMode === "open"
        ? "Open discussion"
        : meetingVoiceMode === "moderated"
        ? "Moderated discussion"
        : meetingVoiceMode === "presentation"
        ? "Presentation mode"
        : "Broadcast room"
      : unifiedParticipantCount < 100
      ? "Meeting active"
      : "Large meeting";

  const originalSpeechLanguage = speakingParticipant
    ? languageLabel(speakingParticipant.language)
    : languageLabel(sourceLanguage);

  const translatedSpeechLanguage = languageLabel(listenLanguage);

  const participantRoomMode = computedRoomState;

  const visibleParticipants =
    meetingParticipants.length <= 30
      ? meetingParticipants.slice(0, 30)
      : meetingParticipants.slice(0, 12);
  const latestCaption =
    latestTranscript?.metadata?.translations?.[listenLanguage] ||
    latestTranscript?.translated_message ||
    "";

  const humanParticipantCount = unifiedParticipantCount;

   function getParticipantState(participant: any) {
    const participantKey = participantIdentity(participant);

    const override = participantControlState[participantKey] || {};
    return { ...participant, ...override };
  }


  /*
   * Canonical Presence Bridge
   *
   * The meeting UI has a single participant control state.
   * Heartbeats are derived from ONLY the local participant.
   */
  useEffect(() => {
    const local =
      participantControlState[currentViewerName] || {};

    setMeetingPresence((previous) => ({
      ...previous,

      microphoneEnabled:
        local.mic === "live",

      speaking:
        Boolean(local.speaking),

      handRaised:
        Boolean(local.hand),

      cameraEnabled:
        previous.cameraEnabled,

      screenSharing:
        previous.screenSharing,

      connectionQuality:
        previous.connectionQuality,
    }));
  }, [
    participantControlState,
    currentViewerName,
  ]);


  function controlParticipant(
    name: string,
    action:
      | "mute"
      | "unmute"
      | "allowSpeak"
      | "lowerHand"
      | "raiseHand"
      | "removeSpeaker"
      | "removeParticipant"
      | "promote"
      | "makeCohost"
      | "makePresenter"
      | "spotlight"
      | "moveToLobby"
      | "disableCamera"
      | "stopScreenShare"
      | "pin"
      | "message"
      | "profile"
      | "more"
  ) {
    setParticipantControlState((current) => {
      const existing = current[name] || {};
      if (action === "mute") return { ...current, [name]: { ...existing, mic: "muted", speaking: false } };
      if (action === "unmute") return { ...current, [name]: { ...existing, mic: "live" } };
      if (action === "allowSpeak") {
        if (meetingVoiceMode === "presentation" || meetingVoiceMode === "broadcast") {
          const next: Record<string, { mic?: string; speaking?: boolean; hand?: boolean }> = { ...current };
          liveParticipants.forEach((participant) => {
            if (participant.name !== name && participant.role !== "Owner" && participant.role !== "Host") {
              next[participant.name] = { ...(next[participant.name] || {}), speaking: false, mic: "muted" };
            }
          });
          return { ...next, [name]: { ...existing, speaking: true, hand: false, mic: "live" } };
        }
        return { ...current, [name]: { ...existing, speaking: true, hand: false, mic: "live" } };
      }
      if (action === "lowerHand") {
        return {
          ...current,
          [name]: {
            ...existing,
            hand: false,
            handRaisedAt: undefined,
          },
        };
      }

      if (action === "raiseHand") {
        return {
          ...current,
          [name]: {
            ...existing,
            hand: true,
            handRaisedAt: Date.now(),
          },
        };
      }

      if (action === "removeSpeaker") {
        return {
          ...current,
          [name]: {
            ...existing,
            speaking: false,
            mic: "muted",
          },
        };
      }

      if (action === "removeParticipant") {
        return {
          ...current,
          [name]: {
            ...existing,
            speaking: false,
            mic: "muted",
            hand: false,
            removed: true,
          },
        };
      }

      if (action === "promote") {
        return {
          ...current,
          [name]: {
            ...existing,
            role: "Admin",
          },
        };
      }

      if (action === "makeCohost") {
        return {
          ...current,
          [name]: {
            ...existing,
            role: "Co-host",
          },
        };
      }

      if (action === "makePresenter") {
        return {
          ...current,
          [name]: {
            ...existing,
            role: "Presenter",
          },
        };
      }

      if (action === "spotlight") {
        return {
          ...current,
          [name]: {
            ...existing,
            spotlighted: !existing.spotlighted,
          },
        };
      }

      if (action === "moveToLobby") {
        return {
          ...current,
          [name]: {
            ...existing,
            speaking: false,
            mic: "muted",
            hand: false,
            inLobby: true,
          },
        };
      }

      if (action === "disableCamera") {
        return {
          ...current,
          [name]: {
            ...existing,
            cameraEnabled: false,
          },
        };
      }

      if (action === "stopScreenShare") {
        return {
          ...current,
          [name]: {
            ...existing,
            screenSharing: false,
          },
        };
      }

      if (action === "pin") {
        return {
          ...current,
          [name]: {
            ...existing,
            pinned: !existing.pinned,
          },
        };
      }

      return current;
    });

    const labels: Record<string, string> = {
      mute: "muted",
      unmute: "unmuted",
      allowSpeak: "approved to speak",
      lowerHand: "hand lowered",
      raiseHand: "hand raised",
      removeSpeaker: "removed from speaker list",
      removeParticipant: "removed from meeting",
      promote: "promoted to admin",
      makeCohost: "made co-host",
      makePresenter: "made presenter",
      spotlight: "spotlight status changed",
      moveToLobby: "moved to the lobby",
      disableCamera: "camera disabled",
      stopScreenShare: "screen sharing stopped",
      pin: "pin status changed",
      more: "more controls opened",
      message: "message panel ready",
      profile: "profile opened",
    };

    setToolActionStatus(`${name}: ${labels[action]}`);
  }


  function openPrivateChat(participantNameValue: string) {
    setPrivateChatTarget(participantNameValue);
    setPrivateChatOpen(true);
    setPrivateChatDraft("");
    setPrivateChatStatus("");
    setOpenParticipantMenu(null);
  }

  function sendPrivateChatMessage() {
    const body = privateChatDraft.trim();

    if (!privateChatTarget || !body) return;

    setPrivateChatMessages((messages) => [
      ...messages,
      {
        id: `private-${Date.now()}`,
        sender: currentViewerName,
        recipient: privateChatTarget,
        body,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setPrivateChatDraft("");
    setPrivateChatStatus(
      `Private message sent to ${privateChatTarget}.`
    );

    appendMeetingAuditEvent(
      "private_message_sent",
      privateChatTarget,
      {
        meetingCode,
        messageLength: body.length,
      }
    );
  }

  function openParticipantProfile(participantNameValue: string) {
    setProfileViewerName(participantNameValue);
    setOpenParticipantMenu(null);
  }

  function openParticipantNotes(
    participantNameValue: string
  ) {
    setRightPanel("notes");
    setBottomPanel("ai");
    setToolActionStatus(
      `Notes opened for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function openParticipantLanguage(
    participantNameValue: string
  ) {
    setBottomPanel("participants");
    setToolActionStatus(
      `Language controls opened for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function openParticipantAssistant(
    participantNameValue: string,
    presenterCoach = false
  ) {
    setBottomPanel("ai");
    setAssistantAskOpen(true);
    setAssistantQuestion(
      presenterCoach
        ? `Coach ${participantNameValue} for this presentation.`
        : `Help me understand ${participantNameValue}'s contributions in this meeting.`
    );
    setAssistantNotice(
      presenterCoach
        ? `AI Presenter Coach opened for ${participantNameValue}.`
        : `Private AI Assistant context opened for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function openParticipantSummary(
    participantNameValue: string
  ) {
    setBottomPanel("ai");
    setAssistantAskOpen(true);
    setAssistantQuestion(
      `Summarize ${participantNameValue}'s contributions, decisions, actions, risks, and commitments in this meeting.`
    );
    setAssistantNotice(
      `AI participant summary prepared for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function openParticipantActivity(
    participantNameValue: string
  ) {
    setMoreToolPanel("Participant Activity");
    setToolActionStatus(
      `Participant activity opened for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function openParticipantPermissions(
    participantNameValue: string
  ) {
    setMoreToolPanel("Participant Permissions");
    setToolActionStatus(
      `Permissions opened for ${participantNameValue}.`
    );
    setOpenParticipantMenu(null);
  }

  function chooseCurrentUserAvatar() {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setMeetingLifecycleStatus(
          "Profile photo must be 5 MB or smaller."
        );
        return;
      }

      const avatarUrl = URL.createObjectURL(file);

      setParticipantControlState((current) => ({
        ...current,
        [currentViewerName]: {
          ...(current[currentViewerName] || {}),
          avatarUrl,
        },
      }));

      appendMeetingAuditEvent(
        "participant_avatar_updated",
        currentViewerName,
        {
          meetingCode,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }
      );

      setMeetingLifecycleStatus("Profile photo updated.");
    };

    input.click();
  }

  function handleParticipantAvatarClick(
    participant: any,
    participantNameValue: string
  ) {
    if (isAssistantParticipant(participant)) return;

    if (participantNameValue === currentViewerName) {
      chooseCurrentUserAvatar();
      return;
    }

    openParticipantProfile(participantNameValue);
  }

  function intelligenceSourceTimestamp(
    detection: MeetingDetection
  ) {
    const timestamp = Date.parse(String(detection.createdAt || ""));

    return Number.isFinite(timestamp) ? timestamp : Date.now();
  }

  function isHistoricalIntelligenceSource(
    detection: MeetingDetection
  ) {
    const sourceId = String(detection.sourceId || "");

    if (
      detection.sourceType === "chat" &&
      processedChatIntelligenceIds.current.has(sourceId)
    ) {
      return true;
    }

    if (
      detection.sourceType === "transcript" &&
      processedTranscriptIntelligenceIds.current.has(sourceId)
    ) {
      return true;
    }

    return (
      intelligenceSourceTimestamp(detection) <=
      intelligenceSessionStartedAt.current
    );
  }

  function isSeededIntelligenceText(
    detection: MeetingDetection
  ) {
    const text = normalizeIntelligenceSignature(
      detection.sourceText ||
      detection.detail ||
      detection.title
    );

    const seededPhrases = [
      "welcome everyone we are preparing the meeting room",
      "bonjour john i can hear the room",
      "live chat is ready i can summarize decisions and action items",
      "welcome everyone we are now testing live voice transcription foundation",
      "bienvenue a tous nous testons maintenant la transcription vocale en direct",
      "participant identity private chat consent and authority changes are not yet synchronized across separate authenticated sessions",
      "live presence is still locally simulated",
      "recording requires policy verification",
      "use multilingual meeting routing",
    ];

    return seededPhrases.some(
      (phrase) =>
        text === phrase ||
        text.includes(phrase)
    );
  }

  function isMeaningfulMeetingQuestion(
    detection: MeetingDetection
  ) {
    if (detection.type !== "question") {
      return true;
    }

    const text = normalizeIntelligenceSignature(
      detection.sourceText ||
      detection.detail ||
      detection.title
    );

    if (text.length < 24) {
      return false;
    }

    const casualOrWeakQuestionPatterns = [
      /^(what|why|how|who|when|where)$/,
      /^(really|hmm|okay|ok|right|correct)\b/,
      /^(can|could|would|will) you\b/,
      /\bhow are you\b/,
      /\bwhat do you mean\b/,
      /\bcan you hear me\b/,
      /\bcan i hear\b/,
      /\bare you there\b/,
      /\bis that okay\b/,
      /\byou know\b/,
    ];

    if (
      casualOrWeakQuestionPatterns.some((pattern) =>
        pattern.test(text)
      )
    ) {
      return false;
    }

    const meetingQuestionContext =
      /\b(?:decision|decide|approve|approval|owner|responsible|action item|deadline|due|risk|blocker|blocked|dependency|resolve|clarify|clarification|scope|requirement|launch|release|deployment|migration|report|proposal|project|meeting|pilot|provider|translation|recording|policy|participant|customer|budget|timeline|next step|follow up)\b/i;

    return meetingQuestionContext.test(text);
  }

  function canonicalizeMeetingDetections(
    detections: MeetingDetection[]
  ) {
    if (!intelligenceSessionReady.current) {
      return [];
    }

    const semanticSignatures = new Set<string>();
    const sourceTypeSignatures = new Set<string>();

    return detections.filter((detection) => {
      if (isHistoricalIntelligenceSource(detection)) {
        return false;
      }

      if (isSeededIntelligenceText(detection)) {
        return false;
      }

      if (
        typeof detection.confidence === "number" &&
        detection.confidence < 72
      ) {
        return false;
      }

      if (!isMeaningfulMeetingQuestion(detection)) {
        return false;
      }

      const normalizedTitle =
        normalizeIntelligenceSignature(detection.title);

      const normalizedDetail =
        normalizeIntelligenceSignature(detection.detail);

      if (
        `${normalizedTitle} ${normalizedDetail}`.trim().length < 18
      ) {
        return false;
      }

      /*
       * A single source contribution may create different kinds of
       * intelligence, but it may not create repeated records of the
       * same type.
       */
      const sourceTypeSignature = [
        detection.sourceType,
        detection.sourceId,
        detection.type,
      ].join("|");

      if (sourceTypeSignatures.has(sourceTypeSignature)) {
        return false;
      }

      const semanticSignature = [
        detection.type,
        normalizeIntelligenceSignature(detection.speaker),
        normalizedTitle,
        normalizedDetail,
      ].join("|");

      if (semanticSignatures.has(semanticSignature)) {
        return false;
      }

      sourceTypeSignatures.add(sourceTypeSignature);
      semanticSignatures.add(semanticSignature);

      return true;
    });
  }

  function appendUniqueIntelligenceRecord(
    setter: React.Dispatch<
      React.SetStateAction<MeetingIntelligenceRecord[]>
    >,
    detection: MeetingDetection
  ) {
    setter((records) => {
      const normalizeIntelligenceText = (value?: string) =>
        String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const incomingTitle =
        normalizeIntelligenceText(detection.title);

      const incomingDetail =
        normalizeIntelligenceText(detection.detail);

      const duplicateExists = records.some((record) => {
        if (record.id === detection.id) return true;

        const sameType =
          !record.type ||
          !detection.type ||
          record.type === detection.type;

        if (!sameType) return false;

        const existingTitle =
          normalizeIntelligenceText(record.title);

        const existingDetail =
          normalizeIntelligenceText(record.detail);

        return (
          incomingTitle === existingTitle ||
          incomingDetail === existingDetail ||
          (
            incomingTitle.length > 18 &&
            existingTitle.length > 18 &&
            (
              incomingTitle.includes(existingTitle) ||
              existingTitle.includes(incomingTitle)
            )
          )
        );
      });

      if (duplicateExists) {
        return records;
      }

      return [detection, ...records].slice(0, 100);
    });
  }

  async function ingestMeetingDetections(
    detections: MeetingDetection[]
  ) {
    const canonicalDetections =
      canonicalizeMeetingDetections(detections);

    if (!canonicalDetections.length) {
      return;
    }

    try {
      await Promise.all(
        canonicalDetections.map(async (detection) => {
          const response = await fetch(
            `/api/riomind/meetings/${encodeURIComponent(meetingCode)}/intelligence`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                intelligenceType: detection.type,
                title: detection.title,
                detail: detection.detail,
                speakerId: detection.participantId || null,
                speakerName: detection.speaker || null,
                participantId: detection.participantId || null,
                sourceType: detection.sourceType,
                sourceId: detection.sourceId,
                sourceText: detection.sourceText,
                sourceLanguage: detection.language || null,
                confidence: detection.confidence ?? null,
                detectedBy: detection.detectedBy || "riomind-core",
                tags: detection.tags || [],
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to persist ${detection.type} intelligence.`
            );
          }
        })
      );

      setIntelligenceSyncStatus("synced");
      setAssistantNotice(
        `${canonicalDetections.length} intelligence item${
          canonicalDetections.length === 1 ? "" : "s"
        } synchronized.`
      );
    } catch (error) {
      console.error("[meeting-intelligence-persist]", error);
      setIntelligenceSyncStatus("error");
      setAssistantNotice(
        "Meeting intelligence could not be synchronized with the persistent runtime."
      );
    }
  }

  function toggleExpandedChatMessage(messageId: string) {
    setExpandedChatMessageIds((current) => {
      const next = new Set(current);

      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }

      return next;
    });
  }

  function canonicalIntelligenceRecords(
    records: MeetingIntelligenceRecord[]
  ) {
    return records.filter((record) => {
      const activeStatus =
        record.status === "detected" ||
        record.status === "accepted";

      const isNotSeed =
        record.sourceType !== "seed" &&
        record.detectedBy !== "seed";

      const meetsConfidenceFloor =
        typeof record.confidence !== "number" ||
        record.confidence >= 72;

      return activeStatus && isNotSeed && meetsConfidenceFloor;
    });
  }

  function activeIntelligenceCount(
    records: MeetingIntelligenceRecord[]
  ) {
    return canonicalIntelligenceRecords(records).length;
  }

  function normalizeIntelligenceSignature(value: unknown) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalTimelineEvents(
    events: typeof intelligenceTimeline
  ) {
    const signatures = new Set<string>();

    return events.filter((event) => {
      if (event.sourceType === "seed") {
        return false;
      }

      const signature = [
        normalizeIntelligenceSignature(event.type),
        normalizeIntelligenceSignature(event.speaker),
        normalizeIntelligenceSignature(event.title),
      ].join("|");

      if (signatures.has(signature)) {
        return false;
      }

      signatures.add(signature);
      return true;
    });
  }

  async function updateIntelligenceRecord(
    collection:
      | "decisions"
      | "actions"
      | "risks"
      | "questions",
    id: string,
    status: MeetingIntelligenceRecord["status"]
  ) {
    try {
      const response = await fetch(
        `/api/riomind/meetings/${encodeURIComponent(meetingCode)}/intelligence/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Persistent intelligence update failed.");
      }

      appendMeetingAuditEvent(
        `meeting_intelligence_${collection}_${status}`,
        id,
        {
          meetingCode,
        }
      );

      setAssistantNotice(`${collection.slice(0, -1)} marked ${status}.`);
      setIntelligenceSyncStatus("synced");
    } catch (error) {
      console.error("[meeting-intelligence-update]", error);
      setIntelligenceSyncStatus("error");
      setAssistantNotice(
        "The persistent meeting intelligence record could not be updated."
      );
    }
  }

  function clearRuleGeneratedTestIntelligence() {
    const retainCanonicalRecords = (
      records: MeetingIntelligenceRecord[]
    ) =>
      records.filter(
        (record) =>
          record.detectedBy !== "rules" ||
          record.status === "accepted"
      );

    setDetectedDecisions(retainCanonicalRecords);
    setDetectedActions(retainCanonicalRecords);
    setDetectedRisks(retainCanonicalRecords);
    setOpenMeetingQuestions(retainCanonicalRecords);
    setDetectedCommitments(retainCanonicalRecords);

    setAssistantSuggestions((suggestions) =>
      suggestions.filter(
        (suggestion) =>
          !suggestion.id.startsWith("detected-source-")
      )
    );

    setIntelligenceTimeline((events) =>
      events.filter(
        (event) =>
          !String(event.id).startsWith("decision-") &&
          !String(event.id).startsWith("action-") &&
          !String(event.id).startsWith("risk-") &&
          !String(event.id).startsWith("question-") &&
          !String(event.id).startsWith("commitment-")
      )
    );

    processedChatIntelligenceIds.current = new Set(
      meetingChatMessages.map((message) => String(message.id))
    );

    processedTranscriptIntelligenceIds.current = new Set(
      transcripts.map((transcript: any, index: number) =>
        String(
          transcript?.id ||
          transcript?.transcript_id ||
          transcript?.created_at ||
          `${transcript?.speaker_name || "speaker"}-${index}-${
            transcript?.transcript_text || ""
          }`
        )
      )
    );

    setAssistantViewAll(null);
    setAssistantNotice(
      "Rule-generated test intelligence cleared."
    );

    appendMeetingAuditEvent(
      "meeting_test_intelligence_cleared",
      undefined,
      {
        meetingCode,
        clearedBy: currentViewerName,
      }
    );
  }

  async function generateClosingSummary() {
    try {
      const response = await fetch(
        `/api/riomind/meetings/${encodeURIComponent(meetingCode)}/live-intelligence`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Live meeting intelligence request failed.");
      }

      const payload = await response.json();
      const runtimeSummary = payload?.intelligence?.liveSummary;

      if (typeof runtimeSummary === "string" && runtimeSummary.trim()) {
        setLiveMeetingSummary(runtimeSummary);
      }

      setAssistantSection("summary");
      setAssistantNotice("Live summary refreshed from the RioMind runtime.");
      setIntelligenceSyncStatus("synced");

      appendMeetingAuditEvent(
        "meeting_closing_summary_generated",
        undefined,
        {
          meetingCode,
          source: "riomind-live-intelligence",
        }
      );
    } catch (error) {
      console.error("[live-meeting-summary]", error);
      setIntelligenceSyncStatus("error");
      setAssistantNotice(
        "The live RioMind summary could not be refreshed."
      );
    }
  }

  function answerMeetingQuestion(questionValue?: string) {
    const question = (
      questionValue ?? assistantQuestion
    ).trim();

    if (!question) return;

    const lower = question.toLowerCase();

    setAssistantConversation((messages) => [
      ...messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        body: question,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setAssistantQuestion("");
    setAssistantThinking(true);

    window.setTimeout(() => {
      let answer = "";

      if (
        lower.includes("decision") ||
        lower.includes("decided")
      ) {
        answer = detectedDecisions.length
          ? detectedDecisions
              .filter(
                (item) => item.status !== "dismissed"
              )
              .map(
                (item, index) =>
                  `${index + 1}. ${item.title}: ${item.detail}`
              )
              .join("\n")
          : "No decisions have been detected yet.";
      } else if (
        lower.includes("action") ||
        lower.includes("owner") ||
        lower.includes("task")
      ) {
        answer = detectedActions.length
          ? detectedActions
              .filter(
                (item) => item.status !== "dismissed"
              )
              .map(
                (item, index) =>
                  `${index + 1}. ${item.title} — Owner: ${
                    item.owner || "Unassigned"
                  }${
                    item.due
                      ? ` — Due: ${item.due}`
                      : ""
                  }`
              )
              .join("\n")
          : "No action items are currently tracked.";
      } else if (
        lower.includes("risk") ||
        lower.includes("blocker")
      ) {
        answer = detectedRisks
          .filter(
            (item) =>
              item.status !== "resolved" &&
              item.status !== "dismissed"
          )
          .map(
            (item, index) =>
              `${index + 1}. ${item.title}: ${item.detail}`
          )
          .join("\n");

        if (!answer) {
          answer = "No unresolved risks are currently tracked.";
        }
      } else if (
        lower.includes("question") ||
        lower.includes("unresolved")
      ) {
        answer = openMeetingQuestions
          .filter(
            (item) =>
              item.status !== "resolved" &&
              item.status !== "dismissed"
          )
          .map(
            (item, index) =>
              `${index + 1}. ${item.title}`
          )
          .join("\n");

        if (!answer) {
          answer = "There are no open questions.";
        }
      } else if (
        lower.includes("sarah")
      ) {
        const sarahMessages = meetingChatMessages.filter(
          (message) => message.sender === "Sarah"
        );

        answer = sarahMessages.length
          ? `Sarah's latest recorded contribution: "${
              sarahMessages[
                sarahMessages.length - 1
              ].body
            }"`
          : "No contribution from Sarah is available in the current meeting context.";
      } else if (
        lower.includes("summary") ||
        lower.includes("summarize")
      ) {
        answer = liveMeetingSummary;
      } else if (
        lower.includes("record")
      ) {
        answer = recordingActive
          ? "Recording is active and the configured consent policy has been satisfied."
          : recordingConsentRequested
          ? "Recording consent is pending."
          : "Recording is currently off.";
      } else if (
        lower.includes("translation") ||
        lower.includes("language")
      ) {
        answer = `The current listener route is ${languageLabel(
          sourceLanguage
        )} → ${languageLabel(
          listenLanguage
        )}. Active participant languages are ${meetingLanguageCodes
          .map((code) => languageLabel(String(code)))
          .join(", ")}.`;
      } else if (
        lower.includes("hand") ||
        lower.includes("queue")
      ) {
        answer =
          raisedHandCount > 0
            ? `${raisedHandCount} participant${
                raisedHandCount === 1 ? " is" : "s are"
              } waiting in the raised-hand queue.`
            : "No participants are waiting in the raised-hand queue.";
      } else {
        answer =
          "I can answer questions about the live summary, decisions, action items, risks, open questions, participants, recording, translation, and speaking queue.";
      }

      setAssistantConversation((messages) => [
        ...messages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          body: answer,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      setAssistantThinking(false);

      appendMeetingAuditEvent(
        "meeting_assistant_question_answered",
        undefined,
        {
          meetingCode,
          questionLength: question.length,
        }
      );
    }, 450);
  }

  function handleAssistantSuggestion(
    suggestion: {
      id: string;
      kind: string;
    }
  ) {
    if (suggestion.kind === "queue") {
      setPeopleDrawerOpen(true);
      setBottomPanel("participants");
      setAssistantNotice("Raised-hand queue opened.");
    }

    if (suggestion.kind === "summary") {
      generateClosingSummary();
    }

    if (suggestion.kind === "decisions") {
      setAssistantSection("decisions");
    }

    if (
      suggestion.kind === "actions" ||
      suggestion.kind === "commitments"
    ) {
      setAssistantSection("actions");
    }

    if (suggestion.kind === "risks") {
      setAssistantSection("risks");
    }

    if (suggestion.kind === "questions") {
      setAssistantSection("questions");
    }

    setAssistantSuggestions((suggestions) =>
      suggestions.map((item) =>
        item.id === suggestion.id
          ? { ...item, dismissed: true }
          : item
      )
    );
  }

  function sendMeetingChatMessage() {
    const body = chatDraft.trim();
    if (!body) return;
    setMeetingChatMessages((messages) => [
      ...messages,
      {
        id: `m${Date.now()}`,
        sender: "John",
        role: "Host",
        time: "Now",
        language: listenLanguage,
        body,
      },
    ]);
    setChatDraft("");
    setChatActionStatus("Message sent to meeting chat");
  }

  function chatQuickAction(action: string) {
    setChatActionStatus(action);
  }


  function appendMeetingAuditEvent(
    action: string,
    target?: string,
    metadata?: Record<string, unknown>
  ) {
    setMeetingAuditEvents((events) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action,
        actor: currentViewerName,
        target,
        timestamp: new Date().toISOString(),
        metadata,
      },
      ...events,
    ].slice(0, 100));

    // Server-side audit persistence will later POST this event to the
    // canonical meeting audit endpoint. For now this is a UI/runtime
    // foundation and visible lifecycle feedback.
  }

  function openReportAbuse(participantNameValue: string) {
    setReportedParticipantName(participantNameValue);
    setReportAbuseType("");
    setReportAbuseDescription("");
    setReportIncludeClip(false);
    setReportIncludeTranscript(false);
    setReportIncludeScreenshot(false);
    setReportIncludeSharedFile(false);
    setReportStatus("");
    setReportAbuseOpen(true);
    setOpenParticipantMenu(null);
  }

  function submitAbuseReport() {
    if (!reportedParticipantName || !reportAbuseType || !reportAbuseDescription.trim()) {
      setReportStatus("Complete the abuse type, participant, and description.");
      return;
    }

    appendMeetingAuditEvent(
      "abuse_report_submitted",
      reportedParticipantName,
      {
        abuseType: reportAbuseType,
        descriptionLength: reportAbuseDescription.trim().length,
        includeClip: reportIncludeClip,
        includeTranscript: reportIncludeTranscript,
        includeScreenshot: reportIncludeScreenshot,
        includeSharedFile: reportIncludeSharedFile,
        meetingCode,
      }
    );

    setReportStatus("Report submitted securely for review.");
    setToolActionStatus(`${reportedParticipantName}: abuse report submitted`);

    window.setTimeout(() => {
      setReportAbuseOpen(false);
      setReportStatus("");
    }, 900);
  }

  function initializeRecordingConsent() {
    const nextConsentState: Record<
      string,
      {
        status: "pending" | "agreed" | "declined" | "left" | "exempt";
        respondedAt?: string;
      }
    > = {};

    consentEligibleParticipants.forEach((participant: any, index: number) => {
      const name = participantName(participant, index);
     const participantKey =
  participantIdentity(participant, index);
      nextConsentState[name] = {
        status:
          recordingPolicy === "organization_authorized"
            ? "exempt"
            : name === currentViewerName
            ? "agreed"
            : "pending",
        respondedAt:
          recordingPolicy === "organization_authorized" ||
          name === currentViewerName
            ? new Date().toISOString()
            : undefined,
      };
    });

    setRecordingConsentState(nextConsentState);
    setRecordingConsentRequested(true);

    appendMeetingAuditEvent("recording_consent_requested", undefined, {
      meetingCode,
      meetingCategory,
      recordingPolicy,
      participantCount: consentEligibleParticipants.length,
    });

    const nextPendingParticipant = consentEligibleParticipants.find(
      (participant: any, index: number) =>
        participantName(participant, index) !== currentViewerName
    );

    if (nextPendingParticipant) {
      setRecordingConsentViewer(participantName(nextPendingParticipant));
      setRecordingConsentNoticeOpen(true);
    }
  }

  function respondToRecordingConsent(
    participantNameValue: string,
    response: "agreed" | "declined" | "left"
  ) {
    setRecordingConsentState((current) => ({
      ...current,
      [participantNameValue]: {
        status: response,
        respondedAt: new Date().toISOString(),
      },
    }));

    appendMeetingAuditEvent(
      response === "agreed"
        ? "recording_consent_agreed"
        : response === "declined"
        ? "recording_consent_declined"
        : "recording_consent_left",
      participantNameValue,
      {
        meetingCode,
        recordingPolicy,
      }
    );

    setRecordingConsentNoticeOpen(false);
    setRecordingConsentViewer("");

    setMeetingLifecycleStatus(
      response === "agreed"
        ? `${participantNameValue} agreed to recording.`
        : response === "declined"
        ? `${participantNameValue} declined recording.`
        : `${participantNameValue} chose to leave instead of being recorded.`
    );
  }

  function requestConsentFromParticipant(participantNameValue: string) {
    setRecordingConsentViewer(participantNameValue);
    setRecordingConsentNoticeOpen(true);
  }

  function startRecordingAfterConsent() {
    if (!currentViewerIsHostOrAdmin) return;

    if (!recordingPolicySatisfied) {
      setMeetingLifecycleStatus(
        "Recording cannot start until the consent policy is satisfied."
      );
      return;
    }

    setRecordingActive(true);
    setMeetingLifecycleDialog(null);

    appendMeetingAuditEvent("recording_started", undefined, {
      meetingCode,
      meetingCategory,
      recordingPolicy,
      agreedCount: agreedConsentCount,
      declinedCount: declinedConsentCount,
      pendingCount: pendingConsentCount,
    });

    setMeetingLifecycleStatus("Recording started after consent verification.");
  }

  function transferHostAuthority() {
    if (!currentViewerIsHostOrAdmin || !transferHostTarget) {
      setMeetingLifecycleStatus(
        "Select an eligible participant before changing host authority."
      );
      return;
    }

    if (hostTransferMode === "make-cohost") {
      setParticipantControlState((current) => ({
        ...current,
        [transferHostTarget]: {
          ...(current[transferHostTarget] || {}),
          role: "Co-host",
        },
      }));

      appendMeetingAuditEvent("cohost_assigned", transferHostTarget, {
        assignedBy: currentViewerName,
        meetingCode,
      });

      setMeetingLifecycleStatus(
        `${transferHostTarget} is now a co-host.`
      );
    } else {
      setParticipantControlState((current) => ({
        ...current,
        [currentViewerName]: {
          ...(current[currentViewerName] || {}),
          role:
            currentViewerName === meetingOwnerName
              ? "Participant"
              : "Participant",
        },
        [transferHostTarget]: {
          ...(current[transferHostTarget] || {}),
          role: "Host",
        },
      }));

      appendMeetingAuditEvent("host_transferred", transferHostTarget, {
        previousHost: currentViewerName,
        meetingCode,
        transferMode: "complete-transfer",
      });

      setMeetingLifecycleStatus(
        `Host authority transferred to ${transferHostTarget}.`
      );
    }

    setTransferHostTarget("");
    setHostTransferMode("complete-transfer");
    setMeetingLifecycleDialog(null);
  }

  function requestHostControl() {
    const request = {
      requester: currentViewerName,
      requestedAt: new Date().toISOString(),
      status: "pending" as const,
    };

    setHostControlRequest(request);

    appendMeetingAuditEvent(
      "host_control_requested",
      primaryHostName,
      {
        requester: currentViewerName,
        meetingCode,
      }
    );

    setMeetingLifecycleStatus(
      `Host-control request sent to ${primaryHostName}.`
    );

    setMeetingLifecycleDialog(null);
  }

  function resolveHostControlRequest(
    resolution: "approved-host" | "approved-cohost" | "declined"
  ) {
    if (!currentViewerIsHostOrAdmin || !hostControlRequest) return;

    const requester = hostControlRequest.requester;

    if (resolution === "approved-host") {
      setParticipantControlState((current) => ({
        ...current,
        [currentViewerName]: {
          ...(current[currentViewerName] || {}),
          role: "Participant",
        },
        [requester]: {
          ...(current[requester] || {}),
          role: "Host",
        },
      }));

      appendMeetingAuditEvent(
        "host_request_approved",
        requester,
        {
          approvedBy: currentViewerName,
          authorityGranted: "Host",
        }
      );

      setMeetingLifecycleStatus(
        `${requester} is now the meeting host.`
      );
    }

    if (resolution === "approved-cohost") {
      setParticipantControlState((current) => ({
        ...current,
        [requester]: {
          ...(current[requester] || {}),
          role: "Co-host",
        },
      }));

      appendMeetingAuditEvent(
        "host_request_approved",
        requester,
        {
          approvedBy: currentViewerName,
          authorityGranted: "Co-host",
        }
      );

      setMeetingLifecycleStatus(
        `${requester} is now a co-host.`
      );
    }

    if (resolution === "declined") {
      appendMeetingAuditEvent(
        "host_request_declined",
        requester,
        {
          declinedBy: currentViewerName,
        }
      );

      setMeetingLifecycleStatus(
        `Host-control request from ${requester} was declined.`
      );
    }

    setHostControlRequest({
      ...hostControlRequest,
      status: resolution,
    });

    setMeetingLifecycleDialog(null);
  }

  function recoverMeetingOwnerAuthority() {
    if (!currentViewerIsMeetingOwner) {
      setMeetingLifecycleStatus(
        "Only the meeting owner or organization administrator may use emergency recovery."
      );
      setMeetingLifecycleDialog(null);
      return;
    }

    setParticipantControlState((current) => {
      const next = { ...current };

      meetingParticipants.forEach((participant: any, index: number) => {
        const name = participantName(participant, index);
        const participantKey =
        participantIdentity(participant, index);

        const role =
          current[name]?.role || participantRole(participant);

        if (
          name !== meetingOwnerName &&
          (role === "Host" || role === "Owner")
        ) {
          next[name] = {
            ...(next[name] || {}),
            role: "Co-host",
          };
        }
      });

      next[meetingOwnerName] = {
        ...(next[meetingOwnerName] || {}),
        role: "Host",
      };

      return next;
    });

    appendMeetingAuditEvent(
      "meeting_owner_authority_recovered",
      meetingOwnerName,
      {
        previousPrimaryHost: primaryHostName,
        meetingCode,
        reason: "owner-emergency-recovery",
      }
    );

    setMeetingLifecycleStatus(
      `${meetingOwnerName} recovered host authority as meeting owner.`
    );

    setMeetingLifecycleDialog(null);
  }

  function confirmMeetingLifecycleAction() {
    const action = meetingLifecycleDialog;
    if (!action) return;

    if (action === "leave") {
      appendMeetingAuditEvent("participant_left_meeting", currentViewerName, {
        meetingCode,
      });
      setMeetingLifecycleStatus("You left the meeting.");
      window.location.href = `/nexus/meetings/${meetingCode}`;
      return;
    }

    if (action === "end") {
      if (!currentViewerIsHostOrAdmin) {
        setMeetingLifecycleStatus("Only a host or admin may end the meeting.");
        setMeetingLifecycleDialog(null);
        return;
      }

      appendMeetingAuditEvent("meeting_ended_for_everyone", undefined, {
        meetingCode,
      });
      setMeetingEnded(true);
      setMeetingLifecycleStatus("Meeting ended for everyone.");
      setMeetingLifecycleDialog(null);
      return;
    }

    if (action === "lock") {
      if (!currentViewerIsHostOrAdmin) return;
      setMeetingLocked(true);
      appendMeetingAuditEvent("meeting_locked");
      setMeetingLifecycleStatus("Meeting locked. New entry is blocked.");
      setMeetingLifecycleDialog(null);
      return;
    }

    if (action === "unlock") {
      if (!currentViewerIsHostOrAdmin) return;
      setMeetingLocked(false);
      appendMeetingAuditEvent("meeting_unlocked");
      setMeetingLifecycleStatus("Meeting unlocked.");
      setMeetingLifecycleDialog(null);
      return;
    }

    if (action === "record-start") {
      if (!currentViewerIsHostOrAdmin) return;

      if (recordingPolicy === "recording_disabled") {
        setMeetingLifecycleStatus(
          "Recording is disabled for this meeting category or policy."
        );
        setMeetingLifecycleDialog(null);
        return;
      }

      initializeRecordingConsent();
      setMeetingLifecycleStatus(
        "Recording consent requested. Recording has not started yet."
      );
      setMeetingLifecycleDialog("recording-consent");
      return;
    }

    if (action === "record-stop") {
      if (!currentViewerIsHostOrAdmin) return;
      setRecordingActive(false);
      appendMeetingAuditEvent("recording_stopped");
      setMeetingLifecycleStatus("Recording stopped.");
      setMeetingLifecycleDialog(null);
      return;
    }

    if (action === "transfer-host") {
      transferHostAuthority();
      return;
    }

    if (action === "request-host") {
      requestHostControl();
      return;
    }

    if (action === "owner-recovery") {
      recoverMeetingOwnerAuthority();
      return;
    }
  }

  useEffect(() => {
    const newMessages = meetingChatMessages.filter(
      (message) =>
        !processedChatIntelligenceIds.current.has(
          String(message.id)
        )
    );

    if (!newMessages.length) return;

    newMessages.forEach((message) => {
      const sourceId = String(message.id);

      processedChatIntelligenceIds.current.add(sourceId);

      const detections = detectMeetingIntelligence({
        meetingCode,
        sourceType: "chat",
        sourceId,
        sourceText: message.body || "",
        speaker: message.sender,
        language: message.language,
        createdAt: new Date().toISOString(),
      });

      ingestMeetingDetections(detections);
    });
  }, [meetingChatMessages, meetingCode]);

  useEffect(() => {
    if (!Array.isArray(transcripts) || !transcripts.length) {
      return;
    }

    transcripts.forEach((transcript: any, index: number) => {
      const sourceId = String(
        transcript?.id ||
          transcript?.transcript_id ||
          transcript?.created_at ||
          `${transcript?.speaker_name || "speaker"}-${index}-${
            transcript?.transcript_text || ""
          }`
      );

      if (
        processedTranscriptIntelligenceIds.current.has(sourceId)
      ) {
        return;
      }

      processedTranscriptIntelligenceIds.current.add(sourceId);

      const detections = detectMeetingIntelligence({
        meetingCode,
        sourceType: "transcript",
        sourceId,
        sourceText:
          transcript?.transcript_text ||
          transcript?.text ||
          transcript?.message ||
          "",
        speaker:
          transcript?.speaker_name ||
          transcript?.speaker ||
          "Speaker",
        participantId:
          transcript?.participant_id ||
          transcript?.speaker_id,
        language:
          transcript?.language ||
          transcript?.source_language,
        createdAt:
          transcript?.created_at ||
          transcript?.timestamp ||
          new Date().toISOString(),
      });

      ingestMeetingDetections(detections);
    });
  }, [transcripts, meetingCode]);

  useEffect(() => {
    const recentTimeline = intelligenceTimeline.slice(0, 5);

    if (!recentTimeline.length) return;

    const typeCounts = recentTimeline.reduce<
      Record<string, number>
    >((counts, item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
      return counts;
    }, {});

    const fragments = Object.entries(typeCounts).map(
      ([type, count]) =>
        `${count} ${type}${count === 1 ? "" : "s"}`
    );

    setLiveMeetingSummary(
      `Nexus is observing ${humanParticipantCount} active participants. Recent meeting intelligence includes ${fragments.join(
        ", "
      )}. Translation is routing ${languageLabel(
        sourceLanguage
      )} into ${languageLabel(
        listenLanguage
      )}.`
    );
  }, [
    intelligenceTimeline,
    humanParticipantCount,
    sourceLanguage,
    listenLanguage,
  ]);

    return (
  <SimpleMeetingShell
    meetingCode={meetingCode}
    meetingTitle={meeting?.title || meeting?.name || "Nexus Team Meeting"}
    participantCount={humanParticipantCount}
    activeSurface={meetingSurfaceFromWorkspace()}
    onSurfaceChange={handleMeetingSurfaceChange}
    muted={!meetingPresence.microphoneEnabled}
    cameraOn={meetingPresence.cameraEnabled}
    voiceConnected={meetingPresence.microphoneEnabled}
    onLeave={handleMeetingShellLeave}
    onShare={handleMeetingShellShare}
    onMoreAction={handleMeetingShellMore}
  >
    <main className="min-h-screen overflow-x-hidden bg-[#070d14] text-slate-100">
      <div className="grid min-h-screen min-w-0 grid-cols-[72px_170px_minmax(0,1fr)_280px]">
        <aside className="border-r border-white/10 bg-black/30 px-3 py-5">
          <div className="mb-6">
            <NexusLogo compact />
          </div>

            {[
              ["📈", "Activity"],
              ["👥", "Teams"],
              ["📅", "Calendar"],
              ["📞", "Calls"],
              ["nexus-logo", "Nexus"],
              ["🚀", "Apps"],
            ].map(([icon, item]) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                  if (item === "Activity") {
                    setLeftUtilityPanel("activity");
                  } else if (item === "Teams") {
                    setLeftUtilityPanel("teams");
                  } else if (item === "Calls") {
                    setLeftUtilityPanel("calls");
                  } else if (item === "Apps") {
                    setLeftUtilityPanel("apps");
                  } else if (item === "Calendar") {
                    window.location.href = `/nexus/meetings/${meetingCode}/calendar`;
                  } else if (item === "Nexus") {
                    window.location.href = "/nexus";
                  } else {
                    setAppView("meeting");
                  }
                }}
              className={`mb-5 block w-full rounded-2xl px-2 py-3 text-center text-xs ${
                (item === "Activity" && leftUtilityPanel === "activity") ||
                (item === "Teams" && leftUtilityPanel === "teams") ||
                (item === "Calls" && leftUtilityPanel === "calls") ||
                (item === "Apps" && leftUtilityPanel === "apps") ||
                (item === "Calendar" && appView === "calendar")
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400 hover:bg-white/10"
              }`}
            >
              <div className="text-lg">●</div>
              {item}
            </button>
          ))}
        </aside>

            {leftUtilityPanel && (
              <div className="fixed left-[72px] top-0 z-[99999] h-screen w-[470px] overflow-y-auto border-r border-cyan-400/20 bg-[#07111c] p-6 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                      {leftUtilityPanel === "activity" ? "Live timeline" : leftUtilityPanel === "teams" ? "Team workspace" : leftUtilityPanel === "calls" ? "Communication hub" : "Workspace apps"}
                    </div>
                    <h2 className="mt-2 text-3xl font-black">
                      {leftUtilityPanel === "activity" ? "Meeting Activity" : leftUtilityPanel === "teams" ? "Team Room" : leftUtilityPanel === "calls" ? "Call Center" : "App Launcher"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {leftUtilityPanel === "activity"
                        ? "Live meeting events, AI signals, decisions, and action updates."
                        : leftUtilityPanel === "calls"
                        ? "Join, start, and route calls without leaving the meeting room."
                        : leftUtilityPanel === "teams"
                        ? "Members, roles, invite, presence, and permissions."
                        : "Open Spherio and RioMind products from inside the meeting workspace."}
                    </p>
                  </div>
                  <button onClick={() => setLeftUtilityPanel(null)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]">
                    Close
                  </button>
                </div>

                {leftUtilityPanel === "activity" ? (
                  <div className="mt-7 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[["Events", "6"], ["AI", "2"], ["Open", "1"]].map(([label, value]) => (
                        <div key={label} className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                          <div className="mt-2 text-3xl font-black text-cyan-100">{value}</div>
                        </div>
                      ))}
                    </div>

                    {[["👤", "09:42", "John joined", "People", "Host entered the room.", "Open profile"], ["✋", "09:43", "Sarah raised hand", "Request", "Pending speaker permission.", "Review"], ["●", "09:44", "Recording started", "Record", "Meeting capture is active.", "Open recording"], ["🧠", "09:45", "Decision detected", "AI", "Nexus flagged a decision candidate.", "Approve"], ["✅", "09:46", "Action item created", "Task", "Follow-up item added.", "Assign"], ["✨", "09:47", "AI summary updated", "AI", "Live summary refreshed.", "View"]].map(([icon, time, title, tag, body, action]) => (
                      <button key={title} onClick={() => setMoreToolPanel(title)} className="group w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06] hover:shadow-[0_16px_50px_rgba(34,211,238,0.10)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-2xl">{icon}</div>
                            <div>
                              <div className="text-xs font-black text-cyan-300">{time}</div>
                              <div className="mt-1 text-lg font-black">{title}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">{tag}</span>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">{body}</p>
                        <div className="mt-4 flex items-center justify-between text-xs font-black text-cyan-300">
                          <span>{action}</span>
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                {leftUtilityPanel === "teams" ? (
                  <div className="mt-7 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[["Members", "1"], ["Roles", "6"], ["Online", "2"]].map(([label, value]) => (
                        <div key={label} className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                          <div className="mt-2 text-3xl font-black text-cyan-100">{value}</div>
                        </div>
                      ))}
                    </div>

                    {[["👑", "John", "Owner", "online", "Host and room owner"], ["🧠", "Nexus AI", "Analyst", "active", "Meeting intelligence assistant"], ["👥", "Invited users", "Viewer", "waiting", "No external participants joined yet"]].map(([icon, name, role, status, body]) => (
                      <button key={name} onClick={() => setMoreToolPanel(name)} className="group w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-2xl">{icon}</span>
                            <div>
                              <div className="text-lg font-black">{name}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{role}</div>
                            </div>
                          </div>
                          <span className="flex items-center gap-2 rounded-full border border-cyan-300/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />{status}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">{body}</p>
                      </button>
                    ))}

                    <button onClick={() => setMoreToolPanel("Team Permissions")} className="w-full rounded-3xl border border-purple-300/20 bg-purple-300/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-purple-300/40">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">Permissions</div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-300">
                        {[
                          ["👑", "Owner", "John", "Can manage meeting, members, roles, and room controls"],
                          ["🛡️", "Admin", "User X", "Can invite members and manage workspace access"],
                          ["🎙️", "Manager", "User X", "Can approve speakers, raised hands, and room flow"],
                          ["🧠", "Analyst", "Nexus AI", "Can review reports, decisions, risks, and summaries"],
                          ["👁️", "Viewer", "Invited users", "Can watch and receive shared meeting context"],
                        ].map(([icon, role, user, detail]) => (
                          <button
                            key={role}
                            onClick={() => {
                              setToolActionStatus(`${role}: permission selected`);
                              setMoreToolPanel(`${role} Permission`);
                            }}
                            className="group w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10">{icon}</span>
                                <div>
                                  <div className="font-black text-white">{role}</div>
                                  <div className="text-xs text-slate-400">{detail}</div>
                                </div>
                              </div>
                              <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                                {user}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </button>

                    <button onClick={() => setMoreToolPanel("Invite member")} className="w-full rounded-3xl border border-emerald-300/30 bg-emerald-300/10 p-5 text-left font-black text-emerald-100 transition hover:-translate-y-1 hover:bg-emerald-300/[0.14]">
                      Invite member →
                    </button>
                  </div>
                ) : null}

                {leftUtilityPanel === "calls" ? (
                  <div className="mt-7 space-y-5">
                    <section className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-5 shadow-[0_0_35px_rgba(16,185,129,0.08)]">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Upcoming</div>
                      <button onClick={() => { setLeftUtilityPanel(null); setStageMode("participants"); }} className="group mt-4 w-full rounded-3xl border border-emerald-300/30 bg-black/20 p-5 text-left transition hover:-translate-y-1 hover:bg-emerald-300/[0.08]">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-emerald-100">Join current meeting</div>
                            <div className="mt-1 text-xs text-slate-300">Room {meetingCode} · live room ready</div>
                          </div>
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">LIVE</span>
                        </div>
                      </button>
                    </section>

                    <section className="space-y-3">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Quick actions</div>
                      {[["🎥", "Video Call", "Ready", "Start or join video call mode.", "Start"], ["🎙️", "Audio Call", "Ready", "Start audio-only call mode.", "Call"], ["📞", "Phone", "Bridge later", "Phone/SIP bridge placeholder.", "Setup"], ["🟢", "WhatsApp", "Bridge later", "WhatsApp routing bridge placeholder.", "Connect"]].map(([icon, title, status, body, action]) => (
                        <button key={title} onClick={() => setMoreToolPanel(title)} className="group w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06] hover:shadow-[0_16px_50px_rgba(34,211,238,0.10)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-300/10 text-2xl">{icon}</span>
                              <div>
                                <div className="text-lg font-black">{title}</div>
                                <p className="mt-1 text-sm text-slate-400">{body}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 animate-pulse rounded-full ${status === "Ready" ? "bg-emerald-400" : "bg-yellow-300"}`} />
                              <span className={`${status === "Ready" ? "text-emerald-300" : "text-yellow-300"} text-xs font-black`}>{status}</span>
                              <span className="text-slate-500 transition-transform group-hover:translate-x-1">→</span>
                            </div>
                          </div>
                          <div className="mt-4 text-xs font-black text-cyan-300">{action} →</div>
                        </button>
                      ))}
                    </section>

                    <section className="rounded-3xl border border-purple-300/20 bg-purple-300/[0.04] p-5">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">Enterprise later</div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-300">
                        {["SIP bridge", "Teams Bridge", "Zoom Bridge"].map((bridge) => (
                          <div key={bridge} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
                            <span>{bridge}</span><span className="text-xs text-slate-500">Coming soon</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}

                {leftUtilityPanel === "apps" ? (
                  <div className="mt-7 space-y-4">
                    <input placeholder="Search apps..." className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/40" />
                    {lastLaunchedApp ? (
                      <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-4 text-sm font-black text-emerald-200">
                        Launching {lastLaunchedApp}...
                      </div>
                    ) : null}
                    {[["🧠", "RioMind Platform", "AI platform, API keys, billing, and agents.", "/nexus", "Open"], ["💼", "RioLight", "Wallet, portfolio, assets, swaps, and signing.", "/riolight", "Launch"], ["🚀", "Prime", "Structured token launch and guided liquidity.", "/createtoken/prime", "Create"], ["🔥", "Pump.live", "Bonding curve launches and graduation.", "/pump.live", "Launch"], ["🔎", "RioExplorer", "Explorer, transactions, contracts, pools, and tokens.", "/rioexplorer", "Explore"], ["🌐", "Spherio SuperApp", "Main ecosystem hub.", "/", "Open"]].map(([icon, app, body, href, action]) => (
                      <button key={app} onClick={() => launchWorkspaceApp(app, href)} className="group w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/[0.06] hover:shadow-[0_16px_50px_rgba(34,211,238,0.10)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-2xl">{icon}</span><span className="font-black">{app}</span></div>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200">Pinned</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
                        <div className="mt-4 flex items-center justify-between text-xs font-black text-cyan-300"><span>{action}</span><span className="transition-transform group-hover:translate-x-1">→</span></div>
                      </button>
                    ))}
                    <div className="rounded-3xl border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-400">Enterprise users will later pin their own internal tools and private workflows here.</div>
                  </div>
                ) : null}
              </div>
            )}




        <aside className="min-w-0 border-r border-white/10 bg-[#0a111a] p-4">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Meeting workspace
            </div>

            <h1 className="mt-2 text-lg font-black leading-6 text-white">
              Nexus Team
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Meeting identity, language, interpretation, and participant controls.
            </p>
          </div>

            <section className="mt-6 rounded-3xl border border-white/10 bg-[#050b12]/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">My Language</div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  Auto mode
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Choose the language you want to speak, read, and hear. Other participants keep their own selected languages.
              </p>

              <select
                value={listenLanguage}
                onChange={(e) => {
                  const language = e.target.value;
                  setListenLanguage(language);

                  setParticipantControlState((current) => ({
                    ...current,
                    [currentViewerName]: {
                      ...(current[currentViewerName] || {}),
                      language,
                    },
                  }));
                }}
                className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3"
              >
                {MEETING_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>

              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</div>
                <div className="mt-2 space-y-2">
                  <div className="truncate text-lg font-black text-cyan-100">{languageLabel(listenLanguage)}</div>
                  <div className="inline-flex max-w-full rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-300">
                    {languageModeLabel || "Listening"}
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  When you are allowed to speak, your status changes automatically.
                </p>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Active participant languages
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {meetingLanguageCodes.map((code) => (
                    <span
                      key={String(code)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                        code === listenLanguage
                          ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      {languageLabel(String(code))}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-xs text-emerald-300">● Translation channel ready</p>
          </section>

          <section className="mt-5 rounded-3xl border border-white/10 bg-[#050b12]/[0.04] p-4">
            <div className="font-semibold">Meeting Info</div>
            <p className="mt-4 text-xs text-slate-400">Host</p>
            <p className="font-semibold">{hostName}</p>
            <p className="mt-4 text-xs text-slate-400">Room</p>
            <p className="break-all font-semibold">{meetingCode}</p>
            <p className="mt-4 text-xs text-slate-400">Participants</p>
            <p className="font-semibold">{humanParticipantCount}</p>
            <p className="mt-4 text-xs text-slate-400">Room State</p>
            <p className="font-semibold">{participantRoomMode}</p>

            <button
              onClick={() => navigator.clipboard?.writeText(inviteUrl)}
              className="mt-5 w-full rounded-xl bg-indigo-500 py-3 font-semibold"
            >
              Copy invite link
            </button>
          </section>

          <section className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
            <div className="font-semibold">Live Interpretation</div>
            <p className="mt-4 text-xs text-slate-400">Original Speech</p>
            <p className="font-semibold">{originalSpeechLanguage}</p>
            <p className="mt-4 text-xs text-slate-400">Live Translation</p>
            <p className="font-semibold">{translatedSpeechLanguage}</p>
            <p className="mt-4 text-xs text-slate-400">Caption</p>
            <p className="line-clamp-3 text-sm text-cyan-100">{latestCaption || "Waiting for translated speech..."}</p>
            <p className="mt-4 text-xs text-emerald-300">Future latency target: 2–5s</p>
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden p-4 xl:p-5">
          <header className="flex min-w-0 flex-col gap-4 pb-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                {meeting?.meeting_type === "instant"
                  ? "Instant meeting"
                  : meeting?.meeting_type === "personal"
                  ? "Personal meeting room"
                  : meeting?.meeting_type === "team_room"
                  ? "Team room meeting"
                  : "Scheduled meeting"}
              </div>

              <h2 className="mt-1 text-xl font-bold text-white">
                Nexus Team
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-400">
                Meeting ID {meetingCode}
                {" · "}
                Hosted by {hostName}
                {" · "}
                {humanParticipantCount} participant
                {humanParticipantCount === 1 ? "" : "s"}
              </p>
            </div>

              <MeetingToolbar>
             {PRIMARY_TOOLBAR_BUTTONS.map(
             ({ icon, label, panel }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === "Record") {
                      if (currentViewerIsHostOrAdmin) {
                        setMeetingLifecycleDialog(
                          recordingActive ? "record-stop" : "record-start"
                        );
                      } else {
                        setMeetingLifecycleStatus(
                          "Only a host or admin may control meeting recording."
                        );
                      }
                    }

                    if (panel === "chat") {
                      setBottomPanel("chat");
                      setTimeout(() => document.getElementById("nexus-meeting-chat-input")?.focus(), 80);
                    }
                    if (panel === "participants") {
                      setPeopleDrawerOpen(true);
                      setBottomPanel("participants");
                    }

                    if (panel === "raiseHands") {
                      setPeopleDrawerOpen(true);
                      setMoreToolPanel(null);
                    }
                    if (panel === "notes") { setRightPanel("notes"); setBottomPanel("ai"); }
                    if (panel === "files") { setRightPanel("files"); setBottomPanel("files"); }
                  }}
                  className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                    (panel === "chat" && bottomPanel === "chat") ||
                    (panel === "participants" && peopleDrawerOpen) ||
                    (panel === "notes" && rightPanel === "notes") ||
                    (panel === "files" && rightPanel === "files")
                      ? "border-indigo-300/50 bg-indigo-500/20 text-indigo-100"
                      : "border-white/10 bg-[#050b12]/[0.04]"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>
                    {label === "People"
                      ? `People (${humanParticipantCount})`
                      : label === "Raise Hands"
                      ? `Raise Hands (${raisedHandCount})`
                      : label === "Record" && recordingActive
                      ? "Recording"
                      : label}
                  </span>
                </button>
              ))}

              <button onClick={() => setOpenMenu(openMenu === "react" ? null : "react")} className="flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#050b12]/[0.04] px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                <span className="text-lg">😊</span><span>React</span>
              </button>

              <button
                type="button"
                aria-expanded={openMenu === "view"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "view" ? null : "view"
                  )
                }
                className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                  openMenu === "view"
                    ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
                    : "border-white/10 bg-[#050b12]/[0.04]"
                }`}
              >
                <span className="text-lg">▦</span>
                <span>View</span>
              </button>

              <button onClick={() => setOpenMenu(openMenu === "controls" ? null : "controls")} className="flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#050b12]/[0.04] px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                <span className="text-lg">🛡️</span><span>Controls</span>
              </button>

              <button
                onClick={() => setOpenMenu(openMenu === "more" ? null : "more")}
                className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${openMenu === "more" ? "border-indigo-300/50 bg-indigo-500/20 text-indigo-100" : "border-white/10 bg-[#050b12]/[0.04]"}`}
              >
                <span className="text-lg">⋯</span><span>More</span>
              </button>

              <button onClick={() => setOpenMenu(openMenu === "camera" ? null : "camera")} className="flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#050b12]/[0.04] px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                <span className="text-lg">📷</span><span>Camera</span>
              </button>

              <button onClick={() => setOpenMenu(openMenu === "mic" ? null : "mic")} className="flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#050b12]/[0.04] px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                <span className="text-lg">🎙️</span><span>Mic</span>
              </button>

              <button
                type="button"
                aria-expanded={openMenu === "share"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "share" ? null : "share"
                  )
                }
                className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/50 ${
                  openMenu === "share"
                    ? "border-purple-300/50 bg-purple-500/20 text-purple-100"
                    : "border-white/10 bg-[#050b12]/[0.04]"
                }`}
              >
                <span className="text-lg">⬆️</span>
                <span>Share</span>
              </button>

              <button
                type="button"
                aria-expanded={openMenu === "video"}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === "video" ? null : "video"
                  )
                }
                className={`flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                  openMenu === "video"
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                    : "border-cyan-300/20 bg-cyan-300/[0.06]"
                }`}
              >
                <span className="text-lg">🎬</span>
                <span>Video</span>
              </button>

              {openMenu === "react" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[min(520px,35vw)] top-[70px] z-50 flex gap-4 rounded-2xl border border-white/10 bg-[#111a25] px-5 py-4 text-2xl shadow-2xl">
                  {["👍", "❤️", "👏", "😆", "😮"].map((r) => <button key={r}>{r}</button>)}
                </div>
              ) : null}

              {openMenu === "view" ? (
                <div
                  data-nexus-toolbar-dropdown
                  className="absolute right-[340px] top-[70px] z-50 w-[340px] rounded-2xl border border-cyan-300/20 bg-[#111a25] p-5 shadow-2xl"
                >
                  <div className="text-lg font-bold">
                    Meeting view
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Change how participants and shared content appear
                    without changing meeting permissions.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStageView("grid");
                        setStageMode("participants");
                        setOpenMenu(null);
                      }}
                      className={`rounded-xl border p-3 text-left ${
                        stageView === "grid"
                          ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="font-black">Gallery</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Show the participant grid
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStageView("presentation");
                        setStageMode("presentation");
                        setOpenMenu(null);
                      }}
                      className={`rounded-xl border p-3 text-left ${
                        stageView === "presentation"
                          ? "border-purple-300/40 bg-purple-300/10 text-purple-100"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="font-black">Focus content</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Prioritize shared content
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBottomPanel("voice");
                        setOpenMenu(null);
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-left"
                    >
                      <div className="font-black">Captions</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Open transcript and translation
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await document.documentElement.requestFullscreen();
                        } catch {}
                        setOpenMenu(null);
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-left"
                    >
                      <div className="font-black">Full screen</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Expand the meeting workspace
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}

              {openMenu === "controls" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[min(360px,25vw)] top-[70px] z-50 w-[min(420px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#111a25] p-5 shadow-2xl">
                  <div className="text-lg font-bold">Meeting controls</div>
                  <p className="mt-1 text-xs text-slate-400">Host permissions and security controls.</p>

                  <div className="mt-4 text-sm font-semibold text-slate-300">Allow all participants to:</div>
                  {[
                    ["Present", allowPresent, setAllowPresent],
                    ["Chat", allowChat, setAllowChat],
                    ["Unmute themselves", allowUnmute, setAllowUnmute],
                    ["Turn on their cameras", allowCamera, setAllowCamera],
                  ].map(([label, enabled, setter]: any) => (
                    <button key={label} onClick={() => setter(!enabled)} className="flex w-full items-center justify-between border-b border-white/10 py-3 text-left text-sm">
                      <span>{label}</span>
                      <span className={enabled ? "text-emerald-300" : "text-slate-500"}>{enabled ? "ON" : "OFF"}</span>
                    </button>
                  ))}

                  <div className="mt-5 text-sm font-semibold text-slate-300">
                    Recording policy
                  </div>

                  <div className="mt-3 grid gap-3">
                    <label className="block">
                      <span className="text-xs text-slate-400">Meeting category</span>
                      <select
                        value={meetingCategory}
                        onChange={(event) =>
                          updateMeetingCategory(event.target.value as any)
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"
                      >
                        <option value="private">Private conversation</option>
                        <option value="internal">Team / internal meeting</option>
                        <option value="interview">Interview / HR</option>
                        <option value="training">Training session</option>
                        <option value="webinar">Webinar</option>
                        <option value="public-broadcast">Public broadcast</option>
                        <option value="sensitive">Sensitive / regulated</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs text-slate-400">Consent policy</span>
                      <select
                        value={recordingPolicy}
                        onChange={(event) =>
                          setRecordingPolicy(event.target.value as any)
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"
                      >
                        <option value="all_explicit_consent">
                          All participants must explicitly agree
                        </option>
                        <option value="acknowledge_or_leave">
                          Acknowledge recording or leave
                        </option>
                        <option value="organization_authorized">
                          Organization authorized with mandatory notice
                        </option>
                        <option value="recording_disabled">
                          Recording disabled
                        </option>
                      </select>
                    </label>

                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3 text-xs leading-5 text-slate-300">
                      <div className="font-black text-cyan-200">
                        {recordingPolicyLabel()}
                      </div>
                      <p className="mt-1 text-slate-400">
                        Participants receive a clear recording notice. Voice-profile
                        or voice-cloning consent remains separate from recording consent.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 text-sm font-semibold text-slate-300">Security</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Waiting Room", waitingRoomEnabled, setWaitingRoomEnabled],
                      ["Auto Admit", autoAdmitEnabled, setAutoAdmitEnabled],
                      ["Pause Entry", pauseEntryEnabled, setPauseEntryEnabled],
                      ["Meeting Lock", meetingLocked, setMeetingLocked],
                      ["Guest Access", guestAccessEnabled, setGuestAccessEnabled],
                      ["Domain Restriction", domainRestrictionEnabled, setDomainRestrictionEnabled],
                    ].map(([label, enabled, setter]: any) => (
                      <button key={label} onClick={() => setter(!enabled)} className={`rounded-xl border p-3 text-left ${enabled ? "border-emerald-300/30 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}>
                        <div>{label}</div>
                        <div className={enabled ? "mt-1 font-bold text-emerald-300" : "mt-1 font-bold text-slate-500"}>{enabled ? "ON" : "OFF"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {openMenu === "more" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[300px] top-[70px] z-30 w-[420px] rounded-2xl border border-white/10 bg-[#111a25] p-5 shadow-2xl">
                  <div className="text-lg font-bold">More meeting tools</div>
                  <p className="mt-1 text-xs text-slate-400">Click a tool to open its workspace panel.</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenMenu("react")}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"
                    >
                      <div className="text-xl">😊</div>
                      <div className="mt-1 text-xs font-black">Reactions</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMenu("view")}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"
                    >
                      <div className="text-xl">▦</div>
                      <div className="mt-1 text-xs font-black">View</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMenu("controls")}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"
                    >
                      <div className="text-xl">🛡️</div>
                      <div className="mt-1 text-xs font-black">Controls</div>
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {[
                      ["Meeting Administration", "Host, room, lifecycle, lock state."],
                      ["Gallery Controls", "Participant cards, mic, mute, hand and status."],
                      ["Invite Participant", "Invite by name, email, role and language."],
                      ["Raise Hands Queue", "Approve next speaker."],
                      ["Recordings", "Transcript, audio, video and AI notes."],
                      ["Conference Analytics", "Attendance, latency and quality."],
                    ].map(([title, desc]) => (
                      <button
                        key={title}
                        onClick={() => {
                          setMoreToolPanel(title);
                          setOpenMenu(null);
                        }}
                        className="rounded-xl border border-white/10 bg-black/20 p-3 text-left hover:bg-[#050b12]/[0.06]"
                      >
                        <div className="font-semibold">{title}</div>
                        <div className="mt-1 text-xs text-slate-400">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {openMenu === "camera" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[220px] top-[70px] z-30 w-96 rounded-2xl border border-white/10 bg-[#111a25] p-5 shadow-2xl">
                  <div className="font-bold">Camera</div>
                  <p className="mt-3 text-sm text-slate-300">System camera and background controls.</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["None", "Blur", "Studio"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setCameraMode(item)}
                        className={`rounded-xl border p-3 text-sm ${cameraMode === item ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/5"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        stream.getTracks().forEach((track) => track.stop());
                        setCameraMode("System camera");
                      } catch {}
                    }}
                    className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-white"
                  >
                    Open system camera
                  </button>
                </div>
              ) : null}

              {openMenu === "mic" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[160px] top-[70px] z-30 w-96 rounded-2xl border border-white/10 bg-[#111a25] p-5 shadow-2xl">
                  <div className="font-bold">Audio settings</div>
                  <p className="mt-3 text-sm text-slate-300">Speaker: System output</p>
                  <div className="mt-4 grid gap-2">
                    {["Translation mic input", "System microphone", "Muted"].map((item) => (
                      <button
                        key={item}
                        onClick={async () => {
                          setMicMode(item);
                          if (item === "System microphone") {
                            try {
                              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              stream.getTracks().forEach((track) => track.stop());
                            } catch {}
                          }
                        }}
                        className={`rounded-xl border px-4 py-3 text-left ${micMode === item ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.04]"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {openMenu === "share" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-0 top-[70px] z-50 w-[min(420px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#111a25] p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-bold">Share content</div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={includeSound} onChange={(e) => setIncludeSound(e.target.checked)} />
                      Include sound
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: includeSound });
                          stream.getTracks().forEach((track) => track.stop());
                          setStageMode("presentation");
                          setStageView("presentation");
                          setShareSource("Screen");
                          setOpenMenu(null);
                        } catch {}
                      }}
                      className={`rounded-xl border p-4 text-sm ${shareSource === "Screen" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}
                    >
                      <div className="text-2xl">🖥️</div>
                      <div className="mt-2">Screen</div>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: includeSound });
                          stream.getTracks().forEach((track) => track.stop());
                          setStageMode("presentation");
                          setStageView("presentation");
                          setShareSource("Window");
                          setOpenMenu(null);
                        } catch {}
                      }}
                      className={`rounded-xl border p-4 text-sm ${shareSource === "Window" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}
                    >
                      <div className="text-2xl">🪟</div>
                      <div className="mt-2">Window</div>
                    </button>
                    <label className={`cursor-pointer rounded-xl border p-4 text-center text-sm ${shareSource === "File" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.mp4,.mov,.webm"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const objectUrl = URL.createObjectURL(file);
                          const lower = file.name.toLowerCase();
                          const kind =
                            lower.endsWith(".ppt") || lower.endsWith(".pptx") ? "presentation" :
                            lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv") ? "spreadsheet" :
                            lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") ? "image" :
                            lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") ? "video" :
                            "doc";

                          openPresentationAsset({ type: kind as any, url: objectUrl, name: file.name });
                          setShareSource("File");
                        }}
                      />
                      <div className="text-2xl">📄</div>
                      <div className="mt-2">File</div>
                    </label>
                  </div>
                </div>
              ) : null}

              {openMenu === "video" ? (
                <div data-nexus-toolbar-dropdown className="absolute z-50 right-[24px] top-[70px] z-30 w-[440px] rounded-2xl border border-cyan-300/20 bg-[#111a25] p-5 shadow-2xl">
                  <div className="text-lg font-bold">Video content</div>
                  <p className="mt-2 text-sm text-slate-400">Video presentation, live stream, replay clips and external video.</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer rounded-xl border p-4 text-center text-sm ${videoMode === "Upload video" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={(event) => {
                          handleVideoUpload(event);
                          if (event.target.files?.[0]) {
                            setStageView("presentation");
                            setOpenMenu(null);
                          }
                        }}
                      />
                      <div className="text-2xl">🎞️</div>
                      <div className="mt-2">Upload video</div>
                    </label>

                    <button
                      onClick={() => {
                        setVideoMode("Live stream");
                        setVideoStatus("Live stream setup opened");
                        setStageMode("presentation");
                        setStageView("presentation");
                        setOpenMenu(null);
                      }}
                      className={`rounded-xl border p-4 text-sm ${videoMode === "Live stream" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}
                    >
                      <div className="text-2xl">📡</div>
                      <div className="mt-2">Live stream</div>
                    </button>

                    <button
                      onClick={() => {
                        setVideoMode("Replay clips");
                        setVideoStatus("Replay clips panel opened");
                        setBottomPanel("files");
                        setOpenMenu(null);
                      }}
                      className={`rounded-xl border p-4 text-sm ${videoMode === "Replay clips" ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-[#050b12]/[0.05]"}`}
                    >
                      <div className="text-2xl">🎥</div>
                      <div className="mt-2">Replay clips</div>
                    </button>

                    <button
                      type="button"
                      onClick={openExternalVideo}
                      className={`rounded-xl border p-4 text-sm ${
                        videoMode === "Video URL"
                          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-[#050b12]/[0.05]"
                      }`}
                    >
                      <div className="text-2xl">🔗</div>
                      <div className="mt-2">Video URL</div>
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-sm text-cyan-100">
                    {videoStatus}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setMeetingLifecycleDialog("leave")}
                className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-400"
              >
                Leave
              </button>
              </MeetingToolbar>
          </header>

          {videoUrlDialogOpen ? (
            <div className="fixed inset-0 z-[100010] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
              <section className="w-full max-w-xl rounded-[2rem] border border-cyan-300/25 bg-[#111a25] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                      Nexus Teams Video
                    </div>

                    <h2 className="mt-2 text-2xl font-black">
                      Share video by URL
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Paste a YouTube, Vimeo, livestream, MP4, WebM,
                      or other approved video URL. The video opens on
                      the Presentation Stage without uploading a large
                      media file to Nexus.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrlDialogOpen(false);
                      setVideoUrlError("");
                    }}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="block">
                    <span className="text-sm font-black">
                      Video URL
                    </span>

                    <input
                      type="url"
                      value={videoUrlDraft}
                      onChange={(event) => {
                        setVideoUrlDraft(event.target.value);
                        setVideoUrlError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          submitExternalVideoUrl();
                        }
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      autoFocus
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black">
                      Display title
                      <span className="ml-2 font-normal text-slate-500">
                        Optional
                      </span>
                    </span>

                    <input
                      type="text"
                      value={videoUrlTitleDraft}
                      onChange={(event) =>
                        setVideoUrlTitleDraft(event.target.value)
                      }
                      placeholder="Quarterly product demo"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-cyan-300/50"
                    />
                  </label>

                  {videoUrlError ? (
                    <div className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-100">
                      {videoUrlError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrlDialogOpen(false);
                      setVideoUrlError("");
                    }}
                    className="rounded-xl border border-white/10 px-4 py-3 font-black"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submitExternalVideoUrl}
                    disabled={!videoUrlDraft.trim()}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Open on Presentation Stage
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-purple-300/20 bg-purple-300/[0.06] p-4 text-xs leading-5 text-purple-100">
                  Video creation, AI generation, editing, transcoding,
                  captions, thumbnails, media storage, and publishing
                  remain part of the planned Nexus Create Studio.
                </div>
              </section>
            </div>
          ) : null}

          {meetingLifecycleStatus ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.07] px-4 py-3 text-sm text-cyan-100">
              <span>{meetingLifecycleStatus}</span>
              <button
                type="button"
                onClick={() => setMeetingLifecycleStatus("")}
                className="rounded-lg border border-white/10 px-2 py-1 text-xs"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <MeetingStage
            participants={meetingParticipants}
            participantControlState={participantControlState}
          >
          <section className="mt-5 rounded-3xl border border-white/10 bg-[#050b12]/[0.05] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {stageView === "lobby"
                    ? "Waiting Room"
                    : stageView === "presentation"
                    ? videoMode === "Video meeting stage"
                      ? "Video Meeting Stage"
                      : "Presentation Stage"
                    : "Meeting Stage"}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {stageView === "lobby"
                    ? "Review and admit participants before they enter the meeting."
                    : stageView === "presentation"
                    ? "Shared screen, video, slides, files, and live content appear here."
                    : "Admitted participants appear in the live meeting grid."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStageView("lobby");
                    setStageMode("participants");
                    setOpenMenu(null);
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    stageView === "lobby"
                      ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-amber-300/30"
                  }`}
                >
                  Lobby
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStageView("grid");
                    setStageMode("participants");
                    setOpenMenu(null);
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    stageView === "grid"
                      ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-300/30"
                  }`}
                >
                  Grid
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStageView("presentation");
                    setStageMode("presentation");
                    setOpenMenu(null);
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    stageView === "presentation"
                      ? "border-purple-300/50 bg-purple-500/20 text-purple-100"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-purple-300/30"
                  }`}
                >
                  Present
                </button>
              </div>
            </div>

            {stageView === "lobby" ? (
              <div className="mt-4 grid min-h-[330px] place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.035] p-6">
                <div className="w-full max-w-3xl text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-3xl">
                    🚪
                  </div>

                  <div className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                    Waiting Room
                  </div>

                  <h3 className="mt-2 text-2xl font-black">
                    No participants are waiting
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
                    Participants waiting for admission will appear here.
                    Hosts and administrators can admit, deny, message, or review
                    each person before they enter the meeting grid.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Waiting
                      </div>
                      <div className="mt-2 text-2xl font-black text-amber-100">
                        0
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Meeting
                      </div>
                      <div className="mt-2 text-sm font-black text-emerald-200">
                        Open
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Auto admit
                      </div>
                      <div className="mt-2 text-sm font-black text-cyan-200">
                        "Off"
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStageView("grid")}
                    className="mt-6 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
                  >
                    Return to meeting grid
                  </button>
                </div>
              </div>
            ) : stageMode === "participants" ? (
              <div
                className={`mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 ${
                  meetingParticipants.length <= 6
                    ? "min-h-[330px]"
                    : meetingParticipants.length <= 30
                    ? "min-h-[360px]"
                    : "min-h-[400px]"
                }`}
              >
                {meetingParticipants.length ? (
                  <div className={`grid gap-3 ${participantGridClass}`}>
                    {stageParticipants.map((participant: any, index: number) => {
                      const name = participantName(participant, index);
                      const role = participantRole(participant);
                      const roleKey = role.toLowerCase();
                      const targetIsOwner =
                        roleKey === "owner";
                      const targetIsHost =
                        roleKey === "host" ||
                        roleKey === "admin";
                      const targetIsCohost =
                        roleKey === "co-host" ||
                        roleKey === "cohost";
                      const targetIsPresenter =
                        roleKey === "presenter";
                      const targetIsParticipant =
                        roleKey === "participant";
                      const targetIsViewerOrGuest =
                        roleKey === "viewer" ||
                        roleKey === "guest";
                      const isCurrentViewer =
                        name === currentViewerName ||
                        (
                          participant?.participant_role === "owner" &&
                          currentViewerIsMeetingOwner
                        ) ||
                        (
                          roleKey === "owner" &&
                          currentViewerIsMeetingOwner
                        );
                      const avatar = participantAvatar(participant);
                      const assistant = isAssistantParticipant(participant);
                      const host = isHostParticipant(participant);
                      const speaking = isSpeakingParticipant(participant);
                      const handRank = raisedHandRankByName[name];
                      const mic =
                        participantControlState[name]?.mic ||
                        participant?.mic ||
                        (assistant ? "system" : "muted");
                      const cameraActive =
                        participantControlState[name]
                          ?.cameraEnabled ??
                        Boolean(
                          participant?.camera_enabled ||
                          participant?.camera ||
                          participant?.camera_active ||
                          participant?.video_enabled
                        );

                      const screenSharingActive =
                        participantControlState[name]
                          ?.screenSharing ??
                        Boolean(
                          participant?.screen_sharing ||
                          participant?.screenSharing ||
                          participant?.sharing_screen
                        );
                      const translationActive =
                        assistant ||
                        Boolean(participant?.translation_enabled) ||
                        Boolean(participant?.language);
                      const connected =
                        participant?.status !== "offline" &&
                        participant?.status !== "disconnected";

                      return (
                        <div
                          key={participant.id || participant.user_id || name}
                          title={`${name} · ${role}`}
                          className={`relative overflow-hidden rounded-2xl border bg-[#07111c]/90 text-center transition-all duration-200 ${participantTilePadding} ${
                            speaking
                              ? "z-10 scale-[1.025] border-emerald-300/70 shadow-[0_0_32px_rgba(52,211,153,0.25)]"
                              : host
                              ? "border-cyan-300/35 shadow-[0_0_24px_rgba(34,211,238,0.10)]"
                              : assistant
                              ? "border-purple-300/35 shadow-[0_0_24px_rgba(192,132,252,0.10)]"
                              : "border-white/10"
                          }`}
                        >
                         <ParticipantMenu
                        isOpen={openParticipantMenu === name}
                        onToggle={() =>
                         setOpenParticipantMenu(
                        openParticipantMenu === name ? null : name
                          )
                          }
                        >

                           
                          <div className="px-3 pb-2 pt-1">
                            <div className="truncate text-sm font-black text-white">
                              {name}
                            </div>
                            <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                              {role}
                            </div>
                          </div>

                          <div className="mb-1 border-t border-white/10" />

                          {currentViewerIsHostOrAdmin &&
                          !assistant &&
                          !isCurrentViewer ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  controlParticipant(name, "mute");
                                  setOpenParticipantMenu(null);
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                🔇 Mute
                              </button>

                              {!targetIsOwner ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "removeParticipant"
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-red-200 hover:bg-red-300/[0.08]"
                                >
                                  ⛔ Remove
                                </button>
                              ) : null}

                              {currentViewerIsMeetingOwner &&
                              !targetIsOwner &&
                              !targetIsCohost ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "makeCohost"
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-purple-200 hover:bg-purple-300/[0.08]"
                                >
                                  👑 Make Co-host
                                </button>
                              ) : null}

                              {!targetIsOwner &&
                              !targetIsHost &&
                              !targetIsPresenter ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "makePresenter"
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-cyan-200 hover:bg-cyan-300/[0.08]"
                                >
                                  🎤 Make Presenter
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => {
                                  controlParticipant(
                                    name,
                                    "spotlight"
                                  );
                                  setOpenParticipantMenu(null);
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                ⭐ Spotlight
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  controlParticipant(name, "pin");
                                  setOpenParticipantMenu(null);
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                📌 Pin
                              </button>

                              {handRank ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      controlParticipant(
                                        name,
                                        "allowSpeak"
                                      );
                                      setOpenParticipantMenu(null);
                                    }}
                                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-emerald-200 hover:bg-emerald-300/[0.08]"
                                  >
                                    🎤 Allow to Speak
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      controlParticipant(
                                        name,
                                        "lowerHand"
                                      );
                                      setOpenParticipantMenu(null);
                                    }}
                                    className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-yellow-200 hover:bg-yellow-300/[0.08]"
                                  >
                                    ✋ Lower Hand
                                  </button>
                                </>
                              ) : null}

                              {!targetIsOwner ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "moveToLobby"
                                    );
                                    appendMeetingAuditEvent(
                                      "participant_moved_to_lobby",
                                      name,
                                      {
                                        meetingCode,
                                        previousRole: role,
                                      }
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                                >
                                  🚪 Move to Lobby
                                </button>
                              ) : null}

                              {cameraActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "disableCamera"
                                    );
                                    appendMeetingAuditEvent(
                                      "participant_camera_disabled",
                                      name,
                                      { meetingCode }
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                                >
                                  📷 Disable Camera
                                </button>
                              ) : null}

                              {screenSharingActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    controlParticipant(
                                      name,
                                      "stopScreenShare"
                                    );
                                    appendMeetingAuditEvent(
                                      "participant_screen_share_stopped",
                                      name,
                                      { meetingCode }
                                    );
                                    setOpenParticipantMenu(null);
                                  }}
                                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                                >
                                  🖥️ Stop Screen Share
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() =>
                                  openReportAbuse(name)
                                }
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-yellow-200 hover:bg-yellow-300/[0.08]"
                              >
                                ⚠️ Report Participant
                              </button>

                              <div className="my-1 border-t border-white/10" />
                            </>
                          ) : null}

                          {!assistant && !isCurrentViewer ? (
                            <button
                              type="button"
                              onClick={() => openPrivateChat(name)}
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-cyan-200 hover:bg-cyan-300/[0.08]"
                            >
                              💬 Private Chat
                            </button>
                          ) : null}

                          {!assistant &&
                          !targetIsViewerOrGuest ? (
                            <button
                              type="button"
                              onClick={() =>
                                openParticipantNotes(name)
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                            >
                              📝 Notes
                            </button>
                          ) : null}

                          {!assistant ? (
                            <button
                              type="button"
                              onClick={() =>
                                openParticipantLanguage(name)
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                            >
                              🌍 Language
                            </button>
                          ) : null}

                          {targetIsPresenter && !assistant ? (
                            <button
                              type="button"
                              onClick={() =>
                                openParticipantAssistant(
                                  name,
                                  true
                                )
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-purple-200 hover:bg-purple-300/[0.08]"
                            >
                              🎯 AI Presenter Coach
                            </button>
                          ) : null}

                          {!assistant ? (
                            <button
                              type="button"
                              onClick={() =>
                                openParticipantAssistant(name)
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-purple-200 hover:bg-purple-300/[0.08]"
                            >
                              🤖 AI Assistant
                            </button>
                          ) : null}

                          {currentViewerIsHostOrAdmin &&
                          !assistant &&
                          !isCurrentViewer ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openParticipantSummary(name)
                                }
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-purple-200 hover:bg-purple-300/[0.08]"
                              >
                                🧠 AI Participant Summary
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openParticipantActivity(name)
                                }
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                📈 Participant Activity
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openParticipantPermissions(name)
                                }
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                🔐 Permissions
                              </button>
                            </>
                          ) : null}

                          {!assistant ? (
                            <button
                              type="button"
                              onClick={() =>
                                openParticipantProfile(name)
                              }
                              className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                            >
                              👤 Profile
                            </button>
                          ) : null}

                          {isCurrentViewer && !assistant ? (
                            <>
                              <div className="my-1 border-t border-white/10" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenParticipantMenu(null);
                                  chooseCurrentUserAvatar();
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
                              >
                                🖼️ Change Profile Photo
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenParticipantMenu(null);
                                  setMeetingLifecycleDialog("leave");
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-xs font-black text-red-200 hover:bg-red-300/[0.08]"
                              >
                                🚪 Leave Meeting
                              </button>
                            </>
                          ) : null}
                            </ParticipantMenu>

                          <ParticipantHeaderBadges
                            host={host}
                            assistant={assistant}
                            handRank={handRank}
                          />

                         <ParticipantAvatar
                         assistant={assistant}
                         avatar={avatar}
                         name={name}
                         speaking={speaking}
                         participant={participant}
                         currentViewerName={currentViewerName}
                         participantAvatarSize={participantAvatarSize}
                         nexusLogoUrl={NEXUS_LOGO_URL}
                         initials={initials}
                         onAvatarClick={handleParticipantAvatarClick}
                         />

                          <ParticipantIdentity
                            name={name}
                            role={role}
                            host={host}
                            onOpenControls={() =>
                              setOpenParticipantMenu(
                                openParticipantMenu === name ? null : name
                              )
                            }
                          />


                          <ParticipantStatusBadges
                            assistant={assistant}
                            mic={mic}
                            cameraActive={cameraActive}
                            translationActive={translationActive}
                            participantLanguage={participant?.language}
                            listenLanguage={listenLanguage}
                            sourceLanguage={sourceLanguage}
                            participantName={name}
                            currentViewerName={currentViewerName}
                            connected={connected}
                            languageLabel={languageLabel}
                          />
                        </div>
                      );
                    })}

                    {hiddenParticipantCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setPeopleDrawerOpen(true)}
                        className={`grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] ${participantTilePadding} text-center transition hover:border-cyan-300/60 hover:bg-cyan-300/[0.10]`}
                      >
                        <div>
                          <div className="text-2xl font-black text-cyan-100">
                            +{hiddenParticipantCount}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            More participants
                          </div>
                        </div>
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                    <NexusLogo />
                    <div className="mx-auto mt-8 w-full max-w-5xl text-left">
                    <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.045] p-6">
                      <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                        Meeting Intelligence Lobby
                      </div>

                      <h3 className="mt-3 text-3xl font-black">Waiting room ready</h3>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                        Nexus Teams is ready before participants join. Translation, transcript, knowledge graph, reasoning, and Team Intelligence are standing by.
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button onClick={() => setOpenMenu("mic")} className="rounded-xl border border-white/10 bg-[#050b12]/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Unmute / Mic</button>
                        <button onClick={() => setPeopleDrawerOpen(true)} className="rounded-xl border border-white/10 bg-[#050b12]/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Participants</button>
                        <button onClick={() => setMoreToolPanel("Raise Hands Queue")} className="rounded-xl border border-white/10 bg-[#050b12]/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Raised hands</button>
                        <button onClick={() => setBottomPanel("participants")} className="rounded-xl border border-white/10 bg-[#050b12]/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Language channels</button>
                        <button onClick={() => setMoreToolPanel("Conference Analytics")} className="rounded-xl border border-white/10 bg-[#050b12]/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Audience analytics</button>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-3">
                        {[
                          ["Room", meetingCode],
                          ["Mode", participantRoomMode],
                          ["Participants", participantCount],
                          ["Translation", "Ready"],
                          ["Transcript", "Running"],
                          ["Team Intelligence", "Live"],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
                            <div className="mt-2 text-lg font-black text-white">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-12 text-slate-900">
                {videoPlaybackUrl ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="w-full max-w-5xl">
                    <div className="mb-3 text-center text-sm font-semibold text-slate-700">
                      Now playing: {videoPlaybackTitle || videoMode}
                    </div>

                    {videoPlaybackType === "embed" ? (
                      <iframe
                        src={videoPlaybackUrl}
                        className="aspect-video w-full rounded-2xl"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={videoPlaybackUrl}
                        controls
                        className="aspect-video w-full rounded-2xl"
                      />
                    )}
                  </div>
                </div>
              ) : meetingAssetUrl ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                      <div className="w-full max-w-5xl">
                        <div className="mb-4 text-center text-sm font-semibold text-slate-700">
                          Now presenting: {meetingAssetName}
                        </div>

                        {meetingAssetKind === "image" ? (
                          <img src={meetingAssetUrl} alt={meetingAssetName} className="mx-auto max-h-[520px] rounded-2xl object-contain" />
                        ) : meetingAssetKind === "doc" && meetingAssetName.toLowerCase().endsWith(".pdf") ? (
                          <iframe src={meetingAssetUrl} title={meetingAssetName} className="h-[520px] w-full rounded-2xl border border-cyan-300/20 bg-[#050b12]" />
                        ) : meetingAssetKind === "presentation" ? (
                          <div className="rounded-2xl border border-cyan-300/20 bg-[#050b12] p-8 text-left shadow-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-500">Nexus Teams Slideshow</div>
                                <h3 className="mt-4 text-4xl font-black text-white">{meetingAssetName}</h3>
                                <p className="mt-3 text-slate-400">Presentation uploaded and ready for meeting slideshow preview.</p>
                              </div>
                              <NexusLogo />
                            </div>
                            <div className="mt-8 grid grid-cols-5 gap-3">
                              {[1, 2, 3, 4, 5].map((slide) => (
                                <div key={slide} className="rounded-xl border border-cyan-300/20 bg-slate-50 p-4 text-center text-slate-700">
                                  Slide {slide}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-cyan-300/20 bg-[#050b12] p-8 text-slate-900">
                            <NexusLogo />
                            <h3 className="mt-5 text-3xl font-black">{meetingAssetName}</h3>
                            <p className="mt-3 text-slate-400">File loaded into this meeting workspace.</p>
                            <div className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-center font-bold text-white">
                              Loaded in Nexus presentation stage
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : meeting?.active_asset_title ? (
                  <>
                    <div className="flex items-start justify-between">
                      <h3 className="text-4xl font-black">{meeting.active_asset_title}</h3>
                      <NexusLogo />
                    </div>
                    <p className="mt-4 max-w-xl text-slate-400">Live shared content is active for this meeting.</p>
                  </>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                      {videoPlaybackUrl ? (
                        <div className="w-full max-w-5xl">
                          <div className="mb-3 text-center text-sm font-semibold text-slate-700">
                            Now playing: {videoPlaybackTitle || videoMode}
                          </div>
                          {videoPlaybackType === "embed" ? (
                            <iframe
                              src={videoPlaybackUrl}
                              title={videoPlaybackTitle || "External video"}
                              className="aspect-video w-full rounded-2xl border border-cyan-300/20 bg-black"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={videoPlaybackUrl}
                              controls
                              className="aspect-video w-full rounded-2xl border border-cyan-300/20 bg-black"
                            />
                          )}
                        </div>
                      ) : (
                        <>
                          <NexusLogo />
                          <h3 className="mt-8 text-3xl font-black">{videoMode === "Video meeting stage" ? "No video is currently shared" : "No presentation is currently shared"}</h3>
                          <p className="mt-3 max-w-xl text-slate-400">
                            Live camera, uploaded video, screen share, slides, files, whiteboard, replay clips, and broadcast video will appear here.
                          </p>
                        </>
                      )}
                    </div>
                )}
              </div>
            )}
            </section>
            </MeetingStage>

          <section className="mt-5 rounded-3xl border border-white/10 bg-[#050b12]/[0.04] p-4">
            <div className="mb-4">
              <WorkspaceNavigation
                activeWorkspace={
                  bottomPanel
                }
                onWorkspaceChange={
                  setBottomPanel
                }
              />
            </div>

{bottomPanel === "voice" ? (
  <div className="space-y-4">
    <LiveVoiceRuntime
      meetingCode={meetingCode}
      sourceLanguage={sourceLanguage}
      targetLanguage={listenLanguage}
      onStatusChange={(status: LiveVoiceStatus) => {
        setToolActionStatus(
          status === "connected"
            ? "Live voice connected"
            : status === "idle"
              ? "Live voice disconnected"
              : `Live voice: ${status}`,
        );
      }}
      onTranscript={(transcript: LiveVoiceTranscript) => {
        setToolActionStatus(
          transcript.final
            ? "Live transcript received"
            : "Live transcript updating",
        );
      }}
      onError={(message: string) => {
        setToolActionStatus(`Live voice error: ${message}`);
      }}
    />

    <VoiceWorkspace
      listenLanguage={listenLanguage}
      sourceLanguage={sourceLanguage}
      latestTranscript={latestTranscript}
      latestCaption={latestCaption}
      languageLabel={languageLabel}
    />
  </div>
) : null}
            {bottomPanel === "chat" ? (
              <ChatWorkspace
                meetingChatMessages={
                  meetingChatMessages
                }
                chatDraft={chatDraft}
                setChatDraft={setChatDraft}
                expandedChatMessageIds={
                  expandedChatMessageIds
                }
                sendMeetingChatMessage={
                  sendMeetingChatMessage
                }
                toggleExpandedChatMessage={
                  toggleExpandedChatMessage
                }
                chatQuickAction={
                  chatQuickAction
                }
                chatLanguageLabel={
                  chatLanguageLabel
                }
              />
            ) : null}

            {bottomPanel === "participants" ? (
              <ParticipantsWorkspace
                activeParticipants={
                  activeParticipants
                }
                visibleParticipants={
                  visibleParticipants
                }
                humanParticipantCount={
                  humanParticipantCount
                }
                listenLanguage={
                  listenLanguage
                }
                languageLabel={
                  languageLabel
                }
              />
            ) : null}

            {bottomPanel === "files" ? (
              <FilesWorkspace
                meetingAssetKind={
                  meetingAssetKind
                }
                meetingAssetName={
                  meetingAssetName
                }
                handleMeetingAssetUpload={
                  handleMeetingAssetUpload
                }
              />
            ) : null}

            {bottomPanel === "notes" ? (
              <NotesWorkspace />
            ) : null}

            {bottomPanel === "documents" ? (
              <DocumentsWorkspace />
            ) : null}

            {bottomPanel === "whiteboard" ? (
              <WhiteboardWorkspace />
            ) : null}

            {bottomPanel === "tasks" ? (
              <TasksWorkspace />
            ) : null}

            {bottomPanel === "polls" ? (
              <PollsWorkspace />
            ) : null}

            {bottomPanel === "apps" ? (
              <AppsWorkspace />
            ) : null}

            {bottomPanel === "ai" ? (
              <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-black/20">
                <div className="border-b border-white/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                        Nexus Meeting Intelligence
                      </div>

                      <h3 className="mt-2 text-2xl font-black">
                        Live intelligence workspace
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                        RioMind continuously observes permitted transcript,
                        chat, translation, decisions, commitments, risks, and
                        meeting activity. This workspace is a projection of
                        the persisted meeting-intelligence runtime.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2 text-xs font-black text-emerald-200">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      {intelligenceSyncStatus === "synced"
                        ? "Live · Persistent intelligence"
                        : intelligenceSyncStatus === "syncing"
                        ? "Syncing · RioMind intelligence"
                        : "Sync error · RioMind intelligence"}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                    {[
                      ["summary", "Summary", "Live"],
                      [
                        "decisions",
                        "Decisions",
                        activeIntelligenceCount(detectedDecisions),
                      ],
                      [
                        "actions",
                        "Actions",
                        activeIntelligenceCount(detectedActions),
                      ],
                      [
                        "risks",
                        "Risks",
                        activeIntelligenceCount(detectedRisks),
                      ],
                      [
                        "questions",
                        "Questions",
                        activeIntelligenceCount(openMeetingQuestions),
                      ],
                      [
                        "commitments",
                        "Commitments",
                        activeIntelligenceCount(detectedCommitments),
                      ],
                      [
                        "timeline",
                        "Timeline",
                        canonicalTimelineEvents(intelligenceTimeline).length,
                      ],
                      ["ask", "Ask Nexus", assistantConversation.length],
                    ].map(([section, label, count]: any) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => setAiWorkspaceSection(section)}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          aiWorkspaceSection === section
                            ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-100"
                            : "border-white/10 bg-black/20 text-slate-400 hover:border-cyan-300/25 hover:text-white"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                          {label}
                        </div>
                        <div className="mt-1 text-lg font-black">
                          {count}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nexus-muted-scrollbar max-h-[520px] overflow-y-auto p-5">
                  {assistantNotice ? (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-200">
                      <span>{assistantNotice}</span>
                      <button
                        type="button"
                        onClick={() => setAssistantNotice("")}
                        className="font-black"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}

                  {aiWorkspaceSection === "summary" ? (
                    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
                      <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.045] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-xl font-black">Live Summary</h4>
                          <span className="text-xs font-black text-emerald-300">
                            ● Live
                          </span>
                        </div>

                        <p className="mt-4 leading-7 text-slate-300">
                          {liveMeetingSummary}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={generateClosingSummary}
                            className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100"
                          >
                            Refresh summary
                          </button>

                          <button
                            type="button"
                            onClick={() => setBottomPanel("voice")}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black"
                          >
                            Open transcript
                          </button>
                        </div>
                      </article>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ["Participants", humanParticipantCount],
                          [
                            "Languages",
                            new Set(
                              meetingParticipants.map(
                                (participant: any) =>
                                  participant.preferred_language ||
                                  participant.language ||
                                  "en"
                              )
                            ).size,
                          ],
                          [
                            "Questions",
                            activeIntelligenceCount(openMeetingQuestions),
                          ],
                          [
                            "Commitments",
                            activeIntelligenceCount(detectedCommitments),
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              {label}
                            </div>
                            <div className="mt-2 text-2xl font-black">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "decisions" ? (
                    <section className="space-y-3">
                      {canonicalIntelligenceRecords(
                        detectedDecisions
                      ).length ? (
                        canonicalIntelligenceRecords(
                          detectedDecisions
                        ).map((decision) => (
                          <article
                            key={decision.id}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-black">{decision.title}</h4>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  {decision.detail}
                                </p>
                                <div className="mt-2 text-xs text-slate-500">
                                  {decision.speaker || "Meeting intelligence"}
                                </div>
                              </div>

                              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">
                                {decision.confidence}%
                              </span>
                            </div>

                            <div className="mt-4 flex gap-2">
                              {decision.status === "detected" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateIntelligenceRecord(
                                      "decisions",
                                      decision.id,
                                      "accepted"
                                    )
                                  }
                                  className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100"
                                >
                                  Accept
                                </button>
                              ) : (
                                <span className="py-2 text-xs font-black uppercase text-emerald-300">
                                  {decision.status}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "decisions",
                                    decision.id,
                                    "dismissed"
                                  )
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black"
                              >
                                Dismiss
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          No decisions detected yet.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "actions" ? (
                    <section className="space-y-3">
                      {canonicalIntelligenceRecords(
                        detectedActions
                      ).length ? (
                        canonicalIntelligenceRecords(
                          detectedActions
                        ).map((actionItem) => (
                          <article
                            key={actionItem.id}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <h4 className="font-black">{actionItem.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {actionItem.detail}
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs text-slate-500">Owner</div>
                                <div className="mt-1 font-black">
                                  {actionItem.owner || "Unassigned"}
                                </div>
                              </div>

                              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs text-slate-500">Due</div>
                                <div className="mt-1 font-black">
                                  {actionItem.due || "Not set"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "actions",
                                    actionItem.id,
                                    "accepted"
                                  )
                                }
                                className="rounded-lg border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs font-black text-purple-100"
                              >
                                Create action
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "actions",
                                    actionItem.id,
                                    "resolved"
                                  )
                                }
                                className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100"
                              >
                                Complete
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          No action items detected yet.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "risks" ? (
                    <section className="space-y-3">
                      {canonicalIntelligenceRecords(
                        detectedRisks
                      ).length ? (
                        canonicalIntelligenceRecords(
                          detectedRisks
                        ).map((risk) => (
                          <article
                            key={risk.id}
                            className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-black text-amber-100">
                                  {risk.title}
                                </h4>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  {risk.detail}
                                </p>
                              </div>

                              <span className="text-xs font-black text-amber-300">
                                {risk.confidence}%
                              </span>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "risks",
                                    risk.id,
                                    "resolved"
                                  )
                                }
                                className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100"
                              >
                                Resolve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "risks",
                                    risk.id,
                                    "dismissed"
                                  )
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black"
                              >
                                Dismiss
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          No active risks detected.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "questions" ? (
                    <section className="space-y-3">
                      {canonicalIntelligenceRecords(
                        openMeetingQuestions
                      ).length ? (
                        canonicalIntelligenceRecords(
                          openMeetingQuestions
                        ).map((question) => (
                          <article
                            key={question.id}
                            className="rounded-2xl border border-purple-300/20 bg-purple-300/[0.045] p-4"
                          >
                            <h4 className="font-black text-purple-100">
                              {question.title}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {question.detail}
                            </p>

                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiWorkspaceSection("ask");
                                  setAssistantQuestion(question.title);
                                }}
                                className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100"
                              >
                                Ask Nexus
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateIntelligenceRecord(
                                    "questions",
                                    question.id,
                                    "resolved"
                                  )
                                }
                                className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100"
                              >
                                Mark answered
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          No open questions.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "commitments" ? (
                    <section className="space-y-3">
                      {canonicalIntelligenceRecords(
                        detectedCommitments
                      ).length ? (
                        canonicalIntelligenceRecords(
                          detectedCommitments
                        ).map((commitment) => (
                          <article
                            key={commitment.id}
                            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4"
                          >
                            <h4 className="font-black">{commitment.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {commitment.detail}
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-xl border border-white/10 p-3 text-sm">
                                Owner:{" "}
                                <b>{commitment.owner || "Unassigned"}</b>
                              </div>
                              <div className="rounded-xl border border-white/10 p-3 text-sm">
                                Due: <b>{commitment.due || "Not set"}</b>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          No commitments detected yet.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "timeline" ? (
                    <section className="space-y-3">
                      {canonicalTimelineEvents(
                        intelligenceTimeline
                      ).length ? (
                        canonicalTimelineEvents(
                          intelligenceTimeline
                        ).map((item) => (
                          <article
                            key={item.id}
                            className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-cyan-300" />
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">
                                {item.type}
                              </div>
                              <h4 className="mt-1 font-black">{item.title}</h4>
                              <div className="mt-2 text-xs text-slate-500">
                                {item.speaker || item.sourceType} ·{" "}
                                {new Date(item.detectedAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                          Intelligence events will appear as the meeting develops.
                        </div>
                      )}
                    </section>
                  ) : null}

                  {aiWorkspaceSection === "ask" ? (
                    <section className="mx-auto max-w-4xl">
                      <div className="rounded-2xl border border-purple-300/20 bg-purple-300/[0.045] p-5">
                        <h4 className="text-xl font-black">Ask Nexus</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Ask about decisions, owners, risks, unanswered
                          questions, participants, translation, recording, or
                          the current meeting context.
                        </p>

                        {assistantConversation.length ? (
                          <div className="nexus-muted-scrollbar mt-5 max-h-72 space-y-3 overflow-y-auto pr-2">
                            {assistantConversation.map((message) => (
                              <div
                                key={message.id}
                                className={`rounded-2xl border p-4 ${
                                  message.role === "user"
                                    ? "ml-10 border-cyan-300/20 bg-cyan-300/[0.06]"
                                    : "mr-10 border-purple-300/20 bg-purple-300/[0.06]"
                                }`}
                              >
                                <div className="text-xs font-black uppercase tracking-[0.15em]">
                                  {message.role === "user" ? "You" : "Nexus"}
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                                  {message.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {assistantThinking ? (
                          <div className="mt-4 text-sm font-black text-cyan-300">
                            Nexus is reviewing the meeting…
                          </div>
                        ) : null}

                        <div className="mt-5 flex gap-3">
                          <input
                            value={assistantQuestion}
                            onChange={(event) =>
                              setAssistantQuestion(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" &&
                                !event.shiftKey
                              ) {
                                event.preventDefault();
                                answerMeetingQuestion();
                              }
                            }}
                            placeholder="Ask Nexus about this meeting…"
                            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/40"
                          />

                          <button
                            type="button"
                            onClick={() => answerMeetingQuestion()}
                            disabled={
                              assistantThinking ||
                              !assistantQuestion.trim()
                            }
                            className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-[#061018] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Ask
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            "What decisions were made?",
                            "Who owns the action item?",
                            "What risks remain?",
                            "What questions are unresolved?",
                            "Summarize this meeting.",
                          ].map((question) => (
                            <button
                              key={question}
                              type="button"
                              onClick={() =>
                                answerMeetingQuestion(question)
                              }
                              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </section>

        

        

          {moreToolPanel ? (
            <MoreToolShell title={moreToolPanel} onClose={() => setMoreToolPanel(null)}>
              {["John", "Nexus AI", "Invited users", "Team Permissions", "Invite member", "Owner Permission", "Admin Permission", "Manager Permission", "Analyst Permission", "Viewer Permission"].includes(moreToolPanel) ? (
                <section className="space-y-5">
                  <div className="rounded-3xl border border-cyan-300/25 bg-cyan-300/[0.06] p-6">
                    <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Team detail</div>
                    <h3 className="mt-4 text-3xl font-black">{moreToolPanel}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">
                      {moreToolPanel === "John"
                        ? "Owner profile, host permissions, room controls, and team authority."
                        : moreToolPanel === "Nexus AI"
                        ? "Team intelligence assistant with analytics, memory, reports, and meeting reasoning."
                        : moreToolPanel === "Invited users"
                        ? "Pending members, invite status, access level, and onboarding controls."
                        : moreToolPanel === "Team Permissions"
                        ? "Role-based permissions for owner, admin, manager, analyst, contributor, and viewer."
                        : "Invite a new member into this Nexus Teams workspace."}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      ["Status", moreToolPanel === "Invited users" ? "waiting" : "ready"],
                      ["Access", moreToolPanel === "John" ? "owner" : moreToolPanel === "Nexus AI" ? "analyst" : "managed"],
                      ["Workspace", "Members · Roles · Presence · Permissions"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                        <span className="text-sm text-slate-400">{label}</span>
                        <b className="text-cyan-100">{value}</b>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setToolActionStatus(`${moreToolPanel}: opened`)} className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-black text-cyan-100">Open</button>
                    <button onClick={() => setToolActionStatus(`${moreToolPanel}: permission updated`)} className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100">Update</button>
                    <button onClick={() => setToolActionStatus(`${moreToolPanel}: invite flow ready`)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black">Invite</button>
                  </div>

                  {toolActionStatus ? (
                    <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4 text-sm font-black text-emerald-200">
                      Success: {toolActionStatus}.
                    </div>
                  ) : null}
                </section>
              ) : null}

              {["John joined", "Sarah raised hand", "Recording started", "Decision detected", "Action item created", "AI summary updated"].includes(moreToolPanel) ? (
                <section className="space-y-5">
                  <div className="rounded-3xl border border-cyan-300/25 bg-cyan-300/[0.06] p-5">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Activity detail</div>
                    <h3 className="mt-3 text-3xl font-black">{moreToolPanel}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      This event is linked to meeting timeline, transcript, AI notes, decisions, and action items.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      ["Status", moreToolPanel === "Sarah raised hand" ? "needs review" : "active"],
                      ["Source", moreToolPanel.includes("AI") || moreToolPanel.includes("Decision") ? "Nexus AI" : "Meeting runtime"],
                      ["Workspace", "Transcript · Notes · Actions"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-sm text-slate-400">{label}</span>
                        <b className="text-cyan-100">{value}</b>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => completeActivityAction("opened")} className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-black text-cyan-100 transition hover:scale-[1.03]">Open</button>
                    <button onClick={() => completeActivityAction("approved")} className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100 transition hover:scale-[1.03]">Approve</button>
                    <button onClick={() => completeActivityAction("dismissed")} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black transition hover:scale-[1.03]">Dismiss</button>
                  </div>

                  {activityOutcome[moreToolPanel] ? (
                    <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4 text-sm font-black text-emerald-200">
                      Success: {moreToolPanel} {activityOutcome[moreToolPanel]}.
                    </div>
                  ) : null}
                </section>
              ) : null}

              {["Video Call", "Audio Call", "Phone", "WhatsApp"].includes(moreToolPanel) ? (
                <section className="space-y-5">
                  <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-5">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Call action</div>
                    <h3 className="mt-3 text-3xl font-black">{moreToolPanel}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Start, schedule, view history, or connect this call route from the meeting room.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      ["Availability", moreToolPanel === "Phone" || moreToolPanel === "WhatsApp" ? "bridge later" : "ready"],
                      ["Meeting room", meetingCode],
                      ["Participants online", String(participantCount)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-sm text-slate-400">{label}</span>
                        <b className="text-emerald-100">{value}</b>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => completeCallAction("Start now")} className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-black text-cyan-100 transition hover:scale-[1.03]">Start now</button>
                    <button onClick={() => completeCallAction("Scheduled")} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black transition hover:scale-[1.03]">Schedule</button>
                    <button onClick={() => completeCallAction("History opened")} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black transition hover:scale-[1.03]">History</button>
                    <button onClick={() => completeCallAction("Contacts opened")} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-black transition hover:scale-[1.03]">Contacts</button>
                  </div>

                  {callOutcome[moreToolPanel] ? (
                    <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4 text-sm font-black text-emerald-200">
                      Success: {moreToolPanel} action completed — {callOutcome[moreToolPanel]}.
                    </div>
                  ) : null}
                </section>
              ) : null}

              {moreToolPanel === "Meeting Administration" ? (
                <section className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
                    <div className="text-xs text-slate-400">Host</div>
                    <div className="font-bold">{hostName}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
                    <div className="text-xs text-slate-400">Room</div>
                    <div className="font-bold">{meetingCode}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="font-bold text-emerald-300">Conference foundation ready</div>
                  </div>
                </section>
              ) : null}

              {moreToolPanel === "Gallery Controls" ? (
                <section className="space-y-3">
                  <p className="text-sm text-slate-400">Participant card controls for mic, mute, audio, hand, and speaking/listening status.</p>
                  <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Live participant cards show online state, muted/speaking status, raised hands, and language mode.</div>
                </section>
              ) : null}

              {moreToolPanel === "Invite Participant" ? (
                <section className="space-y-3">
                  <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3" placeholder="Participant name" />
                  <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3" placeholder="Email address" />
                  <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-white">Send Invite</button>
                </section>
              ) : null}

              {moreToolPanel === "Raise Hands Queue" ? (
                <section className="space-y-3">
                  <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">No raised hands.</div>
                  <button className="rounded-xl bg-cyan-400 px-4 py-3 font-bold text-white">Allow Next Speaker</button>
                </section>
              ) : null}

              {moreToolPanel === "Recordings" ? (
                <section className="grid gap-3">
                  {["Transcript recording", "Audio recording", "Video replay", "AI notes"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
                      <div className="font-semibold">{item}</div>
                      <div className="mt-1 text-xs text-slate-400">Ready when meeting recording is enabled.</div>
                    </div>
                  ))}
                </section>
              ) : null}

              {moreToolPanel === "Conference Analytics" ? (
                <section className="grid gap-3">
                  {[["Attendance", "0 participants"], ["Translation latency", "Target 2–5s"], ["Language usage", `${languageLabel(sourceLanguage)} → ${languageLabel(listenLanguage)}`], ["Meeting quality", "Foundation"]].map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-4">
                      <span className="text-slate-400">{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </section>
              ) : null}
            </MoreToolShell>
          ) : null}


          {(() => {
            const raisedHandCount = liveParticipants.filter((p) => p.hand).length;
            const mutedParticipantCount = liveParticipants.filter((p) => p.mic === "muted").length;
            return null;
          })()}


          {peopleDrawerOpen ? (
            <div className="fixed inset-y-0 right-0 z-50 w-[430px] overflow-y-auto border-l border-cyan-300/15 bg-[#07111c] p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Live presence</div>
                  <h2 className="mt-2 text-2xl font-black">People ({humanParticipantCount})</h2>
                </div>
                <button onClick={() => setPeopleDrawerOpen(false)} className="rounded-xl border border-white/10 px-3 py-2">Close</button>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Online state, muted/speaking status, raised hands, language, and meeting role.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Online", humanParticipantCount],
                  ["Raised", raisedHandCount],
                  [
                    "Muted",
                    meetingParticipants.filter((participant: any) => {
                      const name = participantName(participant);
                      return (
                        participantControlState[name]?.mic ||
                        participant?.mic
                      ) === "muted";
                    }).length,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                    <div className="mt-2 text-2xl font-black text-cyan-100">{value}</div>
                  </div>
                ))}
              </div>

              {hostControlRequest?.status === "pending" ? (
                <section className="mt-5 rounded-3xl border border-purple-300/20 bg-purple-300/[0.05] p-4">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">
                    Host-control request
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="font-black">
                      {hostControlRequest.requester}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Requests meeting authority
                    </div>
                  </div>

                  {currentViewerIsHostOrAdmin ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          resolveHostControlRequest("approved-host")
                        }
                        className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-2 py-3 font-black text-cyan-100"
                      >
                        Make host
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          resolveHostControlRequest("approved-cohost")
                        }
                        className="rounded-xl border border-purple-300/25 bg-purple-300/10 px-2 py-3 font-black text-purple-100"
                      >
                        Co-host
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          resolveHostControlRequest("declined")
                        }
                        className="rounded-xl border border-red-300/25 bg-red-300/10 px-2 py-3 font-black text-red-100"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-400">
                      Waiting for {primaryHostName} to review.
                    </div>
                  )}
                </section>
              ) : null}

              <section className="mt-5 rounded-3xl border border-yellow-300/20 bg-yellow-300/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-yellow-300">
                      Raised-hand queue
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      First raised, first reviewed.
                    </div>
                  </div>

                  <span className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                    {raisedHandCount}
                  </span>
                </div>

                {raisedHandQueue.length ? (
                  <div className="mt-4 space-y-2">
                    {raisedHandQueue.map((participant: any, index: number) => {
                      const name = participantName(participant, index);

                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-yellow-300/25 bg-yellow-300/10 text-sm font-black text-yellow-100">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="truncate font-black">{name}</div>
                              <div className="text-xs text-slate-500">
                                {participantRole(participant)}
                              </div>
                            </div>
                          </div>

                          {currentViewerIsHostOrAdmin ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => controlParticipant(name, "allowSpeak")}
                                className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-2 text-xs font-black text-emerald-100"
                              >
                                Allow
                              </button>

                              <button
                                onClick={() => controlParticipant(name, "lowerHand")}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-black"
                              >
                                Lower
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-500">
                    No raised hands.
                  </div>
                )}
              </section>

              <section className="mt-5 rounded-3xl border border-purple-300/20 bg-purple-300/[0.04] p-4">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-purple-300">Meeting mode</div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {(["open", "moderated", "presentation", "broadcast"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setMeetingVoiceMode(mode);
                        setToolActionStatus(`Meeting mode set to ${mode}`);
                      }}
                      className={`rounded-2xl border px-3 py-3 font-black capitalize ${
                        meetingVoiceMode === mode
                          ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-white/[0.04] text-slate-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setRoomHardMuted(true);
                      setParticipantControlState((current) => {
                        const next = { ...current };
                        liveParticipants.forEach((p) => {
                          if (p.role !== "Owner" && p.role !== "Host" && p.role !== "Assistant") {
                            next[p.name] = { ...(next[p.name] || {}), mic: "muted", speaking: false };
                          }
                        });
                        return next;
                      });
                      setToolActionStatus("Room muted by host");
                    }}
                    className="rounded-2xl border border-red-300/30 bg-red-300/10 px-3 py-3 font-black text-red-100"
                  >
                    Mute all
                  </button>

                  <button
                    onClick={() => {
                      setRoomHardMuted(false);
                      setToolActionStatus("Room unmuted by host");
                    }}
                    className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-3 font-black text-emerald-100"
                  >
                    Unmute room
                  </button>
                </div>

                {toolActionStatus ? (
                  <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-xs font-black text-emerald-200">
                    Success: {toolActionStatus}.
                  </div>
                ) : null}
              </section>

              <div className="mt-5 space-y-4">
                {presenceParticipants.map((participant) => (
                  <div key={participant.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-black">{participant.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{participant.role}</div>
                      </div>
                      <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        {participant.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs text-slate-500">Language</div>
                        <div className="mt-1 font-black">{participant.name === "Sarah" ? languageLabel(listenLanguage) : languageLabel(participant.language)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs text-slate-500">{participant.role === "Assistant" ? "Mode" : "Voice"}</div>
                        <div className="mt-1 font-black">{participant.role === "Assistant" ? "AI Observer" : participant.speaking ? "Speaking" : participant.mic === "muted" ? "Muted" : participant.mic === "live" ? "Live" : participant.mic}</div>
                      </div>
                    </div>

                    {participant.hand ? (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-3">
                        <span className="text-sm font-black text-yellow-200">Raised hand</span>
                        <button onClick={() => controlParticipant(participant.name, "allowSpeak")} className="rounded-xl border border-yellow-300/30 px-3 py-2 text-xs font-black text-yellow-100">
                          Allow speak
                        </button>
                      </div>
                    ) : null}

                    {participant.role !== "Assistant" ? (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <button
                          disabled={roomHardMuted && participant.role !== "Owner" && participant.role !== "Host"}
                          onClick={() => controlParticipant(participant.name, participant.mic === "muted" ? "unmute" : "mute")}
                          className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 font-black text-cyan-100 disabled:opacity-40"
                        >
                          {participant.mic === "muted" ? "Unmute" : "Mute"}
                        </button>
                        <button onClick={() => controlParticipant(participant.name, "removeSpeaker")} className="rounded-xl border border-red-300/25 bg-red-300/10 px-3 py-2 font-black text-red-100">
                          Remove speaker
                        </button>
                        <button onClick={() => controlParticipant(participant.name, "pin")} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-black">
                          Pin
                        </button>
                        <button onClick={() => controlParticipant(participant.name, "more")} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-black">
                          More
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3 text-xs text-cyan-100">
                        Nexus AI listens, summarizes, and supports the meeting without joining as a speaker.
                      </div>
                    )}

                    {toolActionStatus.startsWith(`${participant.name}:`) ? (
                      <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-xs font-black text-emerald-200">
                        Success: {toolActionStatus}.
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {profileViewerName ? (
            <div className="fixed inset-0 z-[100004] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
              <section className="w-full max-w-md rounded-[2rem] border border-cyan-300/20 bg-[#111a25] p-6 text-center shadow-2xl">
                {(() => {
                  const participant = meetingParticipants.find(
                    (item: any) =>
                      participantName(item) === profileViewerName
                  );

                  const avatar = participant
                    ? participantAvatar(participant)
                    : "";

                  const role = participant
                    ? participantRole(participant)
                    : "Participant";

                  const language =
                    participantControlState[profileViewerName]
                      ?.language ||
                    participant?.language ||
                    sourceLanguage;

                  return (
                    <>
                      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300/80 to-purple-300/80 text-2xl font-black text-white">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={profileViewerName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(profileViewerName)
                        )}
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        {profileViewerName}
                      </h2>

                      <p className="mt-1 text-sm uppercase tracking-[0.16em] text-slate-400">
                        {role}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs text-slate-500">
                            Language
                          </div>
                          <div className="mt-1 font-black">
                            {languageLabel(String(language))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs text-slate-500">
                            Presence
                          </div>
                          <div className="mt-1 font-black text-emerald-300">
                            Online
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const target = profileViewerName;
                      setProfileViewerName("");
                      openPrivateChat(target);
                    }}
                    className="rounded-2xl bg-cyan-400 px-4 py-3 font-black text-[#061018]"
                  >
                    Chat privately
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileViewerName("")}
                    className="rounded-2xl border border-white/10 px-4 py-3 font-black"
                  >
                    Close
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {privateChatOpen && privateChatTarget ? (
            <div className="fixed inset-0 z-[100003] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
              <section className="flex h-[min(700px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#111a25] shadow-2xl">
                <header className="flex items-center justify-between border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-300/80 to-purple-300/80 font-black text-white">
                      {initials(privateChatTarget)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black">
                          {privateChatTarget}
                        </h2>

                        <span className="rounded-full border border-purple-300/25 bg-purple-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-purple-100">
                          Private
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        Only you and {privateChatTarget} can see this conversation.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPrivateChatOpen(false);
                      setPrivateChatTarget("");
                      setPrivateChatDraft("");
                      setPrivateChatStatus("");
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-lg"
                  >
                    ×
                  </button>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {privateChatMessages.filter(
                    (message) =>
                      (message.sender === currentViewerName &&
                        message.recipient ===
                          privateChatTarget) ||
                      (message.sender ===
                        privateChatTarget &&
                        message.recipient ===
                          currentViewerName)
                  ).length ? (
                    privateChatMessages
                      .filter(
                        (message) =>
                          (message.sender ===
                            currentViewerName &&
                            message.recipient ===
                              privateChatTarget) ||
                          (message.sender ===
                            privateChatTarget &&
                            message.recipient ===
                              currentViewerName)
                      )
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[82%] rounded-2xl border p-4 ${
                            message.sender === currentViewerName
                              ? "ml-auto border-cyan-300/20 bg-cyan-300/[0.08]"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-black">
                              {message.sender}
                            </span>
                            <span className="text-slate-500">
                              {message.time}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            {message.body}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="grid h-full place-items-center text-center">
                      <div>
                        <div className="text-3xl">💬</div>
                        <div className="mt-3 font-black">
                          Start a private conversation
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Messages here do not appear in the shared meeting chat.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="border-t border-white/10 p-4">
                  {privateChatStatus ? (
                    <div className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-xs text-emerald-200">
                      {privateChatStatus}
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <input
                      value={privateChatDraft}
                      onChange={(event) =>
                        setPrivateChatDraft(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          sendPrivateChatMessage();
                        }
                      }}
                      placeholder={`Message ${privateChatTarget} privately`}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/40"
                    />

                    <button
                      type="button"
                      onClick={sendPrivateChatMessage}
                      className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-[#061018]"
                    >
                      Send
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Private-thread persistence will later use the authenticated meeting messaging API.
                  </p>
                </footer>
              </section>
            </div>
          ) : null}

          {recordingConsentNoticeOpen && recordingConsentViewer ? (
            <div className="fixed inset-0 z-[100002] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
              <section className="w-full max-w-lg rounded-[2rem] border border-red-300/25 bg-[#111820] p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-red-300/25 bg-red-300/10 text-2xl">
                    ⏺
                  </span>

                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                      Recording notice
                    </div>
                    <h2 className="mt-1 text-2xl font-black">
                      This meeting wants to record
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-300">
                  {recordingConsentViewer}, the host has requested recording for
                  this meeting. Audio, video, transcript, shared content, and meeting
                  intelligence outputs may be captured according to the selected policy.
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Meeting category</span>
                    <b>{meetingCategory}</b>
                  </div>

                  <div className="mt-3 flex justify-between gap-3">
                    <span className="text-slate-400">Consent policy</span>
                    <b>{recordingPolicyLabel()}</b>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Recording consent does not authorize creation or reuse of a cloned
                  voice profile. Voice-preservation consent is handled separately.
                </p>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      respondToRecordingConsent(
                        recordingConsentViewer,
                        "agreed"
                      )
                    }
                    className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-[#04140e]"
                  >
                    Agree and continue
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      respondToRecordingConsent(
                        recordingConsentViewer,
                        "declined"
                      )
                    }
                    className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-5 py-3 font-black text-yellow-100"
                  >
                    Decline recording
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      respondToRecordingConsent(
                        recordingConsentViewer,
                        "left"
                      )
                    }
                    className="rounded-2xl border border-red-300/30 bg-red-300/10 px-5 py-3 font-black text-red-100"
                  >
                    Leave meeting
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {reportAbuseOpen ? (
            <div className="fixed inset-0 z-[100001] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
              <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-300/20 bg-[#121820] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
                      Nexus Teams Safety
                    </div>
                    <h2 className="mt-2 text-2xl font-black">Report abuse</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Report concerning behaviour for review. Meeting context and
                      selected evidence references will be attached securely.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReportAbuseOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="text-sm font-black">Type of abuse *</span>
                    <select
                      value={reportAbuseType}
                      onChange={(event) => setReportAbuseType(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-yellow-300/40"
                    >
                      <option value="">Select abuse type</option>
                      <option value="harassment">Harassment or bullying</option>
                      <option value="hate">Hate or discriminatory conduct</option>
                      <option value="threat">Threats or violence</option>
                      <option value="sexual">Sexual or inappropriate conduct</option>
                      <option value="spam">Spam or disruption</option>
                      <option value="impersonation">Impersonation</option>
                      <option value="other">Other safety concern</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black">Participant(s) *</span>
                    <input
                      value={reportedParticipantName}
                      onChange={(event) => setReportedParticipantName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-yellow-300/40"
                    />
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black">Describe the abuse *</span>
                      <span className="text-xs text-slate-500">
                        {reportAbuseDescription.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={reportAbuseDescription}
                      maxLength={1000}
                      onChange={(event) => setReportAbuseDescription(event.target.value)}
                      rows={7}
                      className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-yellow-300/40"
                      placeholder="Explain what happened and include relevant context."
                    />
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-black">Optional evidence</div>
                    <div className="mt-3 grid gap-3 text-sm">
                      {[
                        ["Short meeting clip", reportIncludeClip, setReportIncludeClip],
                        ["Transcript excerpt", reportIncludeTranscript, setReportIncludeTranscript],
                        ["Screenshot reference", reportIncludeScreenshot, setReportIncludeScreenshot],
                        ["Shared file reference", reportIncludeSharedFile, setReportIncludeSharedFile],
                      ].map(([label, enabled, setter]: any) => (
                        <label key={label} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => setter(event.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {reportStatus ? (
                    <div className="rounded-2xl border border-yellow-300/25 bg-yellow-300/[0.08] p-3 text-sm text-yellow-100">
                      {reportStatus}
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setReportAbuseOpen(false)}
                      className="rounded-2xl border border-white/10 px-5 py-3 font-black"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitAbuseReport}
                      className="rounded-2xl bg-yellow-300 px-5 py-3 font-black text-[#171204]"
                    >
                      Submit report
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {meetingLifecycleDialog ? (
            <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
              <section className="w-full max-w-lg rounded-[2rem] border border-cyan-300/20 bg-[#111a25] p-6 shadow-2xl">
                <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
                  Meeting confirmation
                </div>

                <h2 className="mt-3 text-2xl font-black">
                  {meetingLifecycleDialog === "leave"
                    ? "Leave this meeting?"
                    : meetingLifecycleDialog === "end"
                    ? "End meeting for everyone?"
                    : meetingLifecycleDialog === "transfer-host"
                    ? "Change host authority?"
                    : meetingLifecycleDialog === "request-host"
                    ? "Request host control?"
                    : meetingLifecycleDialog === "review-host-request"
                    ? "Review host-control request?"
                    : meetingLifecycleDialog === "owner-recovery"
                    ? "Recover owner authority?"
                    : meetingLifecycleDialog === "lock"
                    ? "Lock meeting?"
                    : meetingLifecycleDialog === "unlock"
                    ? "Unlock meeting?"
                    : meetingLifecycleDialog === "record-start"
                    ? "Start recording?"
                    : "Stop recording?"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {meetingLifecycleDialog === "leave"
                    ? "You will leave the room. Other participants may continue."
                    : meetingLifecycleDialog === "end"
                    ? "Every participant will be disconnected and meeting intelligence will enter finalization."
                    : meetingLifecycleDialog === "transfer-host"
                    ? hostTransferMode === "make-cohost"
                      ? "The selected participant will become a co-host while you retain host authority."
                      : "The selected participant will become host and you will become a participant."
                    : meetingLifecycleDialog === "request-host"
                    ? `A request will be sent to ${primaryHostName}. The current host can approve host, approve co-host, or decline.`
                    : meetingLifecycleDialog === "review-host-request"
                    ? "Choose whether to grant host authority, co-host authority, or decline the request."
                    : meetingLifecycleDialog === "owner-recovery"
                    ? "Emergency recovery restores the meeting owner as host. Existing hosts are retained as co-hosts, and the action is audited."
                    : meetingLifecycleDialog === "lock"
                    ? "New participants will not be able to enter until the room is unlocked."
                    : meetingLifecycleDialog === "unlock"
                    ? "New participants may enter according to the waiting-room policy."
                    : meetingLifecycleDialog === "record-start"
                    ? "Participants should be notified that recording has started."
                    : "The active recording will be stopped and prepared for processing."}
                </p>

                {meetingLifecycleDialog === "recording-consent" ? (
                  <div className="mt-5">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        Recording consent
                      </div>

                      <div className="mt-2 text-sm font-black">
                        {recordingPolicyLabel()}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3">
                          <div className="text-xl font-black text-emerald-200">
                            {agreedConsentCount}
                          </div>
                          <div className="mt-1 text-slate-400">Agreed</div>
                        </div>

                        <div className="rounded-xl border border-yellow-300/20 bg-yellow-300/[0.06] p-3">
                          <div className="text-xl font-black text-yellow-200">
                            {pendingConsentCount}
                          </div>
                          <div className="mt-1 text-slate-400">Pending</div>
                        </div>

                        <div className="rounded-xl border border-red-300/20 bg-red-300/[0.06] p-3">
                          <div className="text-xl font-black text-red-200">
                            {declinedConsentCount}
                          </div>
                          <div className="mt-1 text-slate-400">Declined</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                      {recordingConsentRows.map((row) => (
                        <div
                          key={row.name}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                        >
                          <div>
                            <div className="font-black">{row.name}</div>
                            <div className="text-xs text-slate-500">{row.role}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-black ${
                                row.status === "agreed" || row.status === "exempt"
                                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                                  : row.status === "declined"
                                  ? "border-red-300/25 bg-red-300/10 text-red-200"
                                  : "border-yellow-300/25 bg-yellow-300/10 text-yellow-200"
                              }`}
                            >
                              {row.status}
                            </span>

                            {row.status === "pending" ? (
                              <button
                                type="button"
                                onClick={() => requestConsentFromParticipant(row.name)}
                                className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100"
                              >
                                Request
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {meetingLifecycleDialog === "transfer-host" ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-sm font-black">
                        Authority change
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setHostTransferMode("complete-transfer")
                          }
                          className={`rounded-2xl border p-3 text-left text-sm ${
                            hostTransferMode === "complete-transfer"
                              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="font-black">
                            Transfer host
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            You become a participant.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setHostTransferMode("make-cohost")
                          }
                          className={`rounded-2xl border p-3 text-left text-sm ${
                            hostTransferMode === "make-cohost"
                              ? "border-purple-300/40 bg-purple-300/10 text-purple-100"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="font-black">
                            Make co-host
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            You retain host authority.
                          </div>
                        </button>
                      </div>
                    </div>

                    <select
                      value={transferHostTarget}
                      onChange={(event) =>
                        setTransferHostTarget(event.target.value)
                      }
                      className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                    >
                      <option value="">
                        Select eligible participant
                      </option>

                      {eligibleHostTargets.map(
                        (participant: any, index: number) => {
                          const name = participantName(
                            participant,
                            index
                          );

                          return (
                            <option key={name} value={name}>
                              {name} · {participantRole(participant)}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMeetingLifecycleDialog(null);
                      setTransferHostTarget("");
                      setHostTransferMode("complete-transfer");
                    }}
                    className="rounded-2xl border border-white/10 px-5 py-3 font-black"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      meetingLifecycleDialog === "recording-consent" &&
                      !recordingPolicySatisfied
                    }
                    onClick={
                      meetingLifecycleDialog === "recording-consent"
                        ? startRecordingAfterConsent
                        : meetingLifecycleDialog === "transfer-host"
                        ? transferHostAuthority
                        : meetingLifecycleDialog === "request-host"
                        ? requestHostControl
                        : meetingLifecycleDialog === "owner-recovery"
                        ? recoverMeetingOwnerAuthority
                        : confirmMeetingLifecycleAction
                    }
                    className={`rounded-2xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40 ${
                      meetingLifecycleDialog === "end"
                        ? "bg-red-500 text-white"
                        : "bg-cyan-400 text-[#061018]"
                    }`}
                  >
                    {meetingLifecycleDialog === "recording-consent"
                      ? "Start recording"
                      : meetingLifecycleDialog === "transfer-host"
                      ? hostTransferMode === "make-cohost"
                        ? "Make co-host"
                        : "Transfer host"
                      : meetingLifecycleDialog === "request-host"
                      ? "Send request"
                      : meetingLifecycleDialog === "owner-recovery"
                      ? "Recover authority"
                      : "Confirm"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {meetingEnded ? (
            <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/80 p-6 backdrop-blur-md">
              <div className="w-full max-w-lg rounded-[2rem] border border-red-300/25 bg-[#101923] p-8 text-center shadow-2xl">
                <img
                  src={NEXUS_LOGO_URL}
                  alt="Nexus Teams"
                  className="mx-auto h-16 w-16 rounded-2xl object-cover"
                />
                <h2 className="mt-5 text-3xl font-black">Meeting ended</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The host ended this meeting for everyone. Transcript, decisions,
                  action items, and meeting intelligence can now be finalized.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/nexus/meetings/${meetingCode}`;
                  }}
                  className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-black text-[#061018]"
                >
                  Return to meeting workspace
                </button>
              </div>
            </div>
          ) : null}

          {/*
            Hidden RioMind meeting-intelligence runtime.

            This component remains mounted so its data loading, synchronization,
            reasoning, graph, memory, timeline, and intelligence effects continue
            running. Only its developer-facing visual dashboard is hidden from the
            normal meeting experience.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          >
            <TeamIntelligenceWorkspace meetingCode={meetingCode} />
          </div>

          <aside className="sticky top-3 h-[calc(100vh-1.5rem)] w-[330px] shrink-0 self-start overflow-hidden border-l border-cyan-300/15 bg-[#07111c] p-3">
            <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.045]">
              <div className="shrink-0 border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={NEXUS_LOGO_URL}
                  alt="Nexus Meeting Assistant"
                  className="h-11 w-11 rounded-2xl object-cover shadow-[0_0_24px_rgba(34,211,238,0.22)]"
                />

                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                    Meeting Assistant
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    RioMind oversight active
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-1.5 text-[10px]">
                {[
                  ["summary", "Summary", 1],
                  [
                    "decisions",
                    "Decisions",
                    activeIntelligenceCount(
                      detectedDecisions
                    ),
                  ],
                  [
                    "actions",
                    "Actions",
                    activeIntelligenceCount(
                      detectedActions
                    ),
                  ],
                  [
                    "risks",
                    "Risks",
                    activeIntelligenceCount(
                      detectedRisks
                    ),
                  ],
                ].map(([section, label, count]: any) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => {
                      setAssistantSection(section);
                      setAssistantViewAll(null);
                    }}
                    className={`rounded-xl border px-2 py-2 font-black transition ${
                      assistantSection === section
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-black/20 text-slate-400 hover:border-cyan-300/25"
                    }`}
                  >
                    <div>{label}</div>
                    <div className="mt-1 text-sm">
                      {count}
                    </div>
                  </button>
                ))}
              </div>
              </div>

              <div className="nexus-muted-scrollbar min-h-0 overflow-y-auto overscroll-contain p-4 pr-3 [scrollbar-gutter:stable]">
              {assistantNotice ? (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs text-emerald-200">
                  <span>{assistantNotice}</span>

                  <button
                    type="button"
                    onClick={() => setAssistantNotice("")}
                    className="font-black"
                  >
                    ×
                  </button>
                </div>
              ) : null}

              <div className="mt-4">
                {assistantSection === "summary" ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-black">
                        Live Summary
                      </div>

                      <span className="text-xs font-black text-emerald-300">
                        ● Live
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-300">
                      {liveMeetingSummary}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={generateClosingSummary}
                        className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-100"
                      >
                        Refresh summary
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setBottomPanel("voice")
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black"
                      >
                        Open transcript
                      </button>
                    </div>
                  </div>
                ) : null}

                {assistantSection === "decisions" ? (
                  <div className="space-y-2">
                    {detectedDecisions.length > 3 ? (
                      <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <span className="text-slate-400">
                          Showing {assistantViewAll === "decisions" ? "all" : "latest 3"} of {detectedDecisions.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssistantViewAll(
                              assistantViewAll === "decisions"
                                ? null
                                : "decisions"
                            )
                          }
                          className="font-black text-cyan-300"
                        >
                          {assistantViewAll === "decisions"
                            ? "Show latest"
                            : "View all"}
                        </button>
                      </div>
                    ) : null}

                    {(
                      assistantViewAll === "decisions"
                        ? detectedDecisions
                        : detectedDecisions.slice(0, 3)
                    ).map((decision) => (
                      <article
                        key={decision.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black">
                              {decision.title}
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-400">
                              {decision.detail}
                            </p>
                          </div>

                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black text-cyan-100">
                            {decision.confidence}%
                          </span>
                        </div>

                        <div className="mt-3 flex gap-2">
                          {decision.status === "detected" ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateIntelligenceRecord(
                                  "decisions",
                                  decision.id,
                                  "accepted"
                                )
                              }
                              className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-100"
                            >
                              Accept
                            </button>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-emerald-300">
                              {decision.status}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              updateIntelligenceRecord(
                                "decisions",
                                decision.id,
                                "dismissed"
                              )
                            }
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-black"
                          >
                            Dismiss
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {assistantSection === "actions" ? (
                  <div className="space-y-2">
                    {detectedActions.length > 3 ? (
                      <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <span className="text-slate-400">
                          Showing {assistantViewAll === "actions" ? "all" : "latest 3"} of {detectedActions.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssistantViewAll(
                              assistantViewAll === "actions"
                                ? null
                                : "actions"
                            )
                          }
                          className="font-black text-cyan-300"
                        >
                          {assistantViewAll === "actions"
                            ? "Show latest"
                            : "View all"}
                        </button>
                      </div>
                    ) : null}

                    {(
                      assistantViewAll === "actions"
                        ? detectedActions
                        : detectedActions.slice(0, 3)
                    ).map((actionItem) => (
                      <article
                        key={actionItem.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="text-sm font-black">
                          {actionItem.title}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {actionItem.detail}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-lg border border-white/10 p-2">
                            <span className="text-slate-500">
                              Owner
                            </span>
                            <div className="mt-1 font-black">
                              {actionItem.owner ||
                                "Unassigned"}
                            </div>
                          </div>

                          <div className="rounded-lg border border-white/10 p-2">
                            <span className="text-slate-500">
                              Due
                            </span>
                            <div className="mt-1 font-black">
                              {actionItem.due ||
                                "Not set"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateIntelligenceRecord(
                                "actions",
                                actionItem.id,
                                "accepted"
                              )
                            }
                            className="rounded-lg border border-purple-300/20 bg-purple-300/10 px-2.5 py-1.5 text-[10px] font-black text-purple-100"
                          >
                            Create action
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateIntelligenceRecord(
                                "actions",
                                actionItem.id,
                                "resolved"
                              )
                            }
                            className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-100"
                          >
                            Complete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {assistantSection === "risks" ? (
                  <div className="space-y-2">
                    {detectedRisks.length > 3 ? (
                      <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <span className="text-slate-400">
                          Showing {assistantViewAll === "risks" ? "all" : "latest 3"} of {detectedRisks.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssistantViewAll(
                              assistantViewAll === "risks"
                                ? null
                                : "risks"
                            )
                          }
                          className="font-black text-cyan-300"
                        >
                          {assistantViewAll === "risks"
                            ? "Show latest"
                            : "View all"}
                        </button>
                      </div>
                    ) : null}

                    {(
                      assistantViewAll === "risks"
                        ? detectedRisks
                        : detectedRisks.slice(0, 3)
                    ).map((risk) => (
                      <article
                        key={risk.id}
                        className="rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.05] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-yellow-100">
                            {risk.title}
                          </div>

                          <span className="text-[10px] font-black text-yellow-300">
                            {risk.confidence}%
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {risk.detail}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            updateIntelligenceRecord(
                              "risks",
                              risk.id,
                              "resolved"
                            )
                          }
                          className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-100"
                        >
                          Mark resolved
                        </button>
                      </article>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setAssistantSection("questions")
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black"
                    >
                      Open questions (
                      {activeIntelligenceCount(
                        openMeetingQuestions
                      )}
                      )
                    </button>
                  </div>
                ) : null}

                {assistantSection === "questions" ? (
                  <div className="space-y-2">
                    {openMeetingQuestions.length > 3 ? (
                      <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <span className="text-slate-400">
                          Showing {assistantViewAll === "questions" ? "all" : "latest 3"} of {openMeetingQuestions.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssistantViewAll(
                              assistantViewAll === "questions"
                                ? null
                                : "questions"
                            )
                          }
                          className="font-black text-cyan-300"
                        >
                          {assistantViewAll === "questions"
                            ? "Show latest"
                            : "View all"}
                        </button>
                      </div>
                    ) : null}

                    {(
                      assistantViewAll === "questions"
                        ? openMeetingQuestions
                        : openMeetingQuestions.slice(0, 3)
                    ).map((question) => (
                      <article
                        key={question.id}
                        className="rounded-2xl border border-purple-300/20 bg-purple-300/[0.05] p-3"
                      >
                        <div className="text-sm font-black">
                          {question.title}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {question.detail}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            updateIntelligenceRecord(
                              "questions",
                              question.id,
                              "resolved"
                            )
                          }
                          className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-100"
                        >
                          Mark answered
                        </button>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              {assistantSuggestions.some(
                (suggestion) => !suggestion.dismissed
              ) ? (
                <div className="mt-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                    Proactive suggestions
                  </div>

                  <div className="mt-2 space-y-2">
                    {assistantSuggestions
                      .filter(
                        (suggestion) =>
                          !suggestion.dismissed
                      )
                      .slice(
                        0,
                        assistantSuggestionsOpen ? 3 : 1
                      )
                      .map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="rounded-2xl border border-purple-300/20 bg-purple-300/[0.05] p-3"
                        >
                          <div className="text-xs font-black">
                            {suggestion.title}
                          </div>

                          <p className="mt-1 text-[11px] leading-5 text-slate-400">
                            {suggestion.detail}
                          </p>

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleAssistantSuggestion(
                                  suggestion
                                )
                              }
                              className="rounded-lg bg-purple-300 px-2.5 py-1.5 text-[10px] font-black text-[#12091d]"
                            >
                              {suggestion.action}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setAssistantSuggestions(
                                  (items) =>
                                    items.map((item) =>
                                      item.id ===
                                      suggestion.id
                                        ? {
                                            ...item,
                                            dismissed: true,
                                          }
                                        : item
                                    )
                                )
                              }
                              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-black"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {assistantSuggestions.filter(
                    (suggestion) => !suggestion.dismissed
                  ).length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setAssistantSuggestionsOpen(
                          (current) => !current
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center text-[10px] font-black text-slate-400 transition hover:border-purple-300/25 hover:text-purple-100"
                    >
                      {assistantSuggestionsOpen
                        ? "Show latest recommendation"
                        : `+${
                            assistantSuggestions.filter(
                              (suggestion) =>
                                !suggestion.dismissed
                            ).length - 1
                          } recommendations retained`}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <button
                  type="button"
                  onClick={() =>
                    setAssistantAskOpen((current) => !current)
                  }
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    Ask Nexus
                  </span>

                  <span className="text-xs font-black text-slate-400">
                    {assistantAskOpen ? "−" : "+"}
                  </span>
                </button>

                {assistantAskOpen ? (
                  <div>

                {assistantConversation.length ? (
                  <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                    {assistantConversation
                      .slice(-6)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-xl border p-2.5 text-xs ${
                            message.role === "user"
                              ? "ml-5 border-cyan-300/20 bg-cyan-300/[0.07]"
                              : "mr-5 border-purple-300/20 bg-purple-300/[0.07]"
                          }`}
                        >
                          <div className="font-black">
                            {message.role === "user"
                              ? "You"
                              : "Nexus"}
                          </div>

                          <p className="mt-1 whitespace-pre-line leading-5 text-slate-300">
                            {message.body}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Ask about decisions, actions, risks, participants, recording, translation, or the speaking queue.
                  </p>
                )}

                {assistantThinking ? (
                  <div className="mt-2 text-xs text-cyan-300">
                    Nexus is reviewing the meeting…
                  </div>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <input
                    value={assistantQuestion}
                    onChange={(event) =>
                      setAssistantQuestion(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        answerMeetingQuestion();
                      }
                    }}
                    placeholder="Ask about this meeting…"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none focus:border-cyan-300/40"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      answerMeetingQuestion()
                    }
                    disabled={
                      assistantThinking ||
                      !assistantQuestion.trim()
                    }
                    className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-[#061018] disabled:opacity-40"
                  >
                    Ask
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    "What decisions were made?",
                    "Who owns the action item?",
                    "What risks remain?",
                  ].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() =>
                        answerMeetingQuestion(question)
                      }
                      className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Ask about decisions, actions, risks, participants, recording, or translation.
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <div className="text-slate-500">
                    Recording
                  </div>
                  <div
                    className={`mt-1 font-black ${
                      recordingActive
                        ? "text-red-300"
                        : recordingConsentRequested
                        ? "text-yellow-300"
                        : "text-slate-300"
                    }`}
                  >
                    {recordingActive
                      ? "● Active"
                      : recordingConsentRequested
                      ? "Consent pending"
                      : "Off"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <div className="text-slate-500">
                    Translation
                  </div>
                  <div className="mt-1 font-black text-emerald-300">
                    {String(sourceLanguage).toUpperCase()} →{" "}
                    {String(listenLanguage).toUpperCase()}
                  </div>
                </div>
              </div>

              </div>

              <footer className="shrink-0 border-t border-white/10 bg-[#07111c]/95 p-3 backdrop-blur-xl">
              {process.env.NODE_ENV !== "production" ? (
                <button
                  type="button"
                  onClick={clearRuleGeneratedTestIntelligence}
                  className="mt-4 w-full rounded-xl border border-yellow-300/20 bg-yellow-300/[0.05] px-3 py-2.5 text-xs font-black text-yellow-100 transition hover:border-yellow-300/40"
                >
                  Clear test detections
                </button>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  setMoreToolPanel(
                    "Conference Analytics"
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 px-3 py-2.5 text-xs font-black text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-100"
              >
                Admin intelligence details
              </button>
              </footer>
            </section>
          </aside>
      </div>
    </main>
  </SimpleMeetingShell>
  );
}
