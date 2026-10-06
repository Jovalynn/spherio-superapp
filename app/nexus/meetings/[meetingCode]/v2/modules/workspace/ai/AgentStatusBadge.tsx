"use client";

type Props = {
  status:
    | "idle"
    | "observing"
    | "ready"
    | "running"
    | "blocked"
    | "error";
};

const colours = {
  idle: "bg-slate-500/20 text-slate-300",
  observing: "bg-cyan-500/20 text-cyan-300",
  ready: "bg-emerald-500/20 text-emerald-300",
  running: "bg-blue-500/20 text-blue-300",
  blocked: "bg-amber-500/20 text-amber-300",
  error: "bg-red-500/20 text-red-300",
};

export default function AgentStatusBadge({
  status,
}: Props) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${colours[status]}`}
    >
      {status}
    </span>
  );
}
