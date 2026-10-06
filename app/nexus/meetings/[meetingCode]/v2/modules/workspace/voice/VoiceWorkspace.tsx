"use client";

type TranscriptRecord = {
  speaker_name?: string | null;
  transcript_text?: string | null;
};

export type VoiceWorkspaceProps = {
  sourceLanguage: string;
  listenLanguage: string;
  latestTranscript: TranscriptRecord | null;
  latestCaption: string;
  languageLabel: (code: string) => string;
};

export default function VoiceWorkspace({
  sourceLanguage,
  listenLanguage,
  latestTranscript,
  latestCaption,
  languageLabel,
}: VoiceWorkspaceProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="font-semibold">
          Voice Translation Control Center
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Live interpretation foundation connected. Provider subscriptions
          will unlock smoother realtime STT/TTS.
        </p>

        <div className="mt-4 grid gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Source language
            </span>
            <b>{languageLabel(sourceLanguage)}</b>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Listener language
            </span>
            <b>{languageLabel(listenLanguage)}</b>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Transcript
            </span>
            <b className="text-emerald-300">
              {latestTranscript ? "Running" : "Waiting"}
            </b>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Translated caption
            </span>
            <b
              className={
                latestCaption
                  ? "text-emerald-300"
                  : "text-slate-500"
              }
            >
              {latestCaption ? "Ready" : "Waiting"}
            </b>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Target latency
            </span>
            <b className="text-cyan-200">
              2–5s
            </b>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-400">
              Speaker profile
            </span>
            <b className="text-purple-200">
              Enrolled foundation
            </b>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 xl:col-span-2">
        <div className="font-semibold">
          Live Transcript
        </div>

        {latestTranscript ? (
          <>
            <p className="mt-4 text-sm">
              <b>
                {latestTranscript.speaker_name || "Speaker"}:
              </b>{" "}
              {latestTranscript.transcript_text}
            </p>

            {latestCaption ? (
              <p className="mt-2 text-sm text-cyan-200">
                {latestCaption}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                No {languageLabel(listenLanguage)} translation yet.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            No transcript yet.
          </p>
        )}
      </div>
    </div>
  );
}
