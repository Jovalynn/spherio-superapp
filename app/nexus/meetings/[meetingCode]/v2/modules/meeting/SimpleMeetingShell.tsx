"use client";

import React, { useEffect, useRef, useState } from "react";

export type MeetingSurface =
  | "talk"
  | "people"
  | "share"
  | "riomind"
  | "more";

export type ShareTarget =
  | "screen"
  | "video"
  | "document"
  | "file";

export type MeetingShellProps = {
  meetingCode: string;
  meetingTitle?: string;
  participantCount?: number;

  children: React.ReactNode;

  activeSurface?: MeetingSurface;
  onSurfaceChange?: (surface: MeetingSurface) => void;

  muted?: boolean;
  cameraOn?: boolean;
  voiceConnected?: boolean;

  onToggleMute?: () => void;
  onToggleCamera?: () => void;
  onLeave?: () => void;

  onShare?: (target: ShareTarget) => void;

  /**
   * Optional callback for application-specific More actions.
   * The shell intentionally does not own those systems.
   */
  onMoreAction?: (action: string) => void;
};

const PRIMARY_SURFACES: Array<{
  id: MeetingSurface;
  label: string;
  icon: string;
}> = [
  {
    id: "talk",
    label: "Talk",
    icon: "🎙",
  },
  {
    id: "people",
    label: "People",
    icon: "👥",
  },
  {
    id: "share",
    label: "Share",
    icon: "↗",
  },
  {
    id: "riomind",
    label: "RioMind",
    icon: "✦",
  },
  {
    id: "more",
    label: "More",
    icon: "⋯",
  },
];

const SHARE_TARGETS: Array<{
  id: ShareTarget;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: "screen",
    label: "Screen",
    icon: "🖥",
    description: "Share your screen",
  },
  {
    id: "video",
    label: "Video",
    icon: "🎬",
    description: "Bring video into the meeting",
  },
  {
    id: "document",
    label: "Document",
    icon: "📄",
    description: "Present a document",
  },
  {
    id: "file",
    label: "File",
    icon: "📎",
    description: "Share a meeting file",
  },
];

const MORE_ACTIONS = [
  "Notes",
  "Tasks",
  "Polls",
  "Whiteboard",
  "Documents",
  "Apps",
  "Recording",
  "Meeting settings",
  "Language",
  "Accessibility",
];

