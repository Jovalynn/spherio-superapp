"use client";

export interface ParticipantStatusBadgesProps {
  assistant: boolean;
  mic: string;
  cameraActive: boolean;
  translationActive: boolean;
  participantLanguage?: string | null;
  listenLanguage: string;
  sourceLanguage: string;
  participantName: string;
  currentViewerName: string;
  connected: boolean;
  languageLabel: (code: string) => string;
}

export default function ParticipantStatusBadges({
  assistant,
  mic,
  cameraActive,
  translationActive,
  participantLanguage,
  listenLanguage,
  sourceLanguage,
  participantName,
  currentViewerName,
  connected,
  languageLabel,
}: ParticipantStatusBadgesProps) {
  const resolvedLanguage =
    participantLanguage ||
    (participantName === currentViewerName
      ? listenLanguage
      : sourceLanguage);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      <span
        title={
          assistant
            ? "AI audio service"
            : mic === "muted"
              ? "Microphone muted"
              : "Microphone live"
        }
        className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
          assistant
            ? "border-purple-300/25 bg-purple-300/10"
            : mic === "muted"
              ? "border-red-300/25 bg-red-300/10"
              : "border-emerald-300/25 bg-emerald-300/10"
        }`}
      >
        {assistant ? "🧠" : mic === "muted" ? "🔇" : "🎤"}
      </span>

      <span
        title={cameraActive ? "Camera active" : "Camera off"}
        className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
          cameraActive
            ? "border-cyan-300/25 bg-cyan-300/10"
            : "border-white/10 bg-white/[0.04]"
        }`}
      >
        {cameraActive ? "📹" : "📷"}
      </span>

      <span
        title={
          translationActive
            ? `Language: ${languageLabel(resolvedLanguage)}`
            : "Translation inactive"
        }
        className={`inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border px-2 text-[10px] font-black ${
          translationActive
            ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
            : "border-white/10 bg-white/[0.04] text-slate-400"
        }`}
      >
        <span>🌐</span>
        <span>{String(resolvedLanguage).toUpperCase()}</span>
      </span>

      <span
        title={connected ? "Connected" : "Connection unavailable"}
        className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${
          connected
            ? "border-emerald-300/25 bg-emerald-300/10"
            : "border-red-300/25 bg-red-300/10"
        }`}
      >
        📶
      </span>
    </div>
  );
}
