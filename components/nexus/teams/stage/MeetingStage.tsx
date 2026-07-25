"use client";

type Props = {
  mode: string;
  stageMode?: string;
  videoMode?: string;
  meetingCode: string;
  participantCount: number;
  participants: any[];
  listenLanguageLabel?: string;
  logoUrl: string;
  onOpenMic?: () => void;
  onOpenPeople?: () => void;
  onOpenRaisedHands?: () => void;
  onOpenLanguages?: () => void;
  onOpenAnalytics?: () => void;
};

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

export default function MeetingStage({
  mode,
  stageMode,
  videoMode,
  meetingCode,
  participantCount,
  participants,
  listenLanguageLabel,
  logoUrl,
  onOpenMic,
  onOpenPeople,
  onOpenRaisedHands,
  onOpenLanguages,
  onOpenAnalytics,
}: Props) {
  if (stageMode === "presentation") {
    return (
      <div className="flex min-h-[560px] w-full items-center justify-center rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.045] p-10">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-purple-300">Presentation Mode</div>
          <h3 className="mt-3 text-5xl font-black">Presentation stage ready</h3>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Shared slides, documents, screen share, video content, and presenter materials appear here.
          </p>
        </div>
      </div>
    );
  }

  if (stageMode === "video") {
    return (
      <div className="flex min-h-[560px] w-full items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.045] p-10">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Video Meeting Mode</div>
          <h3 className="mt-3 text-5xl font-black">{videoMode || "Video stage ready"}</h3>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Live video, uploaded video, video studio, replay clips, and meeting broadcast video appear here.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "waiting lobby") {
    return (
      <div className="flex min-h-[560px] w-full items-center justify-center rounded-[2rem] border border-white/10 bg-black/20 p-10">
        <div className="w-full max-w-none rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.045] p-10 shadow-[0_0_65px_rgba(34,211,238,0.08)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <img src={logoUrl} alt="Nexus Teams" className="h-16 w-16 rounded-2xl shadow-[0_0_35px_rgba(99,102,241,0.45)]" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Meeting Intelligence Lobby</div>
              <h3 className="mt-3 text-5xl font-black">Waiting room ready</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Nexus Teams is ready before participants join. Translation, transcript, knowledge graph, reasoning, memory, agents, and executive intelligence are standing by.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={onOpenMic} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Unmute / Mic</button>
            <button onClick={onOpenPeople} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Participants</button>
            <button onClick={onOpenRaisedHands} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Raised hands</button>
            <button onClick={onOpenLanguages} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Language channels</button>
            <button onClick={onOpenAnalytics} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-200">Audience analytics</button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatCard label="Room" value={meetingCode} />
            <StatCard label="Mode" value={mode} />
            <StatCard label="Participants" value={participantCount} />
            <StatCard label="Translation" value="Ready" />
            <StatCard label="Transcript" value="Running" />
            <StatCard label="Team Intelligence" value="Live" />
          </div>
        </div>
      </div>
    );
  }

  if (mode === "participant grid") {
    return (
      <div className="min-h-[560px] rounded-[2rem] border border-white/10 bg-black/20 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Participant Grid</div>
            <h3 className="mt-2 text-2xl font-black">{participantCount} participants</h3>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-sm font-black text-cyan-200">
            Clean card mode
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {participants.map((p: any, index: number) => {
            const name = p.name || p.display_name || p.participant_name || p.email || `Guest ${index + 1}`;
            return (
              <div key={p.id || name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-lg font-black text-cyan-100">
                    {String(name).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-white">{name}</div>
                    <div className="text-xs text-slate-400">{p.role || "Participant"}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-cyan-200">
                  Listening: {listenLanguageLabel || "Selected language"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const broadcast = mode === "broadcast mode";

  return (
    <div className={`min-h-[560px] rounded-[2rem] border p-8 ${broadcast ? "border-purple-300/20 bg-purple-300/[0.045]" : "border-amber-300/20 bg-amber-300/[0.045]"}`}>
      <div className={`text-xs font-black uppercase tracking-[0.28em] ${broadcast ? "text-purple-300" : "text-amber-300"}`}>
        {broadcast ? "Broadcast Mode" : "Audience Mode"}
      </div>
      <h3 className="mt-3 text-3xl font-black">{broadcast ? "Massive audience room" : "Large room optimized"}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
        Shared controls remain in the meeting toolbar. Participant rendering is sampled so Nexus Teams can scale without noisy cards.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Total audience" value={participantCount} />
        <StatCard label="Visible sample" value={participants.length} />
        <StatCard label="Active speakers" value="Stage only" />
        <StatCard label="Raised hands" value="Aggregate" />
        <StatCard label="Language channels" value="Live" />
        <StatCard label="Q&A" value="Ready" />
        <StatCard label="Moderation" value="Ready" />
        <StatCard label="Team Intelligence" value="Live" />
      </div>
    </div>
  );
}
