"use client";

type LanguageOption = {
  code: string;
  label: string;
};

type MeetingContextRailProps = {
  meetingCode: string;
  hostName: string;
  participantCount: number;
  participantRoomMode: string;
  listenLanguage: string;
  languageModeLabel: string;
  languageCodes: string[];
  languageOptions: LanguageOption[];
  inviteUrl: string;
  originalSpeechLanguage: string;
  translatedSpeechLanguage: string;
  latestCaption: string;
  languageLabel: (code: string) => string;
  onLanguageChange: (language: string) => void;
};

export default function MeetingContextRail({
  meetingCode,
  hostName,
  participantCount,
  participantRoomMode,
  listenLanguage,
  languageModeLabel,
  languageCodes,
  languageOptions,
  inviteUrl,
  originalSpeechLanguage,
  translatedSpeechLanguage,
  latestCaption,
  languageLabel,
  onLanguageChange,
}: MeetingContextRailProps) {
  return (
    <aside className="sticky top-0 h-screen min-w-0 overflow-y-auto border-r border-white/10 bg-[#0a111a] px-3 py-4 [scrollbar-width:thin]">
      <div className="min-w-0 border-b border-white/10 pb-3">
        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300">
          Meeting workspace
        </div>

        <h1 className="mt-1 text-base font-black leading-5 text-white">
          Nexus Team
        </h1>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          Language and room controls
        </p>
      </div>

      <section className="mt-3 rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold">My Language</div>

          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-semibold text-cyan-100">
            Auto
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          Select your speaking and listening language.
        </p>

        <select
          value={listenLanguage}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 text-sm"
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>

        <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
          <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
            Status
          </div>

          <div className="mt-2 space-y-2">
            <div className="truncate text-base font-black text-cyan-100">
              {languageLabel(listenLanguage)}
            </div>

            <div className="inline-flex max-w-full rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
              {languageModeLabel || "Listening"}
            </div>
          </div>

          <p className="mt-2 text-[10px] leading-4 text-slate-400">
            Speaking status updates automatically.
          </p>
        </div>

        <div className="mt-3">
          <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
            Active languages
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {languageCodes.map((code) => (
              <span
                key={String(code)}
                className={`rounded-full border px-2 py-1 text-[9px] font-black ${
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

        <p className="mt-3 text-[10px] text-emerald-300">
          ● Translation ready
        </p>
      </section>

      <section className="mt-3 rounded-2xl border border-white/10 bg-[#050b12]/[0.04] p-3">
        <div className="text-xs font-semibold text-white">
          Meeting
        </div>

        <div className="mt-3 space-y-2 text-[10px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500">Host</span>

            <span className="truncate text-right font-semibold text-slate-200">
              {hostName}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500">Code</span>

            <span className="break-all text-right font-semibold text-cyan-200">
              {meetingCode}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500">People</span>

            <span className="font-semibold text-slate-200">
              {participantCount}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500">Mode</span>

            <span className="text-right font-semibold text-slate-200">
              {participantRoomMode}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(inviteUrl)}
          className="mt-3 w-full rounded-lg bg-indigo-500 px-2 py-2 text-[10px] font-semibold transition hover:bg-indigo-400"
        >
          Copy invite link
        </button>
      </section>

      <section className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold">
            Interpretation
          </div>

          <span className="text-[9px] font-semibold text-emerald-300">
            ● Live
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-[10px]">
          <span className="text-slate-500">
            {originalSpeechLanguage}
          </span>

          <span className="text-cyan-300">→</span>

          <span className="font-semibold text-cyan-100">
            {translatedSpeechLanguage}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-400">
          {latestCaption || "Waiting for translated speech..."}
        </p>
      </section>
    </aside>
  );
}