export default function SimpleMeetingShell({
  meetingCode,
  meetingTitle = "Nexus Teams Meeting",
  participantCount,

  children,

  activeSurface = "talk",
  onSurfaceChange,

  muted = false,
  cameraOn = false,
  voiceConnected = false,

  onToggleMute,
  onToggleCamera,
  onLeave,

  onShare,
  onMoreAction,
}: MeetingShellProps) {
  const [openMenu, setOpenMenu] = useState<
    "share" | "more" | null
  >(null);

  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current) return;

      if (
        !shellRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, []);

  function handleSurfaceClick(surface: MeetingSurface) {
    if (surface === "share") {
      setOpenMenu((current) =>
        current === "share" ? null : "share",
      );

      onSurfaceChange?.("share");
      return;
    }

    if (surface === "more") {
      setOpenMenu((current) =>
        current === "more" ? null : "more",
      );

      onSurfaceChange?.("more");
      return;
    }

    setOpenMenu(null);
    onSurfaceChange?.(surface);
  }

  function handleShare(target: ShareTarget) {
    setOpenMenu(null);
    onShare?.(target);
  }

  function handleMoreAction(action: string) {
    setOpenMenu(null);
    onMoreAction?.(action);
  }

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#06090d] text-white"
    >
      {/* =========================================================
          HEADER
         ========================================================= */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#080c11] px-4 sm:px-6">
        {/* Meeting identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08]">
            <span className="text-sm">✦</span>
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-tight">
                {meetingTitle}
              </h1>

              {voiceConnected && (
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live voice
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
              <span>Nexus Teams</span>
              <span>•</span>
              <span>{meetingCode}</span>

              {typeof participantCount === "number" && (
                <>
                  <span>•</span>
                  <span>
                    {participantCount}{" "}
                    {participantCount === 1
                      ? "person"
                      : "people"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Minimal meeting controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={
              muted
                ? "Unmute microphone"
                : "Mute microphone"
            }
            aria-pressed={muted}
            className={[
              "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs transition",
              muted
                ? "border-red-400/30 bg-red-400/[0.10] text-red-300"
                : "border-white/[0.08] bg-white/[0.025] text-slate-200 hover:bg-white/[0.07]",
            ].join(" ")}
          >
            <span>{muted ? "🔇" : "🎙"}</span>

            <span className="hidden md:inline">
              {muted ? "Unmute" : "Mute"}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCamera}
            aria-label={
              cameraOn
                ? "Turn camera off"
                : "Turn camera on"
            }
            aria-pressed={cameraOn}
            className={[
              "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs transition",
              cameraOn
                ? "border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-200"
                : "border-white/[0.08] bg-white/[0.025] text-slate-300 hover:bg-white/[0.07]",
            ].join(" ")}
          >
            <span>{cameraOn ? "▣" : "□"}</span>

            <span className="hidden md:inline">
              Camera
            </span>
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="ml-1 h-9 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 text-xs font-semibold text-red-300 transition hover:bg-red-500/[0.16]"
          >
            Leave
          </button>
        </div>
      </header>

      {/* =========================================================
          MEETING SPACE
         ========================================================= */}
      <main className="relative min-h-0 flex-1">
<div className="absolute inset-0 overflow-y-auto px-3 pb-24 pt-3 sm:px-5 sm:pb-24 sm:pt-5">
  <section className="min-h-full rounded-2xl border border-white/[0.08] bg-[#080c11]">
    {children}
  </section>
</div>
        {/* =======================================================
            SHARE MENU
           ======================================================= */}
        {openMenu === "share" && (
          <div className="absolute bottom-24 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2">
            <div className="rounded-2xl border border-white/[0.10] bg-[#0b1016]/[0.98] p-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="mb-3 px-2">
                <div className="text-sm font-semibold">
                  Share
                </div>

                <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Bring something into the meeting without
                  leaving the meeting space.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SHARE_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() =>
                      handleShare(target.id)
                    }
                    className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.05]"
                  >
                    <div className="text-lg">
                      {target.icon}
                    </div>

                    <div className="mt-2 text-xs font-semibold text-white">
                      {target.label}
                    </div>

                    <div className="mt-1 text-[10px] leading-relaxed text-slate-500 group-hover:text-slate-400">
                      {target.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            MORE MENU
           ======================================================= */}
        {openMenu === "more" && (
          <div className="absolute bottom-24 right-4 z-50 w-[min(90vw,300px)] sm:right-6">
            <div className="rounded-2xl border border-white/[0.10] bg-[#0b1016]/[0.98] p-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="px-3 pb-2 pt-2">
                <div className="text-sm font-semibold">
                  More
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  Meeting tools and settings
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {MORE_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() =>
                      handleMoreAction(action)
                    }
                    className="w-full rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          PRIMARY MEETING NAVIGATION
         ========================================================= */}
      <nav
        aria-label="Meeting navigation"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3"
      >
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.10] bg-[#0b1016]/[0.96] p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {PRIMARY_SURFACES.map((surface) => {
            const isMenu =
              surface.id === "share" ||
              surface.id === "more";

            const selected =
              !isMenu &&
              activeSurface === surface.id;

            const menuOpen =
              (surface.id === "share" &&
                openMenu === "share") ||
              (surface.id === "more" &&
                openMenu === "more");

            return (
              <button
                key={surface.id}
                type="button"
                onClick={() =>
                  handleSurfaceClick(surface.id)
                }
                aria-current={
                  selected ? "page" : undefined
                }
                aria-expanded={
                  isMenu ? menuOpen : undefined
                }
                className={[
                  "flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition sm:px-4",
                  selected || menuOpen
                    ? "bg-white/[0.10] text-white"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                <span className="text-sm">
                  {surface.icon}
                </span>

                <span>{surface.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
