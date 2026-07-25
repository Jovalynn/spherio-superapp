"use client";

import type { ReactNode } from "react";

export interface ParticipantMenuProps {
  isOpen: boolean;
  onToggle: () => void;

  name: string;

  onViewProfile: () => void;

  onPin: () => void;

  children?: ReactNode;
}

export default function ParticipantMenu({
  children,
  isOpen,
  onToggle,
  name,
  onViewProfile,
  onPin,
}: ParticipantMenuProps) {
 return (
  <div
    data-participant-menu-module
    data-nexus-toolbar-dropdown
    className="absolute bottom-2 right-2 z-20"
  >
    <button
      type="button"
      title="Participant actions"
      onClick={onToggle}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/50 text-sm font-black text-slate-200 backdrop-blur hover:border-cyan-300/30"
    >
      ⋯
    </button>

    {isOpen ? (
      <div
        data-nexus-toolbar-dropdown
        className="absolute bottom-10 right-0 z-50 w-52 rounded-2xl border border-white/10 bg-[#101a25] p-2 text-left shadow-2xl"
      >
        <button
          onClick={onViewProfile}
          className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
        >
          👤 View profile
        </button>

        <button
          onClick={onPin}
          className="w-full rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-white/[0.06]"
        >
          📌 Pin locally
        </button>

        {children}
      </div>
    ) : null}
     </div>
  );
}
