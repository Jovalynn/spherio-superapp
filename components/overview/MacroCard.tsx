import React from "react";

type Tone = "neutral" | "good" | "warn" | "bad";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "good":
      return "border-emerald-200/70 bg-emerald-50/40";
    case "warn":
      return "border-amber-200/70 bg-amber-50/40";
    case "bad":
      return "border-rose-200/70 bg-rose-50/40";
    default:
      return "border-slate-200/70 bg-white/60";
  }
}

export function MacroCard(props: {
  title: string;
  value: string;
  subtitle?: string;
  footnote?: string;
  tone?: Tone;
  rightSlot?: React.ReactNode;
}) {
  const { title, value, subtitle, footnote, tone = "neutral", rightSlot } = props;

  return (
    <div
      className={[
        "rounded-2xl border shadow-sm backdrop-blur-md",
        "px-6 py-5",
        toneClasses(tone),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-wide text-slate-600 uppercase">
            {title}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          ) : null}
        </div>

        {rightSlot ? <div className="pt-1">{rightSlot}</div> : null}
      </div>

      {footnote ? (
        <div className="mt-4 text-xs text-slate-500">{footnote}</div>
      ) : null}
    </div>
  );
}
