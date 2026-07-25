"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const languageMeta: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "French" },
  zh: { flag: "🇨🇳", label: "Chinese" },
  yo: { flag: "🇳🇬", label: "Yoruba" },
  ig: { flag: "🇳🇬", label: "Igbo" },
  ha: { flag: "🇳🇬", label: "Hausa" },
  pcm: { flag: "🇳🇬", label: "Pidgin" },
  es: { flag: "🇪🇸", label: "Spanish" },
  ar: { flag: "🇸🇦", label: "Arabic" },
  de: { flag: "🇩🇪", label: "German" },
  ja: { flag: "🇯🇵", label: "Japanese" },
  ko: { flag: "🇰🇷", label: "Korean" },
  hi: { flag: "🇮🇳", label: "Hindi" },
  pt: { flag: "🇵🇹", label: "Portuguese" },
  ru: { flag: "🇷🇺", label: "Russian" },
};

const meetingModeProfiles: Record<string, { title: string; speaker: string; audience: string; rule: string }> = {
  discussion: {
    title: "Discussion Mode",
    speaker: "Everyone can participate",
    audience: "Open collaboration",
    rule: "Best for normal team meetings and small group discussions.",
  },
  lecture: {
    title: "Lecture Mode",
    speaker: "Teacher / lecturer speaks",
    audience: "Students muted by default",
    rule: "Students use raise hand and host approves speaking.",
  },
  classroom: {
    title: "Classroom Mode",
    speaker: "Teacher and assistants lead",
    audience: "Students participate by permission",
    rule: "Best for schools, colleges, universities, and training.",
  },
  town_hall: {
    title: "Town Hall Mode",
    speaker: "Host and panelists speak",
    audience: "Large audience with Q&A queue",
    rule: "Best for company-wide or public community sessions.",
  },
  podcast: {
    title: "Podcast Mode",
    speaker: "Hosts and invited speakers",
    audience: "Listeners can raise hand",
    rule: "Best for audio-led conversations and interviews.",
  },
  church_service: {
    title: "Church Service Mode",
    speaker: "Pastor, ministers, choir, stage speakers",
    audience: "Congregation listens and participates as allowed",
    rule: "Best for services, programmes, studies, and online/offsite worship.",
  },
  webinar: {
    title: "Webinar Mode",
    speaker: "Presenter and panelists",
    audience: "Audience listens, chats, and raises hand",
    rule: "Best for training, product demos, and presentations.",
  },
  board_meeting: {
    title: "Board Meeting Mode",
    speaker: "Chair, board members, invited presenters",
    audience: "Observers limited by role",
    rule: "Best for executive, governance, and strategic meetings.",
  },
  mega_event: {
    title: "Broadcast / Mega Event",
    speaker: "Stage hosts and approved speakers",
    audience: "Massive audience, 1M+ capable architecture",
    rule: "Best for major programmes, conferences, and large public events.",
  },
};

const presenceMeta: Record<string, { icon: string; label: string }> = {
  online: { icon: "🟢", label: "Online" },
  away: { icon: "🟡", label: "Away" },
  busy: { icon: "🔴", label: "Busy" },
  in_meeting: { icon: "🟣", label: "In Meeting" },
  offline: { icon: "⚫", label: "Offline" },
};

