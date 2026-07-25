"use client";

export interface ParticipantHeaderBadgesProps {
  host: boolean;
  assistant: boolean;
  handRank: number | null;
}

export default function ParticipantHeaderBadges({
  host,
  assistant,
  handRank,
}: ParticipantHeaderBadgesProps) {
  return (
    <>
      <div
        data-nexus-toolbar-dropdown
        className="absolute z-50 left-2 top-2 flex items-center gap-1"
      >
        {host ? (
          <span
            title="Host"
            className="grid h-7 min-w-7 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-1.5 text-xs"
          >
            👑
          </span>
        ) : null}

        {assistant ? (
          <span
            title="Nexus Meeting Assistant"
            className="grid h-7 min-w-7 place-items-center rounded-full border border-purple-300/25 bg-purple-300/10 px-1.5 text-xs"
          >
            ✨
          </span>
        ) : null}
      </div>

      {handRank ? (
        <span
          title={`Raised-hand queue position ${handRank}`}
          className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2 text-xs font-black text-yellow-100"
        >
          ✋ {handRank}
        </span>
      ) : null}
    </>
  );
}
