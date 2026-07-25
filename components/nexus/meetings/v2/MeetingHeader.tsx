"use client";

type MeetingHeaderProps = {
  meetingType?: string | null;
  meetingCode: string;
  hostName: string;
  participantCount: number;
};

function meetingTypeLabel(meetingType?: string | null) {
  if (meetingType === "instant") return "Instant meeting";
  if (meetingType === "personal") return "Personal meeting room";
  if (meetingType === "team_room") return "Team room meeting";
  return "Scheduled meeting";
}

export default function MeetingHeader({
  meetingType,
  meetingCode,
  hostName,
  participantCount,
}: MeetingHeaderProps) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
        {meetingTypeLabel(meetingType)}
      </div>

      <h2 className="mt-1 text-xl font-bold text-white">
        Nexus Team
      </h2>

      <p className="mt-1 text-sm leading-5 text-slate-400">
        Meeting ID {meetingCode}
        {" · "}
        Hosted by {hostName}
        {" · "}
        {participantCount} participant
        {participantCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
