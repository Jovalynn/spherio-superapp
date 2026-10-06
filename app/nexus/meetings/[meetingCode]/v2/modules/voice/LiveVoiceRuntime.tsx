"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LiveVoiceStatus =
  | "idle"
  | "requesting-microphone"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export type LiveVoiceTranscript = {
  text: string;
  final: boolean;
};

export type LiveVoiceRuntimeProps = {
  meetingCode: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  voice?: string;
  model?: string;
  onStatusChange?: (status: LiveVoiceStatus) => void;
  onTranscript?: (transcript: LiveVoiceTranscript) => void;
  onError?: (message: string) => void;
};

type SessionResponse = {
  ok?: boolean;
  session?: {
    id?: string;
    status?: string;
  };
  realtime?: {
    provider?: string;
    status?: string;
    model?: string;
    voice?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    translationMode?: boolean;
  };
  error?: string;
};

type TokenResponse = {
  ok?: boolean;
  clientSecret?: string | null;
  model?: string;
  voice?: string;
  error?: string;
};

export default function LiveVoiceRuntime({
  meetingCode,
  sourceLanguage = "auto",
  targetLanguage = "en",
  voice = "alloy",
  model = "gpt-4o-realtime-preview",
  onStatusChange,
  onTranscript,
  onError,
}: LiveVoiceRuntimeProps) {
  const [status, setStatus] = useState<LiveVoiceStatus>("idle");
  const [muted, setMuted] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);

  /*
   * Parent callbacks are supplied inline by the meeting page and may receive
   * new identities after each parent state update. Keep their latest values
   * in refs so runtime lifecycle callbacks remain stable and a status update
   * cannot accidentally trigger the unmount cleanup path.
   */
  const onStatusChangeRef = useRef(onStatusChange);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const setRuntimeStatus = useCallback((next: LiveVoiceStatus) => {
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);

  const reportError = useCallback(
    (message: string) => {
      console.error("[LiveVoiceRuntime]", message);
      setRuntimeStatus("error");
      onErrorRef.current?.(message);
    },
    [setRuntimeStatus],
  );

  const disconnect = useCallback(() => {
    setRuntimeStatus("disconnecting");

    const dataChannel = dataChannelRef.current;

    if (dataChannel) {
      try {
        dataChannel.close();
      } catch {}
    }

    dataChannelRef.current = null;

    const peer = peerRef.current;

    if (peer) {
      try {
        peer.close();
      } catch {}
    }

    peerRef.current = null;

    const stream = micStreamRef.current;

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    micStreamRef.current = null;

    const audio = audioElementRef.current;

    if (audio) {
      audio.pause();
      audio.srcObject = null;

      try {
        audio.remove();
      } catch {}
    }

    audioElementRef.current = null;

    voiceSessionIdRef.current = null;

    setMuted(false);
    setRuntimeStatus("idle");
  }, [setRuntimeStatus]);

  const connect = useCallback(async () => {
    if (
      peerRef.current ||
      status === "requesting-microphone" ||
      status === "connecting" ||
      status === "connected"
    ) {
      return;
    }

    try {
      /*
       * Step 1:
       * Capture microphone audio.
       */
      setRuntimeStatus("requesting-microphone");

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      micStreamRef.current = micStream;

      setRuntimeStatus("connecting");

      /*
       * Step 2:
       * Create the existing RioMind realtime voice session.
       *
       * This remains the canonical persistence/intelligence boundary.
       */
      const sessionResponse = await fetch(
        "/api/riomind/voice/realtime/openai/session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aiLayer: "nexus_ai",
            surface: "nexus_teams",
            meetingCode,
            ownerUserId: "local-user",
            model,
            voice,
            sourceLanguage,
            targetLanguage,
            translationMode: true,
            metadata: {
              client: "nexus_teams_live_voice",
              transport: "webrtc",
            },
          }),
        },
      );

      const session = (await sessionResponse.json()) as SessionResponse;

      if (!sessionResponse.ok || !session.ok || !session.session?.id) {
        throw new Error(
          session.error ||
            "Unable to create RioMind realtime voice session.",
        );
      }

      voiceSessionIdRef.current = session.session.id;

      /*
       * Step 3:
       * Obtain the existing ephemeral OpenAI client secret.
       */
      const tokenResponse = await fetch(
        "/api/riomind/voice/realtime/openai/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            voice,
            instructions: [
              "You are RioMind Nexus realtime meeting voice assistant.",
              "Listen to incoming speaker audio.",
              "Respond with translated spoken audio when translation mode is active.",
              "Preserve speaker meaning and intent.",
              "Preserve names, numbers, proper nouns, URLs,",
              "technical terms, scripture references, and other",
              "meaningful terminology.",
              "Do not summarize.",
              "Do not omit meaningful content.",
              "Do not invent content.",
              "When translation mode is active, translate faithfully.",
              `Meeting code: ${meetingCode}.`,
              `Source language: ${sourceLanguage}.`,
              `Target language: ${targetLanguage}.`,
            ].join(" "),
          }),
        },
      );

      const token = (await tokenResponse.json()) as TokenResponse;

      if (!tokenResponse.ok || !token.clientSecret) {
        throw new Error(
          token.error || "Unable to obtain realtime client secret.",
        );
      }

      /*
       * Step 4:
       * Establish browser WebRTC connection.
       */
      const peer = new RTCPeerConnection();

      peerRef.current = peer;

      /*
       * Remote audio playback.
       */
      const audio = document.createElement("audio");

      audio.autoplay = true;
      audio.style.display = "none";

      document.body.appendChild(audio);

      audioElementRef.current = audio;

      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;

        if (!remoteStream) {
          return;
        }

        audio.srcObject = remoteStream;

        void audio.play().catch(() => {
          /*
           * The user has already interacted with the page by
           * pressing Connect, so normal browsers should permit
           * playback. Keep this defensive for stricter policies.
           */
        });
      };

      /*
       * Connection diagnostics/state.
       */
      peer.onconnectionstatechange = () => {
        const connectionState = peer.connectionState;

        console.info(
          "[LiveVoiceRuntime] WebRTC connection state:",
          connectionState,
        );

        if (connectionState === "connected") {
          setRuntimeStatus("connected");
        }

        if (
          connectionState === "failed" ||
          connectionState === "disconnected" ||
          connectionState === "closed"
        ) {
          if (peerRef.current === peer) {
            disconnect();
          }
        }
      };

      peer.oniceconnectionstatechange = () => {
        console.info(
          "[LiveVoiceRuntime] ICE connection state:",
          peer.iceConnectionState,
        );
      };

      /*
       * Add microphone track.
       */
      const [micTrack] = micStream.getAudioTracks();

      if (!micTrack) {
        throw new Error("Microphone audio track was not created.");
      }

      peer.addTrack(micTrack, micStream);

      /*
       * Step 5:
       * Realtime event data channel.
       */
      const dataChannel = peer.createDataChannel("oai-events");

      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.info("[LiveVoiceRuntime] Realtime data channel opened.");

        dataChannel.send(
          JSON.stringify({
            type: "session.update",
            session: {
              output_modalities: ["audio"],
              instructions: [
                "You are RioMind Nexus realtime meeting voice assistant.",
                "Listen to incoming speaker audio.",
                "Respond with translated spoken audio when translation mode is active.",
                "Preserve speaker meaning and intent.",
                "Preserve names, numbers, proper nouns, URLs, technical terms, scripture references, and other meaningful terminology.",
                "Do not summarize.",
                "Do not omit meaningful content.",
                "Do not invent content.",
                "When translation mode is active, translate faithfully.",
                `Meeting code: ${meetingCode}.`,
                `Source language: ${sourceLanguage}.`,
                `Target language: ${targetLanguage}.`,
              ].join(" "),
              input_audio_transcription: {
                model: "gpt-4o-mini-transcribe",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 700,
                create_response: true,
              },
            },
          }),
        );
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          console.debug(
            "[LiveVoiceRuntime] Realtime event:",
            message.type,
          );

          /*
           * Incoming speaker transcription.
           */
          if (
            message.type ===
            "conversation.item.input_audio_transcription.completed"
          ) {
            const text = message.transcript?.trim();

            if (text) {
              onTranscriptRef.current?.({
                text,
                final: true,
              });
            }

            return;
          }

          if (
            message.type ===
            "conversation.item.input_audio_transcription.delta"
          ) {
            const text = message.delta?.trim();

            if (text) {
              onTranscriptRef.current?.({
                text,
                final: false,
              });
            }

            return;
          }

          /*
           * Model's spoken response transcript.
           */
          if (message.type === "response.audio_transcript.delta") {
            const text = message.delta?.trim();

            if (text) {
              onTranscriptRef.current?.({
                text,
                final: false,
              });
            }

            return;
          }

          if (message.type === "response.audio_transcript.done") {
            const text = message.transcript?.trim();

            if (text) {
              onTranscriptRef.current?.({
                text,
                final: true,
              });
            }

            return;
          }

          /*
           * Realtime API errors.
           */
          if (message.type === "error") {
            const errorMessage =
              message.error?.message || "Realtime voice error.";

            console.error(
              "[LiveVoiceRuntime] OpenAI realtime error:",
              message.error,
            );

            reportError(errorMessage);
          }
        } catch {
          /*
           * Ignore non-JSON realtime events.
           */
        }
      };

      dataChannel.onerror = (event) => {
        console.error(
          "[LiveVoiceRuntime] Realtime data channel error:",
          event,
        );
      };

      dataChannel.onclose = () => {
        console.info("[LiveVoiceRuntime] Realtime data channel closed.");
      };

      /*
       * Step 6:
       * Create the browser WebRTC offer.
       */
      console.info("[LiveVoiceRuntime] Creating WebRTC offer.");
      const offer = await peer.createOffer();

      console.info("[LiveVoiceRuntime] Setting local WebRTC description.");
      await peer.setLocalDescription(offer);

      /*
       * Wait for ICE gathering to complete before sending SDP.
       *
       * This avoids negotiating with an incomplete SDP document on
       * browsers that gather ICE candidates asynchronously.
       */
      if (peer.iceGatheringState !== "complete") {
        console.info("[LiveVoiceRuntime] Waiting for ICE gathering.");

        await new Promise<void>((resolve) => {
          const handleIceGatheringState = () => {
            console.info(
              "[LiveVoiceRuntime] ICE gathering state:",
              peer.iceGatheringState,
            );

            if (peer.iceGatheringState === "complete") {
              peer.removeEventListener(
                "icegatheringstatechange",
                handleIceGatheringState,
              );
              resolve();
            }
          };

          peer.addEventListener(
            "icegatheringstatechange",
            handleIceGatheringState,
          );

          /*
           * Defensive fallback in case the browser has already
           * completed gathering between the check and listener.
           */
          handleIceGatheringState();
        });
      }

      const localSdp = peer.localDescription?.sdp;

      if (!localSdp) {
        throw new Error(
          "Realtime WebRTC local description did not contain SDP.",
        );
      }

      console.info("[LiveVoiceRuntime] Local SDP ready.");

      /*
       * Step 7:
       * Negotiate directly with OpenAI using the ephemeral secret.
       */
      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          body: localSdp,
          headers: {
            Authorization: `Bearer ${token.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        },
      );

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text().catch(() => "");

        throw new Error(
          `OpenAI realtime WebRTC negotiation failed (${sdpResponse.status})${
            errorText ? `: ${errorText}` : "."
          }`,
        );
      }

      const answerSdp = await sdpResponse.text();

      await peer.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.info("[LiveVoiceRuntime] OpenAI WebRTC negotiation complete.");
      console.info(
        "[LiveVoiceRuntime] Remote description set. Waiting for connection.",
      );
    } catch (error) {
      disconnect();

      reportError(
        error instanceof Error
          ? error.message
          : "Unable to connect realtime voice.",
      );
    }
  }, [
    disconnect,
    meetingCode,
    model,
    onTranscript,
    reportError,
    setRuntimeStatus,
    sourceLanguage,
    status,
    targetLanguage,
    voice,
  ]);

  const toggleMute = useCallback(() => {
    const stream = micStreamRef.current;

    if (!stream) {
      return;
    }

    const nextMuted = !muted;

    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }

    setMuted(nextMuted);
  }, [muted]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="flex items-center gap-2">
      {status !== "connected" ? (
        <button
          type="button"
          onClick={connect}
          disabled={
            status === "requesting-microphone" ||
            status === "connecting"
          }
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
        >
          {status === "requesting-microphone"
            ? "Allow microphone…"
            : status === "connecting"
              ? "Connecting…"
              : "Connect Live Voice"}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            {muted ? "Unmute" : "Mute"}
          </button>

          <button
            type="button"
            onClick={disconnect}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-white hover:bg-red-500/20"
          >
            Disconnect
          </button>
        </>
      )}

      <span className="text-xs text-white/60">
        {status === "connected"
          ? "Live Voice connected"
          : status === "error"
            ? "Voice error"
            : "Voice idle"}
      </span>
    </div>
  );
}