const languageOptions = [
  ["en", "English"],
  ["es", "Spanish"],
  ["zh", "Mandarin Chinese"],
  ["hi", "Hindi"],
  ["ar", "Arabic"],
  ["fr", "French"],
  ["pt", "Portuguese"],
  ["ru", "Russian"],
  ["de", "German"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["it", "Italian"],
  ["tr", "Turkish"],
  ["id", "Indonesian"],
  ["vi", "Vietnamese"],
  ["bn", "Bengali"],
  ["pcm", "Nigerian Pidgin"],
  ["yo", "Yoruba"],
  ["ha", "Hausa"],
  ["ig", "Igbo"],
  ["sw", "Swahili"],
  ["am", "Amharic"],
  ["zu", "Zulu"],
  ["af", "Afrikaans"],
];

export default function MeetingWorkspace({
  params,
}: {
  params: Promise<{ meetingCode: string }>;
}) {
  const [meetingCode, setMeetingCode] = useState("");
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [raiseHands, setRaiseHands] = useState<any[]>([]);
  const [voiceSession, setVoiceSession] = useState<any>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantLanguage, setParticipantLanguage] = useState("en");
  const [message, setMessage] = useState("");
  const [activeMeetingTab, setActiveMeetingTab] = useState<"voice" | "chat" | "participants" | "files" | "ai">("voice");
  const [meetingMessages, setMeetingMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSenderName, setChatSenderName] = useState("John");
  const [chatSenderEmail, setChatSenderEmail] = useState("john@example.com");
  const [chatSenderLanguage, setChatSenderLanguage] = useState("en");
  const [meetingPreferredLanguage, setMeetingPreferredLanguage] = useState("en");
  const [speechSourceLanguage, setSpeechSourceLanguage] = useState("en");
  const [activePresentationFile, setActivePresentationFile] = useState<any>(null);
  const [activeFileReview, setActiveFileReview] = useState<any>(null);
  const [voiceTranscripts, setVoiceTranscripts] = useState<any[]>([]);
  const [voiceTranscriptDraft, setVoiceTranscriptDraft] = useState("");
  const [isListeningToMic, setIsListeningToMic] = useState(false);
  const [micDebugStatus, setMicDebugStatus] = useState("Mic idle");
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [isStreamingMic, setIsStreamingMic] = useState(false);
  const [streamingRecorder, setStreamingRecorder] = useState<any>(null);
  const [streamingChunkCount, setStreamingChunkCount] = useState(0);
  const [streamingFailedChunkCount, setStreamingFailedChunkCount] = useState(0);
  const [autoPlayTranslatedVoice, setAutoPlayTranslatedVoice] = useState(false);
  const [lastSttProviderStatus, setLastSttProviderStatus] = useState("STT provider: waiting");
  const [translatedVoiceStatus, setTranslatedVoiceStatus] = useState("Translated voice: idle");
  const [speakerVoiceProfiles, setSpeakerVoiceProfiles] = useState<any[]>([]);
  const [speakerVoiceStyle, setSpeakerVoiceStyle] = useState("verse");
  const [speakerVoiceConsent, setSpeakerVoiceConsent] = useState(true);
  const [voiceSampleRecorder, setVoiceSampleRecorder] = useState<MediaRecorder | null>(null);
  const [voiceSampleBlob, setVoiceSampleBlob] = useState<Blob | null>(null);
  const [voiceSampleUrl, setVoiceSampleUrl] = useState("");
  const [isRecordingVoiceSample, setIsRecordingVoiceSample] = useState(false);
  const [isRealtimeVoiceReady, setIsRealtimeVoiceReady] = useState(false);
  const [isRealtimeVoiceConnected, setIsRealtimeVoiceConnected] = useState(false);
  const [realtimeVoiceStatus, setRealtimeVoiceStatus] = useState("Realtime idle");
  const realtimePeerRef = useRef<RTCPeerConnection | null>(null);
  const realtimeDataChannelRef = useRef<RTCDataChannel | null>(null);
  const realtimeStreamRef = useRef<MediaStream | null>(null);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const deepgramRecorderRef = useRef<MediaRecorder | null>(null);
  const translatedVoiceQueueRef = useRef<string[]>([]);
  const translatedVoicePlayingRef = useRef(false);
  const streamingStopRequestedRef = useRef(false);
  const streamingStreamRef = useRef<MediaStream | null>(null);
  const streamingChunkQueueRef = useRef<Blob[]>([]);
  const streamingProcessingRef = useRef(false);
  const streamingSequenceRef = useRef(0);
  const streamingFailedChunksRef = useRef<Blob[]>([]);
  const [hostControls, setHostControls] = useState({
    waitingRoomEnabled: true,
    pauseEntryEnabled: false,
    autoAdmitEnabled: false,
    hostOnlyMute: true,
    allowParticipantUnmute: false,
    screenShareMode: "host_only",
    meetingLocked: false,
    meetingMode: "discussion",
  });

  useEffect(() => {
    params.then((p) => setMeetingCode(p.meetingCode));
  }, [params]);

  async function loadMeeting() {
    if (!meetingCode) return;
    setLoading(true);

    try {
      const [meetingRes, participantsRes, rolesRes, raiseHandsRes, voiceRes, messagesRes, transcriptsRes] =
        await Promise.all([
          fetch(`/api/riomind/meetings/${meetingCode}`, { cache: "no-store" }),
          fetch(`/api/riomind/meetings/${meetingCode}/participants`, { cache: "no-store" }),
          fetch(`/api/riomind/meetings/${meetingCode}/roles`, { cache: "no-store" }),
          fetch(`/api/riomind/meetings/${meetingCode}/raise-hands`, { cache: "no-store" }),
          fetch(`/api/riomind/meetings/${meetingCode}/voice`, { cache: "no-store" }),
            fetch(`/api/riomind/meetings/${meetingCode}/messages`, { cache: "no-store" }),
            fetch(`/api/riomind/meetings/${meetingCode}/voice/transcripts`, { cache: "no-store" }),
        ]);

      const meetingJson = await meetingRes.json();
      const participantsJson = await participantsRes.json();

      const rolesJson = await rolesRes.json().catch(() => ({}));
      const raiseHandsJson = await raiseHandsRes.json().catch(() => ({}));
      const voiceJson = await voiceRes.json().catch(() => ({}));
      const messagesJson = await messagesRes.json().catch(() => ({}));
      const transcriptsJson = await transcriptsRes.json().catch(() => ({}));

      if (meetingJson.ok) {
        setMeeting(meetingJson.meeting);
        setHostControls({
          waitingRoomEnabled: !!meetingJson.meeting.waiting_room_enabled,
          pauseEntryEnabled: !!meetingJson.meeting.pause_entry_enabled,
          autoAdmitEnabled: !!meetingJson.meeting.auto_admit_enabled,
          hostOnlyMute: !!meetingJson.meeting.host_only_mute,
          allowParticipantUnmute: !!meetingJson.meeting.allow_participant_unmute,
          screenShareMode: meetingJson.meeting.screen_share_mode || "host_only",
          meetingLocked: !!meetingJson.meeting.meeting_locked,
          meetingMode: meetingJson.meeting.meeting_mode || "discussion",
        });
      }
      if (participantsJson.ok) setParticipants(participantsJson.participants || []);

        if (rolesJson.ok) setRoles(rolesJson.roles || []);

        if (raiseHandsJson.ok) setRaiseHands(raiseHandsJson.raiseHands || []);

        if (voiceJson.ok) {
          setVoiceSession(voiceJson.voiceSession || null);
          setVoiceParticipants(voiceJson.voiceParticipants || []);
        }

        if (messagesJson.ok) {
          setMeetingMessages(messagesJson.messages || []);
        }

        if (transcriptsJson.ok) {
          setVoiceTranscripts(transcriptsJson.transcripts || []);
        }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeeting();
    loadSpeakerVoiceProfiles();
  }, [meetingCode]);

  useEffect(() => {
    if (!meetingCode) return;
    if (activeMeetingTab !== "chat" && activeMeetingTab !== "ai") return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/riomind/meetings/${meetingCode}/messages`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (json.ok) {
          setMeetingMessages(json.messages || []);

          const transcriptRes = await fetch(`/api/riomind/meetings/${meetingCode}/voice/transcripts`, {
            cache: "no-store",
          });
          const transcriptJson = await transcriptRes.json().catch(() => ({}));
          if (transcriptJson.ok) {
            setVoiceTranscripts(transcriptJson.transcripts || []);
          }
        }
      } catch (error) {
        console.error("Meeting message live sync failed", error);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [meetingCode, activeMeetingTab]);

  useEffect(() => {
    if (!meetingCode || !meetingPreferredLanguage) return;
    if (activeMeetingTab !== "voice" && activeMeetingTab !== "ai") return;

    const missing = voiceTranscripts
      .filter((item) => item?.id && !item.metadata?.translations?.[meetingPreferredLanguage])
      .slice(-8);

    if (missing.length === 0) return;

    let cancelled = false;

    async function syncMissingVoiceCaptions() {
      const results = await Promise.allSettled(
        missing.map(async (item) => {
          const res = await fetch(
            `/api/riomind/meetings/${meetingCode}/voice/transcripts/${item.id}/fanout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetLanguage: meetingPreferredLanguage,
                onlyTarget: true,
              }),
            }
          );

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json.ok || !json.transcript) {
            throw new Error(json.error || "Could not sync caption translation.");
          }

          return json.transcript;
        })
      );

      if (cancelled) return;

      const updated = new Map<string, any>();

      for (const result of results) {
        if (result.status === "fulfilled") {
          updated.set(result.value.id, result.value);
        }
      }

      if (updated.size > 0) {
        setVoiceTranscripts((current) =>
          current.map((item) => updated.get(item.id) || item)
        );
      }
    }

    syncMissingVoiceCaptions().catch((error) => {
      console.error("Instant voice caption sync failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, [meetingCode, activeMeetingTab, meetingPreferredLanguage, voiceTranscripts]);

  const lobby = useMemo(() => {
    const count = (status: string) => participants.filter((p) => p.participant_status === status).length;
    return {
      invited: count("invited"),
      accepted: count("accepted"),
      tentative: count("tentative"),
      waiting: count("waiting"),
      joined: count("joined"),
      declined: count("declined"),
      left: count("left"),
    };
  }, [participants]);

  const waitingParticipants = useMemo(
    () => participants.filter((p) => p.participant_status === "waiting"),
    [participants]
  );

  const countdown = useMemo(() => {
    if (!meeting?.meeting_date || !meeting?.meeting_time) return "No meeting time set";

    const datePart = String(meeting.meeting_date).slice(0, 10);
    const target = new Date(`${datePart}T${meeting.meeting_time}:00`);
    const diff = target.getTime() - Date.now();

    if (Number.isNaN(target.getTime())) return "Meeting time unavailable";
    if (diff <= 0) return "Meeting is ready now";

    const minutes = Math.floor(diff / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    if (days > 0) return `Starts in ${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}`;
    if (hours > 0) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}, ${mins} min${mins === 1 ? "" : "s"}`;
    return `Starts in ${mins} min${mins === 1 ? "" : "s"}`;
  }, [meeting]);

  async function saveHostControls(next: any) {
    setHostControls(next);

    const res = await fetch(`/api/riomind/meetings/${meetingCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setMeeting(json.meeting);
      setMessage("Host controls updated.");
    } else {
      setMessage(json.error || "Could not update host controls.");
    }
  }

  async function copyInviteLink() {
    const link = `${window.location.origin}${meeting.invite_link}`;
    await navigator.clipboard.writeText(link);
    setMessage("Invite link copied.");
  }

  async function allowNextSpeaker() {
    const next = raiseHands.find(
      (item) => !item.removed && item.hand_status !== "allowed"
    );

    if (!next) {
      setMessage("No raised hands waiting.");
      return;
    }

    await updateRaiseHand(next.id, {
      allowedToSpeak: true,
      muted: false,
      removed: false,
      handStatus: "allowed",
    });
  }

  async function sendMeetingMessage() {
    const value = chatMessage.trim();

    if (!value) return;

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderName: chatSenderName || meeting?.organizer || "Guest",
        senderEmail: chatSenderEmail || null,
        message: value,
        sourceLanguage: chatSenderLanguage || meeting?.default_language || "en",
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      let savedMessage = json.message;

      try {
        const fanoutRes = await fetch(`/api/riomind/meetings/${meetingCode}/translations/fanout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: savedMessage.id,
            text: value,
            sourceLanguage: speechSourceLanguage || "auto",
          }),
        });

        const fanoutJson = await fanoutRes.json().catch(() => ({}));

        if (fanoutJson.ok && fanoutJson.message) {
          savedMessage = fanoutJson.message;
        }
      } catch (error) {
        console.error("Meeting translation fanout failed", error);
      }

      setMeetingMessages((prev) => [...prev, savedMessage]);
      setChatMessage("");
      setMessage("Message sent and translation fanout completed.");
    } else {
      setMessage(json.error || "Could not send message.");
    }
  }

  async function updateMeetingMessage(messageId: string, patch: any) {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, ...patch }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setMeetingMessages((prev) =>
        prev.map((msg) => (msg.id === json.message.id ? json.message : msg))
      );
      return json.message;
    }

    setMessage(json.error || "Could not update message.");
    return null;
  }

  async function addChatReaction(item: any, reaction: string) {
    const reactions = item.metadata?.reactions || [];
    await updateMeetingMessage(item.id, {
      metadata: {
        ...(item.metadata || {}),
        reactions: [...reactions, reaction],
      },
    });
  }

  async function handleChatAction(action: string, item: any) {
    if (action === "translate") {
      const res = await fetch(`/api/riomind/meetings/${meetingCode}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: item.message,
          sourceLanguage: item.source_language || "auto",
          targetLanguage: chatSenderLanguage || "en",
        }),
      });

      const json = await res.json().catch(() => ({}));

      await updateMeetingMessage(item.id, {
        translatedLanguage: json.translation?.targetLanguage || chatSenderLanguage || "en",
        translatedMessage:
          json.translation?.translatedText ||
          `[${chatSenderLanguage || "en"} translation pending] ${item.message}`,
      });

      setMessage("Message translated and saved.");
      return;
    }

    if (action === "reply") {
      setChatMessage(`Replying to ${item.sender_name || "Guest"}: `);
      return;
    }

    if (action === "react") {
      setMessage(`Reaction placeholder added for message by ${item.sender_name || "Guest"}.`);
      return;
    }

    if (action === "pin") {
      await updateMeetingMessage(item.id, {
        metadata: {
          ...(item.metadata || {}),
          pinned: true,
        },
      });
      setMessage(`Pinned message: ${item.message}`);
      return;
    }
  }

  async function loadSpeakerVoiceProfiles() {
    if (!meetingCode) return;

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/profiles`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setSpeakerVoiceProfiles(json.profiles || []);
    }
  }

  async function saveCurrentSpeakerVoiceProfile() {
    const speakerName = chatSenderName || meeting?.organizer || "Guest";
    const speakerEmail = chatSenderEmail || null;

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speakerName,
        speakerEmail,
        consentStatus: speakerVoiceConsent ? "granted" : "pending",
        preferredVoiceStyle: speakerVoiceStyle,
        profileStatus: "foundation",
        metadata: {
          source: "nexus-teams-ui",
          future: "speaker-preserving translated voice identity",
        },
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      await loadSpeakerVoiceProfiles();
      setMessage("Speaker voice profile saved.");
    } else {
      setMessage(json.error || "Could not save speaker voice profile.");
    }
  }


  async function startVoiceSampleRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoiceSampleBlob(blob);
        setVoiceSampleUrl(url);
        setIsRecordingVoiceSample(false);
        stream.getTracks().forEach((track) => track.stop());
        setMessage("Speaker voice sample recorded.");
      };

      recorder.start();
      setVoiceSampleRecorder(recorder);
      setIsRecordingVoiceSample(true);
      setMessage("Recording speaker voice sample...");
    } catch (error: any) {
      setMessage(error?.message || "Could not start speaker voice sample recording.");
    }
  }

  function stopVoiceSampleRecording() {
    if (voiceSampleRecorder && voiceSampleRecorder.state !== "inactive") {
      voiceSampleRecorder.stop();
      setVoiceSampleRecorder(null);
    }
  }

  async function saveVoiceSampleToProfile() {
    if (!voiceSampleBlob) {
      setMessage("Record a speaker voice sample first.");
      return;
    }

    let profile = speakerVoiceProfiles.find(
      (item) =>
        (item.speaker_email || "").toLowerCase() === (chatSenderEmail || "").toLowerCase()
    );

    if (!profile) {
      await saveCurrentSpeakerVoiceProfile();
      await loadSpeakerVoiceProfiles();
    }

    const refreshedProfilesRes = await fetch(`/api/riomind/meetings/${meetingCode}/voice/profiles`, {
      cache: "no-store",
    });
    const refreshedProfilesJson = await refreshedProfilesRes.json().catch(() => ({}));
    const profiles = refreshedProfilesJson.profiles || [];
    setSpeakerVoiceProfiles(profiles);

    profile = profiles.find(
      (item: any) =>
        (item.speaker_email || "").toLowerCase() === (chatSenderEmail || "").toLowerCase()
    ) || profiles[0];

    if (!profile?.id) {
      setMessage("Could not resolve speaker voice profile for sample upload.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", voiceSampleBlob, "speaker-sample.webm");

    const res = await fetch(
      `/api/riomind/meetings/${meetingCode}/voice/profiles/${profile.id}/sample`,
      {
        method: "POST",
        body: formData,
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!json.ok) {
      setMessage(json.error || "Could not save speaker voice sample.");
      return;
    }

    await loadSpeakerVoiceProfiles();
    setMessage("Speaker voice sample saved. Profile is now enrolled foundation.");
  }


  async function waitForTargetTranslation(
    transcriptId: string,
    targetLanguage: string,
    attempts = 4,
    delayMs = 600
  ): Promise<string> {
    for (let i = 0; i < attempts; i += 1) {
      const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/transcripts`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      const items = Array.isArray(json?.transcripts) ? json.transcripts : [];
      const match = items.find((item: any) => String(item?.id) === String(transcriptId));
      const translated = String(match?.metadata?.translations?.[targetLanguage] || "").trim();

      if (translated) return translated;

      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return "";
  }

  async function queueTranslatedVoice(text: string) {
    const value = text.trim();

    if (!value) return;

    translatedVoiceQueueRef.current.push(value);

    if (translatedVoicePlayingRef.current) return;

    translatedVoicePlayingRef.current = true;

    try {
      while (translatedVoiceQueueRef.current.length > 0) {
        const next = translatedVoiceQueueRef.current.shift();

        if (next) {
          await playTranslatedVoice(next, meetingPreferredLanguage);
        }
      }
    } finally {
      translatedVoicePlayingRef.current = false;
    }
  }

  async function playTranslatedVoice(text: string, expectedLanguage = meetingPreferredLanguage) {
    const value = text.trim();

    if (!value) {
      setMessage("No translated caption to play.");
      return;
    }

    const currentOriginal = voiceTranscriptDraft.trim();

    if (
      expectedLanguage &&
      expectedLanguage !== "en" &&
      speechSourceLanguage === "en" &&
      currentOriginal &&
      value === currentOriginal
    ) {
      setTranslatedVoiceStatus("Translated voice blocked: target translation not ready");
      setMessage("Waiting for translated caption before voice playback.");
      return;
    }

    setMessage("Generating translated voice...");
    setTranslatedVoiceStatus("Translated voice: generating...");

    try {
      const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          language: meetingPreferredLanguage,
          speakerName: chatSenderName || meeting?.organizer || "Guest",
          speakerEmail: chatSenderEmail || null,
          voiceStyle: speakerVoiceStyle,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not generate translated voice.");
      }

      const ttsProvider = res.headers.get("X-RioMind-TTS-Provider") || "unknown";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1;
      await audio.play();

      setTranslatedVoiceStatus(`Translated voice: playing via ${ttsProvider}`);
      setMessage("Playing translated voice.");
    } catch (error: any) {
      setTranslatedVoiceStatus(`Translated voice failed: ${error?.message || "unknown"}`);
      setMessage(error?.message || "Translated voice playback failed.");
    }
  }

  async function reloadVoiceTranscripts() {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/transcripts`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setVoiceTranscripts(json.transcripts || []);
    }
  }

  function normalizeTranscriptForQuality(text: string) {
    return text
      .toLowerCase()
      .replace(/[.,!?'"“”‘’`~@#$%^&*()_+=[\]{}|\\:;<>/]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isLikelySpeechHallucination(text: string) {
    const normalized = normalizeTranscriptForQuality(text);

    if (!normalized) return true;

    const blockedContains = [
      "thank you for watching",
      "thank you thank you",
      "thanks for watching",
      "please subscribe",
      "subscribe to",
      "subscribe my channel",
      "like and subscribe",
      "don t forget to subscribe",
      "see you in the next video",
      "see you next time",
      "captions by",
      "subtitles by",
      "music playing",
      "background music",
      "applause",
      "bye bye",
      "goodbye",
    ];

    if (blockedContains.some((phrase) => normalized.includes(phrase))) {
      return true;
    }

    const blockedExact = new Set([
      "thank you",
      "thanks",
      "bye",
      "good bye",
      "subscribe",
      "you",
      "okay",
      "ok",
    ]);

    if (blockedExact.has(normalized)) return true;

    const words = normalized.split(" ").filter(Boolean);
    const uniqueWords = new Set(words);

    if (words.length <= 2) return true;
    if (words.length <= 6 && uniqueWords.size <= 2) return true;

    return false;
  }


  async function processStreamingAudioQueue() {
    if (streamingProcessingRef.current) return;

    streamingProcessingRef.current = true;

    try {
      while (streamingChunkQueueRef.current.length > 0) {
        const audioBlob = streamingChunkQueueRef.current.shift();

        if (!audioBlob || audioBlob.size < 2500) {
          continue;
        }

        const sequence = ++streamingSequenceRef.current;

        setIsTranscribingAudio(true);
        setMicDebugStatus(
          `Streaming segment ${sequence}: transcribing ${Math.round(audioBlob.size / 1024)} KB...`
        );

        try {
          const result = await transcribeAudioBlob(audioBlob);
          const transcriptText = result.transcriptText;

          if (!transcriptText.trim()) {
            setMicDebugStatus(`Streaming segment ${sequence} produced no transcript.`);
            continue;
          }

          if (isLikelySpeechHallucination(transcriptText)) {
            setMicDebugStatus(`Streaming segment ${sequence} ignored as silence/noise: "${transcriptText}"`);
            continue;
          }

          setVoiceTranscriptDraft(transcriptText);
          await saveVoiceTranscriptText(transcriptText);
          await reloadVoiceTranscripts();

          setStreamingChunkCount((count) => count + 1);
          setLastSttProviderStatus(`STT provider: ${result.provider} · segment ${sequence}`);
          setMicDebugStatus(`Streaming segment ${sequence} transcribed by ${result.provider}, saved, and translated.`);
          setMessage(`Live voice segment ${sequence} translated.`);
        } catch (error: any) {
          streamingFailedChunksRef.current.push(audioBlob);
          setStreamingFailedChunkCount((count) => count + 1);

          let details = error?.message || "unknown";

          if (typeof details === "string") {
            details = details.replace(/\s+/g, " ").trim();
          }

          setLastSttProviderStatus(`STT failed · segment ${sequence}`);
          setMicDebugStatus(
            `Streaming segment ${sequence} failed but stream continues: ${details}`
          );
          setMessage("One voice segment failed, but live streaming is still running.");
          console.error("Streaming transcription segment failed", {
            sequence,
            error,
            details,
          });
        } finally {
          setIsTranscribingAudio(false);
        }
      }
    } finally {
      streamingProcessingRef.current = false;
    }
  }

  function enqueueStreamingAudioChunk(audioBlob: Blob) {
    if (!audioBlob || audioBlob.size < 2500) return;

    streamingChunkQueueRef.current.push(audioBlob);
    processStreamingAudioQueue().catch((error) => {
      console.error("Streaming audio queue failed", error);
    });
  }


  function startStreamingSegment(stream: MediaStream) {
    if (streamingStopRequestedRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });

      if (blob.size > 1200) {
        enqueueStreamingAudioChunk(blob);
      }

      if (!streamingStopRequestedRef.current) {
        startStreamingSegment(stream);
      } else {
        setIsStreamingMic(false);
        setStreamingRecorder(null);
        setMicDebugStatus("Live voice streaming stopped.");
        setMessage("Live voice streaming stopped.");
        stream.getTracks().forEach((track) => track.stop());
        streamingStreamRef.current = null;
      }
    };

    setStreamingRecorder(recorder);
    recorder.start();

    window.setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 4500);
  }

  async function startRealtimeVoiceSession() {
    setIsRealtimeVoiceReady(false);
    setIsRealtimeVoiceConnected(false);
    setRealtimeVoiceStatus("Realtime unavailable: Deepgram token grant permission required.");
    setMessage("Realtime is not active yet. Use Start Live Voice while Deepgram temporary-token permission is enabled.");
  }

  function stopRealtimeVoiceSession() {
    setIsRealtimeVoiceReady(false);
    setIsRealtimeVoiceConnected(false);
    setRealtimeVoiceStatus("Realtime stopped.");
  }


  async function startStreamingMicCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      streamingStopRequestedRef.current = false;
      streamingChunkQueueRef.current = [];
      streamingProcessingRef.current = false;
      streamingSequenceRef.current = 0;
      streamingFailedChunksRef.current = [];
      setStreamingFailedChunkCount(0);
      streamingStreamRef.current = stream;
      setIsStreamingMic(true);
      setStreamingChunkCount(0);
      setMicDebugStatus("Live voice streaming started. Processing valid 4.5s audio segments...");
      setMessage("Live voice streaming started.");

      startStreamingSegment(stream);
    } catch (error: any) {
      setIsStreamingMic(false);
      setMicDebugStatus(`Live streaming mic error: ${error?.message || "unknown"}`);
      setMessage("Could not start live voice streaming. Check microphone permission.");
    }
  }

  function stopStreamingMicCapture() {
    streamingStopRequestedRef.current = true;

    if (streamingRecorder && streamingRecorder.state === "recording") {
      streamingRecorder.stop();
      return;
    }

    streamingStreamRef.current?.getTracks().forEach((track) => track.stop());
    streamingStreamRef.current = null;
    setIsStreamingMic(false);
    setStreamingRecorder(null);
  }


  async function startMicCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.onstart = () => {
        setIsListeningToMic(true);
        setMicDebugStatus("Recording microphone audio...");
        setMessage("Recording microphone audio...");
      };

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setRecordedAudioUrl(url);
        setRecordedAudioBlob(blob);
        setIsListeningToMic(false);
        setIsTranscribingAudio(true);
        setMicDebugStatus(`Audio recorded: ${Math.round(blob.size / 1024)} KB. Auto-transcribing...`);
        setMessage("Audio recorded. Auto-transcribing and translating...");

        stream.getTracks().forEach((track) => track.stop());

        try {
          const result = await transcribeAudioBlob(blob);
          const transcriptText = result.transcriptText;
          setVoiceTranscriptDraft(transcriptText);
          setMicDebugStatus(`Audio transcribed by ${result.provider}. Auto-saving and translating...`);
          await saveVoiceTranscriptText(transcriptText);
          setMicDebugStatus("Voice captured, transcribed, saved, and translated.");
          setMessage("Voice captured, transcribed, saved, and translated.");
        } catch (error: any) {
          setMicDebugStatus(`Auto voice pipeline failed: ${error?.message || "unknown"}`);
          setMessage(error?.message || "Auto voice pipeline failed.");
        } finally {
          setIsTranscribingAudio(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error: any) {
      setIsListeningToMic(false);
      setMicDebugStatus(`Mic recording error: ${error?.message || "unknown"}`);
      setMessage("Could not access microphone. Check browser permission.");
    }
  }

  function stopMicCapture() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  }

  async function transcribeAudioBlob(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.webm");
    formData.append("sourceLanguage", speechSourceLanguage || "en");

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/transcribe`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Could not transcribe audio.");
    }

    const transcriptText = String(json.transcriptText || "").trim();

    if (isLikelySpeechHallucination(transcriptText)) {
      throw new Error(`Ignored likely silence/noise transcript: "${transcriptText}"`);
    }

    return {
      transcriptText,
      provider: String(json.provider || "unknown"),
      attempts: json.attempts || [],
    };
  }

  async function transcribeRecordedAudio() {
    if (!recordedAudioBlob) {
      setMessage("No recorded audio to transcribe yet.");
      return;
    }

    setIsTranscribingAudio(true);
    setMicDebugStatus("Transcribing recorded audio...");

    try {
      const result = await transcribeAudioBlob(recordedAudioBlob);
      const transcriptText = result.transcriptText;

      setVoiceTranscriptDraft(transcriptText);
      setMicDebugStatus(`Audio transcribed by ${result.provider}. Click Add Transcript to save and translate.`);
      setMicDebugStatus((current) => current || "Audio transcribed. Click Add Transcript to save and translate.");
      setMessage("Audio transcribed. Click Add Transcript.");
    } catch (error: any) {
      setMicDebugStatus(`Transcription failed: ${error?.message || "unknown"}`);
      setMessage(error?.message || "Audio transcription failed.");
    } finally {
      setIsTranscribingAudio(false);
    }
  }

  async function saveVoiceTranscriptText(transcriptText: string) {
    const value = transcriptText.trim();

    if (!value) return;



    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/transcripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speakerName: chatSenderName || meeting?.organizer || "Guest",
        speakerEmail: chatSenderEmail || null,
        sourceLanguage: speechSourceLanguage || "auto",
        transcriptText: value,
        transcriptType: "speech",
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!json.ok || !json.transcript) {
      setMessage(json.error || "Could not save voice transcript.");
      return;
    }

    let savedTranscript = json.transcript;

    try {
      const fanoutRes = await fetch(
        `/api/riomind/meetings/${meetingCode}/voice/transcripts/${savedTranscript.id}/fanout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetLanguage: meetingPreferredLanguage }),
        }
      );

      const fanoutJson = await fanoutRes.json().catch(() => ({}));

      if (fanoutJson.ok && fanoutJson.transcript) {
        savedTranscript = fanoutJson.transcript;
      }
    } catch (error) {
      console.error("Voice transcript fanout failed", error);
    }

    setVoiceTranscripts((prev) => [...prev, savedTranscript]);

    const translatedCaption =
      savedTranscript?.metadata?.translations?.[meetingPreferredLanguage] || "";

    const originalTranscript = String(savedTranscript?.transcript_text || "").trim();
    const safeTranslatedCaption = String(translatedCaption || "").trim();

    if (autoPlayTranslatedVoice) {
      let autoVoiceCaption = safeTranslatedCaption;

      if (!autoVoiceCaption && savedTranscript?.id) {
        setTranslatedVoiceStatus(
          `Translated voice: waiting for ${meetingPreferredLanguage} translation...`
        );

        autoVoiceCaption = await waitForTargetTranslation(
          String(savedTranscript.id),
          meetingPreferredLanguage,
          4,
          600
        );

        if (autoVoiceCaption) {
          await reloadVoiceTranscripts();
        }
      }

      if (autoVoiceCaption) {
        setTranslatedVoiceStatus(`Translated voice: queueing ${meetingPreferredLanguage}`);
        await queueTranslatedVoice(autoVoiceCaption);
      } else {
        setTranslatedVoiceStatus(
          `Translated voice: ${meetingPreferredLanguage} translation not ready`
        );
      }
    }

    await reloadVoiceTranscripts();
    setVoiceTranscriptDraft("");
    setMessage("Voice transcript saved and translated.");
  }

  async function sendVoiceTranscript() {
    await saveVoiceTranscriptText(voiceTranscriptDraft);
  }

  async function startVoiceRoom() {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingEnabled: false, startedBy: meeting?.organizer || "Host" }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setVoiceSession(json.voiceSession);
      setMessage("Voice room started.");
    } else {
      setMessage(json.error || "Could not start voice room.");
    }
  }

  async function joinVoiceRoom() {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantName: meeting?.organizer || "Guest",
        email: "host@nexus.local",
        role: "host",
        muted: false,
        speaking: false,
        preferredLanguage: meeting?.default_language || "en",
        presenceStatus: "in_meeting",
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setVoiceParticipants((prev) => [...prev, json.voiceParticipant]);
      setMessage("Joined voice room.");
    } else {
      setMessage(json.error || "Could not join voice room.");
    }
  }

  async function updateVoiceParticipant(voiceParticipantId: string, patch: any) {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/voice/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceParticipantId, ...patch }),
    });

    const json = await res.json().catch(() => ({}));

    if (json.ok) {
      setVoiceParticipants((prev) =>
        prev.map((item) => (item.id === json.voiceParticipant.id ? json.voiceParticipant : item))
      );
      setMessage("Voice participant updated.");
    } else {
      setMessage(json.error || "Could not update voice participant.");
    }
  }

  async function updateRaiseHand(raiseHandId: string, patch: any) {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/raise-hands`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raiseHandId, ...patch }),
    });

    const json = await res.json().catch(() => ({}));

    if (!json.ok) {
      setMessage(json.error || "Could not update raised hand.");
      return;
    }

    setRaiseHands((prev) =>
      prev.map((item) => (item.id === json.raiseHand.id ? json.raiseHand : item))
    );
    setMessage(`Raised hand updated: ${json.raiseHand.hand_status}.`);
  }

  async function updateParticipantStatus(participantId: string, status: string) {
    const res = await fetch(`/api/riomind/meetings/${meetingCode}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, status }),
    });

    const json = await res.json().catch(() => ({}));

    if (!json.ok) {
      setMessage(json.error || "Could not update participant.");
      return;
    }

    setParticipants((prev) =>
      prev.map((p) => (p.id === json.participant.id ? json.participant : p))
    );
    setMessage(`Participant marked as ${status}.`);
  }

  async function admitAllWaiting() {
    for (const participant of waitingParticipants) {
      await updateParticipantStatus(participant.id, "joined");
    }
  }

  async function addParticipant(status = "invited") {
    if (!meetingCode) return;
    if (!participantName.trim() && !participantEmail.trim()) {
      setMessage("Enter participant name or email.");
      return;
    }

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: participantName,
        email: participantEmail,
        preferredLanguage: participantLanguage,
        status,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setMessage(json.error || "Could not save participant.");
      return;
    }

    setParticipants((prev) => [...prev, json.participant]);
    setParticipantName("");
    setParticipantEmail("");
    setParticipantLanguage("en");
    setMessage(`${status === "invited" ? "Invited" : "Saved"} participant.`);
  }

  async function quickResponse(status: "accepted" | "declined" | "tentative" | "joined") {
    setParticipantName("Guest");
    setParticipantEmail("");
    setParticipantLanguage(meeting?.default_language || "en");

    const res = await fetch(`/api/riomind/meetings/${meetingCode}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Guest",
        preferredLanguage: meeting?.default_language || "en",
        status,
      }),
    });

    const json = await res.json();

    if (json.ok) {
      setParticipants((prev) => [...prev, json.participant]);
      setMessage(`Guest marked as ${status}.`);
    }
  }

  if (loading || !meeting) {
    return <main className="min-h-screen bg-[#020817] p-8 text-white">Loading meeting...</main>;
  }

  const cleanDate = meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : "-";

  return (
    <main className="min-h-screen bg-[#020817] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-7">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Meeting Workspace</div>

          <h1 className="mt-3 text-4xl font-bold">{meeting.title}</h1>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-slate-400">Purpose</div>
            <div className="mt-2 text-lg">{meeting.purpose || "No purpose provided"}</div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <Stat label="Organizer" value={meeting.organizer || "-"} />
            <Stat label="Date" value={cleanDate} />
            <Stat label="Time" value={meeting.meeting_time || "-"} />
            <Stat label="Duration" value={`${meeting.duration_minutes} mins`} />
            <Stat label="Language" value={meeting.language_mode || "single"} />
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-lg font-semibold text-cyan-100">
            {countdown}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => quickResponse("joined")} className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">
              Join Meeting
            </button>
            <button onClick={() => quickResponse("accepted")} className="rounded-2xl border border-white/10 px-5 py-3">
              Reserve Spot
            </button>
            <button onClick={() => quickResponse("declined")} className="rounded-2xl border border-red-500/30 px-5 py-3 text-red-300">
              Decline
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Lobby</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-6">
            <Stat label="Accepted" value={`${lobby.accepted}`} />
            <Stat label="Tentative" value={`${lobby.tentative}`} />
            <Stat label="Waiting" value={`${lobby.waiting}`} />
            <Stat label="Joined" value={`${lobby.joined}`} />
            <Stat label="Declined" value={`${lobby.declined}`} />
            <Stat label="Invited" value={`${lobby.invited}`} />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/15 bg-white/[0.04] p-4">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-full mb-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Meeting Language</div>
                  <p className="mt-1 text-xs text-slate-400">
                    Controls captions, chat translation, AI transcript language, and future live voice translation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={speechSourceLanguage}
                    onChange={(e) => setSpeechSourceLanguage(e.target.value)}
                    title="Speaking language"
                    className="min-w-52 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-300/60"
                  >
                    <option value="en">Speaking: English</option>
                    <option value="fr">Speaking: French</option>
                    <option value="es">Speaking: Spanish</option>
                    <option value="pt">Speaking: Portuguese</option>
                    <option value="ar">Speaking: Arabic</option>
                    <option value="zh">Speaking: Chinese</option>
                    <option value="hi">Speaking: Hindi</option>
                    <option value="yo">Speaking: Yoruba</option>
                    <option value="ha">Speaking: Hausa</option>
                    <option value="ig">Speaking: Igbo</option>
                    <option value="pcm">Speaking: Pidgin</option>
                  </select>

                  <select
                  value={meetingPreferredLanguage}
                  onChange={(e) => {
                    setMeetingPreferredLanguage(e.target.value);
                  }}
                  className="min-w-64 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-300/60"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                  <option value="ar">Arabic</option>
                  <option value="zh">Chinese</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                  <option value="ur">Urdu</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="tr">Turkish</option>
                  <option value="id">Indonesian</option>
                  <option value="ms">Malay</option>
                  <option value="vi">Vietnamese</option>
                  <option value="th">Thai</option>
                  <option value="sw">Swahili</option>
                  <option value="yo">Yoruba</option>
                  <option value="ha">Hausa</option>
                  <option value="ig">Igbo</option>
                  <option value="pcm">Pidgin</option>
                </select>
                </div>
              </div>
            </div>

            {[
              ["voice", "🎙 Voice"],
              ["chat", "💬 Chat"],
              ["participants", "👥 Participants"],
              ["files", "📁 Files"],
              ["ai", "✨ AI"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveMeetingTab(key as any)}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  activeMeetingTab === key
                    ? "bg-cyan-300 text-slate-950"
                    : "border border-white/10 bg-black/20 text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            {activeMeetingTab === "voice" && (
              <div>
                <div className="font-semibold">Voice Workspace</div>
                <p className="mt-1 text-sm text-slate-400">
                  Live audio, stage speakers, gallery view, speaking control, and meeting modes.
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="font-semibold">Live Captions</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Preferred-language captions from voice transcripts.
                  </p>

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
                    {micDebugStatus}
                    <span className="ml-2 text-purple-200">· {realtimeVoiceStatus}</span>
                    <span className="ml-2 text-emerald-200">· {lastSttProviderStatus}</span>
                    <span className="ml-2 text-cyan-200">· {translatedVoiceStatus}</span>
                    {isStreamingMic ? (
                      <span className="ml-2 text-emerald-200">
                        · live chunks: {streamingChunkCount}
                        {streamingFailedChunkCount ? ` · failed: ${streamingFailedChunkCount}` : ""}
                      </span>
                    ) : null}
                  </div>

                  {recordedAudioUrl ? (
                    <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                      <div className="mb-2 text-xs text-cyan-200/70">Recorded audio preview</div>
                      <audio controls src={recordedAudioUrl} className="w-full" />
                      <button
                        onClick={transcribeRecordedAudio}
                        disabled={isTranscribingAudio}
                        className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
                      >
                        {isTranscribingAudio ? "Transcribing..." : "Transcribe Audio"}
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <input
                      value={voiceTranscriptDraft}
                      onChange={(e) => setVoiceTranscriptDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendVoiceTranscript();
                      }}
                      placeholder="Simulate spoken voice transcript..."
                      className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                    />
                    <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={autoPlayTranslatedVoice}
                        onChange={(e) => setAutoPlayTranslatedVoice(e.target.checked)}
                      />
                      Auto Voice
                    </label>
                    <button
                      onClick={isRealtimeVoiceConnected ? stopRealtimeVoiceSession : startRealtimeVoiceSession}
                      className="rounded-2xl border border-purple-300/20 bg-purple-300/10 px-5 py-3 font-semibold text-purple-100"
                    >
                      {isRealtimeVoiceConnected ? "Stop Realtime" : isRealtimeVoiceReady ? "Realtime Ready" : "Start Realtime"}
                    </button>
                    <button
                      onClick={isStreamingMic ? stopStreamingMicCapture : startStreamingMicCapture}
                      className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 font-semibold text-emerald-100"
                    >
                      {isStreamingMic ? "Stop Live Voice" : "Start Live Voice"}
                    </button>
                    <button
                      onClick={isListeningToMic ? stopMicCapture : startMicCapture}
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-100"
                    >
                      {isListeningToMic ? "Stop Recording" : "Use Mic"}
                    </button>
                    <button
                      onClick={sendVoiceTranscript}
                      className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950"
                    >
                      Add Transcript
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-purple-300/20 bg-purple-300/[0.05] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">Speaker Voice Profile</div>
                        <p className="mt-1 text-xs text-slate-400">
                          Consent, preferred voice style, and future speaker-preserving translated voice hook.
                        </p>
                      </div>
                      <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs text-purple-100">
                        {speakerVoiceProfiles.length} profile{speakerVoiceProfiles.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={speakerVoiceStyle}
                        onChange={(e) => setSpeakerVoiceStyle(e.target.value)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-purple-300/60"
                      >
                        <option value="verse">Verse</option>
                        <option value="alloy">Alloy</option>
                        <option value="ash">Ash</option>
                        <option value="sage">Sage</option>
                        <option value="coral">Coral</option>
                        <option value="nova">Nova</option>
                        <option value="onyx">Onyx</option>
                        <option value="shimmer">Shimmer</option>
                      </select>

                      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={speakerVoiceConsent}
                          onChange={(e) => setSpeakerVoiceConsent(e.target.checked)}
                        />
                        Consent granted
                      </label>

                      <button
                        onClick={saveCurrentSpeakerVoiceProfile}
                        className="rounded-xl bg-purple-300 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Save Voice Profile
                      </button>
                    </div>


                    <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
                      <div className="font-semibold">Speaker Voice Enrollment</div>
                      <p className="mt-1 text-xs text-slate-400">
                        Record a speaker sample now. This prepares future speaker-preserving translated voice.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        {isRecordingVoiceSample ? (
                          <button
                            onClick={stopVoiceSampleRecording}
                            className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200"
                          >
                            Stop Sample
                          </button>
                        ) : (
                          <button
                            onClick={startVoiceSampleRecording}
                            className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                          >
                            Start Voice Sample
                          </button>
                        )}

                        <button
                          onClick={saveVoiceSampleToProfile}
                          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
                        >
                          Save Sample to Profile
                        </button>
                      </div>

                      {voiceSampleUrl ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="mb-2 text-xs text-slate-400">Recorded speaker sample preview</div>
                          <audio controls src={voiceSampleUrl} className="w-full" />
                        </div>
                      ) : null}
                    </div>

                    {speakerVoiceProfiles.length ? (
                      <div className="mt-3 space-y-2 text-xs text-slate-300">
                        {speakerVoiceProfiles.slice(0, 3).map((profile) => (
                          <div key={profile.id} className="rounded-xl border border-white/10 bg-black/20 p-2">
                            {profile.speaker_name} · {profile.speaker_email || "no email"} · consent: {profile.consent_status} · voice: {profile.preferred_voice_style}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-3">
                    {voiceTranscripts.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/15 p-3 text-sm text-slate-400">
                        No voice transcript yet.
                      </div>
                    ) : (
                      voiceTranscripts.slice(-5).map((item) => {
                        const caption =
                          item.metadata?.translations?.[meetingPreferredLanguage] || "";

                        return (
                          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="text-xs text-slate-500">
                              {item.speaker_name || "Speaker"} · {item.source_language || "auto"} · {new Date(item.created_at).toLocaleTimeString()}
                            </div>
                            <div className="mt-2 text-slate-200">{item.transcript_text}</div>
                            {caption && caption !== item.transcript_text ? (
                              <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
                                <div className="mb-1 text-xs text-cyan-200/70">
                                  Caption · {meetingPreferredLanguage}
                                </div>
                                <div>{caption}</div>
                                <button
                                  onClick={() => playTranslatedVoice(caption, meetingPreferredLanguage)}
                                  className="mt-3 inline-flex items-center rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/25"
                                >
                                  🔊 Play Voice
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeMeetingTab === "chat" && (
              <div>
                <div className="font-semibold">Meeting Chat</div>
                <p className="mt-1 text-sm text-slate-400">
                  Persistent meeting chat with future reply, react, pin, translate, and AI extraction.
                </p>

                <div className="mt-4 space-y-3">
                  {meetingMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-4 text-slate-400">
                      No meeting messages yet.
                    </div>
                  ) : (
                    meetingMessages.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">{item.sender_name || "Guest"}</div>
                          <div className="text-xs text-slate-500">
                            {item.source_language || "en"} · {new Date(item.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="mt-2 text-slate-200">{item.message}</div>
                        {(() => {
                          const preferredTranslation =
                            item.metadata?.translations?.[meetingPreferredLanguage] ||
                            item.translated_message;

                          return preferredTranslation ? (
                            <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
                              {preferredTranslation}
                            </div>
                          ) : item.metadata?.translation_status ? (
                            <div className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm text-yellow-100">
                              Translating into {chatSenderLanguage || "your language"}...
                            </div>
                          ) : null;
                        })()}

                        {item.metadata?.reactions?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2 text-sm">
                            {Object.entries(
                              item.metadata.reactions.reduce((acc: Record<string, number>, reaction: string) => {
                                acc[reaction] = (acc[reaction] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([reaction, count]) => (
                              <span
                                key={reaction}
                                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1"
                              >
                                {reaction} {count as number}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => handleChatAction("reply", item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
                            Reply
                          </button>
                          <div className="relative inline-flex flex-wrap gap-2">
                            {["👍", "👎", "👏", "❤️", "😂", "🎉", "🙏", "🔥"].map((reaction) => (
                              <button
                                key={reaction}
                                onClick={() => addChatReaction(item, reaction)}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                                title={`React ${reaction}`}
                              >
                                {reaction}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => handleChatAction("pin", item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
                            Pin
                          </button>
                          <button onClick={() => handleChatAction("translate", item)} className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                            Translate
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <input
                    value={chatSenderName}
                    onChange={(e) => setChatSenderName(e.target.value)}
                    placeholder="Your display name"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  />
                  <input
                    value={chatSenderEmail}
                    onChange={(e) => setChatSenderEmail(e.target.value)}
                    placeholder="Your email"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  />
                  <select
                    value={chatSenderLanguage}
                    onChange={(e) => {
                      setChatSenderLanguage(e.target.value);
                      setMeetingPreferredLanguage(e.target.value);
                    }}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  >
                    {languageOptions.map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMeetingMessage();
                    }}
                    placeholder="Type a meeting message..."
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  />
                  <button
                    onClick={sendMeetingMessage}
                    className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeMeetingTab === "participants" && (
              <div>
                <div className="font-semibold">Participants</div>
                <p className="mt-1 text-sm text-slate-400">
                  Roles, presence, language preference, lobby status, audio state, and moderation controls.
                </p>
              </div>
            )}

            {activeMeetingTab === "files" && (
              <div>
                {activePresentationFile ? (
                  <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5">
                    <div className="text-sm text-slate-400">Now Presenting</div>
                    <div className="mt-2 text-xl font-semibold">
                      {activePresentationFile.icon} {activePresentationFile.name}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      This file is currently staged for live demonstration to meeting participants.
                    </p>
                  </div>
                ) : null}

                {activeFileReview ? (
                  <div className="mb-5 rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="text-sm text-slate-400">AI Review Placeholder</div>
                    <div className="mt-2 font-semibold">
                      {activeFileReview.icon} {activeFileReview.name}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      Nexus AI will summarize, extract action items, detect risks, and prepare participant-friendly notes for this file.
                    </p>
                  </div>
                ) : null}
                <div className="font-semibold">Files + Presentation Stage</div>
                <p className="mt-1 text-sm text-slate-400">
                  Share documents, slides, spreadsheets, dashboards, screenshots, and reports for live demonstration.
                </p>

                <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">Presentation Stage</div>
                      <p className="mt-1 text-sm text-slate-400">
                        Future live display area for PDF, PowerPoint, Excel, Word, images, dashboards, whiteboard, and screen sharing.
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      Presenter Ready
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <Stat label="PDF" value="Supported" />
                    <Stat label="PPTX" value="Supported" />
                    <Stat label="Excel" value="Supported" />
                    <Stat label="DOCX" value="Supported" />
                    <Stat label="Images" value="Supported" />
                    <Stat label="Video" value="Supported" />
                    <Stat label="Live Stream" value="Supported" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="font-semibold">Shared Files</div>
                    <p className="mt-2 text-sm text-slate-400">
                      Meeting files will appear here with open, present, download, translate, summarize, and AI-review actions.
                    </p>

                    <div className="mt-4 space-y-2">
                      {[
                        { icon: "📄", name: "Meeting Agenda.docx", type: "DOCX" },
                        { icon: "📕", name: "Board Meeting Pack.pdf", type: "PDF" },
                        { icon: "📊", name: "Quarterly Report.xlsx", type: "Excel" },
                        { icon: "📽", name: "Training Slides.pptx", type: "PPTX" },
                        { icon: "🖼", name: "Architecture Screenshot.png", type: "Image" },
                        { icon: "🎬", name: "Training Replay.mp4", type: "Video" },
                        { icon: "🔴", name: "Healing Streams Live Link", type: "Live Stream" },
                      ].map((file) => (
                        <div key={file.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <div>
                            <div className="font-semibold">{file.icon} {file.name}</div>
                            <div className="text-xs text-slate-500">{file.type}</div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setActivePresentationFile(file)}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => setActivePresentationFile(file)}
                              className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => setActiveFileReview(file)}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs"
                            >
                              AI Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="font-semibold">Presenter Controls</div>
                    <p className="mt-2 text-sm text-slate-400">
                      Host, co-host, lecturer, presenter, pastor, or moderator can control what everyone sees.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <StatusPill label="Present File" value="Ready" />
                      <StatusPill label="Screen Share" value="Planned" />
                      <StatusPill label="Video Stream" value="Ready" />
                      <StatusPill label="Live Link" value="Ready" />
                      <StatusPill label="Whiteboard" value="Planned" />
                      <StatusPill label="AI Notes" value="Ready next" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMeetingTab === "ai" && (
              <div>
                <div className="font-semibold">AI Meeting Intelligence</div>
                <p className="mt-1 text-sm text-slate-400">
                  Compact transcript feed, translation status, summary, decisions, and action items.
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
                  <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">Live Transcript Feed</div>
                        <p className="mt-1 text-xs text-slate-400">
                          Original speech plus preferred-language captions.
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                        Target · {meetingPreferredLanguage}
                      </span>
                    </div>

                    <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-2">
                      {voiceTranscripts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-400">
                          No voice transcript yet.
                        </div>
                      ) : (
                        voiceTranscripts.slice(-20).map((item) => {
                          const caption =
                            item.metadata?.translations?.[meetingPreferredLanguage] || "";

                          return (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                <span>{item.speaker_name || "Speaker"} · {item.source_language || "auto"}</span>
                                <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                              </div>

                              <div className="mt-2 text-sm text-slate-100">{item.transcript_text}</div>

                              {caption && caption !== item.transcript_text ? (
                                <div className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-sm text-cyan-100">
                                  <span className="mr-2 text-xs text-cyan-200/70">
                                    {item.source_language || "auto"} → {meetingPreferredLanguage}
                                  </span>
                                  <div>{caption}</div>
                                  <button
                                    onClick={() => playTranslatedVoice(caption, meetingPreferredLanguage)}
                                    className="mt-3 inline-flex items-center rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/25"
                                  >
                                    🔊 Play Voice
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-lg font-semibold">Translation Status</div>
                      <div className="mt-4 grid gap-3">
                        <StatusPill label="Target" value={meetingPreferredLanguage || "en"} />
                        <StatusPill label="Voice Translation" value="Live captions" />
                        <StatusPill label="Language Pack" value="24 supported" />
                        <StatusPill label="Fanout" value="Full pack" />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-lg font-semibold">AI Insights</div>
                      <div className="mt-4 space-y-3 text-sm text-slate-300">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          Rolling summary foundation active.
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          Decisions, action items, commitments, and follow-ups ready next.
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          Transcript feed is compact and translation-aware.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>


        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Waiting Room Admission Queue</h2>
              <p className="mt-2 text-sm text-slate-400">
                Admit participants into the meeting, reject entry, or admit everyone waiting.
              </p>
            </div>

            <button
              onClick={admitAllWaiting}
              disabled={waitingParticipants.length === 0}
              className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Admit All
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {waitingParticipants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">
                No participants waiting for admission.
              </div>
            ) : (
              waitingParticipants.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.display_name || p.email || "Participant"}</div>
                      <div className="text-sm text-slate-400">{p.email || "No email"} · Language: {p.preferred_language || "en"}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateParticipantStatus(p.id, "joined")}
                        className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => updateParticipantStatus(p.id, "declined")}
                        className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

                <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Voice Room</h2>
              <p className="mt-2 text-sm text-slate-400">
                Audio foundation for live meetings, speaker control, recording, translation, and transcript intelligence.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={startVoiceRoom}
                className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950"
              >
                Start Voice
              </button>

              <button
                onClick={joinVoiceRoom}
                className="rounded-2xl border border-white/10 px-5 py-3"
              >
                Join Audio
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Stat label="Status" value={voiceSession?.status || "ready"} />
            <Stat label="Started By" value={voiceSession?.started_by || "-"} />
            <Stat label="Recording" value={voiceSession?.recording_enabled ? "On" : "Off"} />
            <Stat label="Audio Participants" value={`${voiceParticipants.length}`} />
          </div>

          <div className="mt-5 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
            {(() => {
              const profile = meetingModeProfiles[hostControls.meetingMode] || meetingModeProfiles.discussion;

              return (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{profile.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{profile.rule}</p>
                    </div>

                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {hostControls.meetingMode}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <StatusPill label="Stage Speaker" value={profile.speaker} />
                    <StatusPill label="Audience" value={profile.audience} />
                    <StatusPill label="Interaction" value={hostControls.meetingMode === "discussion" ? "Open voice" : "Raise hand / host approval"} />
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-5">
            <div className="mb-5 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Stage Speakers</h3>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                Active Stage
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {voiceParticipants
                .filter((vp) =>
                  ["host","co_host","moderator","presenter","speaker"].includes(
                    String(vp.role || "")
                  )
                )
                .map((vp) => (
                  <div
                    key={`stage-${vp.id}`}
                    className="rounded-2xl border border-cyan-300/20 bg-black/20 p-3 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 font-bold text-cyan-100">
                      {String(vp.participant_name || "SP")
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0,2)
                        .toUpperCase()}
                    </div>

                    <div className="mt-2 text-sm font-semibold">
                      {vp.participant_name}
                    </div>

                    <div className="text-xs text-cyan-300">
                      {vp.role}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <h3 className="font-semibold">Gallery View</h3>

            {voiceParticipants.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">
                No one has joined audio yet.
              </div>
            ) : (
              <div className="mt-3 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {voiceParticipants.map((p) => {
                  const initials = String(p.participant_name || "VP")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const lang = languageMeta[p.preferred_language || "en"] || languageMeta.en;
                  const presence = presenceMeta[p.presence_status || "in_meeting"] || presenceMeta.in_meeting;

                  return (
                    <div
                      key={p.id}
                      className="rounded-3xl border border-white/10 bg-black/30 p-5 text-center shadow-2xl shadow-cyan-950/20"
                    >
                      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-cyan-100 ${
      p.speaking
        ? "border-4 border-green-400 shadow-lg shadow-green-500/30"
        : "border border-cyan-300/30"
    } bg-cyan-300/10`}>
                        {initials}
                      </div>

                      <div className="mt-4 text-lg font-semibold">
                        {p.participant_name || "Voice Participant"}
                      </div>

                      <div className="mt-1 text-sm capitalize text-slate-400">
                        {p.role || "participant"}
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-cyan-100">
                          {p.speaking ? "🎙 Speaking" : p.muted ? "🔇 Muted" : "🎧 Listening"}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          {lang.flag} {lang.label}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          {presence.icon} {presence.label}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <StatusPill label="Audio" value={p.joined_audio ? "Joined" : "Left"} />
                        <StatusPill label="Mic" value={p.muted ? "Muted" : "Open"} />
                        <StatusPill label="Hand" value={p.hand_raised ? "Raised" : "Down"} />
                        <StatusPill label="Mode" value={p.speaking ? "Live" : "Ready"} />
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => updateVoiceParticipant(p.id, { muted: true, speaking: false })}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                        >
                          Mute
                        </button>
                        <button
                          onClick={() => updateVoiceParticipant(p.id, { muted: false })}
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                        >
                          Unmute
                        </button>
                        <button
                          onClick={() => updateVoiceParticipant(p.id, { speaking: true, muted: false })}
                          className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"
                        >
                          Speaking
                        </button>
                        <button
                          onClick={() => updateVoiceParticipant(p.id, { joinedAudio: false, speaking: false })}
                          className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-300"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

                <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Invite</h2>
          <p className="mt-2 text-sm text-slate-400">
            Share this link with participants. They can reserve a place or join when the meeting is live.
          </p>

          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <div className="text-sm text-slate-400">Invite Link</div>
            <a
              href={meeting.invite_link}
              target="_blank"
              className="mt-2 block break-all font-mono text-cyan-100 underline decoration-cyan-300/40 underline-offset-4"
            >
              {typeof window !== "undefined" ? `${window.location.origin}${meeting.invite_link}` : meeting.invite_link}
            </a>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={copyInviteLink}
                className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950"
              >
                Copy Link
              </button>

              <a
                href={meeting.invite_link}
                target="_blank"
                className="rounded-xl border border-white/10 px-4 py-2"
              >
                Open Link
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Host Controls</h2>
          <p className="mt-2 text-sm text-slate-400">
            Keep meetings professional with waiting room, entry pause, mute control, screen share control, and lock mode.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Toggle
              label="Waiting Room"
              value={hostControls.waitingRoomEnabled}
              onChange={(v) => saveHostControls({ ...hostControls, waitingRoomEnabled: v })}
            />
            <Toggle
              label="Pause Entry"
              value={hostControls.pauseEntryEnabled}
              onChange={(v) => saveHostControls({ ...hostControls, pauseEntryEnabled: v })}
            />
            <Toggle
              label="Auto Admit"
              value={hostControls.autoAdmitEnabled}
              onChange={(v) => saveHostControls({ ...hostControls, autoAdmitEnabled: v })}
            />
            <Toggle
              label="Meeting Locked"
              value={hostControls.meetingLocked}
              onChange={(v) => saveHostControls({ ...hostControls, meetingLocked: v })}
            />
            <Toggle
              label="Host Only Mute"
              value={hostControls.hostOnlyMute}
              onChange={(v) => saveHostControls({ ...hostControls, hostOnlyMute: v })}
            />
            <Toggle
              label="Allow Participant Unmute"
              value={hostControls.allowParticipantUnmute}
              onChange={(v) => saveHostControls({ ...hostControls, allowParticipantUnmute: v })}
            />
          </div>

          <div className="mt-5">
            <label className="text-sm text-slate-400">Screen Share Mode</label>
            <select
              value={hostControls.screenShareMode}
              onChange={(e) => saveHostControls({ ...hostControls, screenShareMode: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60 md:max-w-sm"
            >
              <option value="host_only">Host only</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm text-slate-400">Meeting Mode</label>
            <select
              value={hostControls.meetingMode}
              onChange={(e) => saveHostControls({ ...hostControls, meetingMode: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60 md:max-w-sm"
            >
              <option value="discussion">Discussion</option>
              <option value="lecture">Lecture</option>
              <option value="classroom">Classroom</option>
              <option value="town_hall">Town Hall</option>
              <option value="podcast">Podcast</option>
              <option value="church_service">Church Service</option>
              <option value="webinar">Webinar</option>
              <option value="board_meeting">Board Meeting</option>
              <option value="mega_event">Broadcast / Mega Event</option>
            </select>
          </div>
        </section>


        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Administration</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-sm text-slate-400">Host</div>
              <div className="mt-1 font-semibold">{meeting.organizer}</div>
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <div>
                  <div className="font-semibold">{role.user_name}</div>
                  <div className="text-sm text-slate-500">{role.email}</div>
                </div>

                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                  {role.role}
                </span>
              </div>
            ))}
          </div>
        </section>

                <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Raise Hands Queue</h2>
              <p className="mt-2 text-sm text-slate-400">
                First raised is shown first, but host or admin can override the speaking order.
              </p>
            </div>

            <button
              onClick={allowNextSpeaker}
              disabled={raiseHands.filter((item) => !item.removed && item.hand_status !== "allowed").length === 0}
              className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Allow Next Speaker
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {raiseHands.length === 0 ? (
              <div className="text-slate-500">No raised hands.</div>
            ) : (
              raiseHands.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        #{index + 1} ✋ {item.participant_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.email} · Raised {new Date(item.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    <span className="text-cyan-300">{item.hand_status}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateRaiseHand(item.id, { allowedToSpeak: true, muted: false, removed: false, handStatus: "allowed" })}
                      className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"
                    >
                      Allow Speak
                    </button>

                    <button
                      onClick={() => updateRaiseHand(item.id, { allowedToSpeak: false, muted: true, handStatus: "muted" })}
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                    >
                      Mute
                    </button>

                    <button
                      onClick={() => updateRaiseHand(item.id, { allowedToSpeak: false, muted: true, removed: true, handStatus: "removed" })}
                      className="rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

                <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Security Controls</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              Require Approval
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              Guest Access
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              Meeting Password
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              Domain Restriction
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Invite Participant</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Participant name"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />
            <input
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="Email"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />
            <select
              value={participantLanguage}
              onChange={(e) => setParticipantLanguage(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            >
              {languageOptions.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <button onClick={() => addParticipant("invited")} className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">
              Invite
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
              {message}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {participants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">
                No participants yet.
              </div>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.display_name || p.email || "Participant"}</div>
                      <div className="text-sm text-slate-400">{p.email || "No email"}</div>
                    </div>
                    <div className="text-right">
                      <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {p.participant_status}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Language: {p.preferred_language || "en"}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-cyan-100">{value}</div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-cyan-300/30"
    >
      <span className="font-medium">{label}</span>
      <span className={value ? "font-semibold text-cyan-300" : "text-slate-500"}>
        {value ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 font-semibold">{value}</div>
    </div>
  );
}
