"use client";

export interface ParticipantAvatarProps {
  assistant: boolean;
  avatar?: string | null;
  name: string;
  speaking: boolean;
  participant: any;
  currentViewerName: string;
  participantAvatarSize: string;
  nexusLogoUrl: string;
  initials: (name?: string) => string;
  onAvatarClick: (
    participant: any,
    participantName: string
  ) => void;
}

export default function ParticipantAvatar({
  assistant,
  avatar,
  name,
  speaking,
  participant,
  currentViewerName,
  participantAvatarSize,
  nexusLogoUrl,
  initials,
  onAvatarClick,
}: ParticipantAvatarProps) {
  function activateAvatar() {
    if (assistant) return;

    onAvatarClick(participant, name);
  }

  return (
    <div
      role={assistant ? undefined : "button"}
      tabIndex={assistant ? -1 : 0}
      title={
        assistant
          ? "Nexus Meeting Assistant"
          : name === currentViewerName
            ? "Change profile photo"
            : `View ${name}'s profile`
      }
      onClick={activateAvatar}
      onKeyDown={(event) => {
        if (
          !assistant &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          activateAvatar();
        }
      }}
      className={`relative mx-auto flex ${participantAvatarSize} items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-300/80 to-purple-300/80 font-black text-white ${
        speaking
          ? "ring-4 ring-emerald-300/75 ring-offset-4 ring-offset-[#07111c]"
          : "ring-1 ring-white/10"
      } ${
        assistant
          ? "cursor-default"
          : "cursor-pointer transition hover:scale-[1.04] hover:brightness-110"
      }`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : assistant ? (
        <img
          src={nexusLogoUrl}
          alt="Nexus AI"
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}

      {speaking ? (
        <span
          title="Speaking"
          className="absolute bottom-1 right-1 h-3 w-3 animate-pulse rounded-full border-2 border-[#07111c] bg-emerald-400"
        />
      ) : null}
    </div>
  );
}
