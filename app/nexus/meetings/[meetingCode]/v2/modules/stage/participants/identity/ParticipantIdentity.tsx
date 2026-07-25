"use client";

export interface ParticipantIdentityProps {
  name: string;
  role: string;
  host: boolean;
  onOpenControls: () => void;
}

export default function ParticipantIdentity({
  name,
  role,
  host,
  onOpenControls,
}: ParticipantIdentityProps) {
  const canOpenControls = host || role === "Admin";

  return (
    <>
      <p className="mt-3 truncate text-sm font-black text-white">
        {name}
      </p>

      <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.12em] text-slate-400">
        {role}
      </p>

      {canOpenControls ? (
        <button
          type="button"
          title="Host and admin controls"
          onClick={onOpenControls}
          className="mx-auto mt-2 grid h-8 w-8 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] text-sm transition hover:border-cyan-300/50 hover:bg-cyan-300/[0.14]"
        >
          ⚙️
        </button>
      ) : null}
    </>
  );
}
