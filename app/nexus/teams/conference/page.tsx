"use client";

import Link from "next/link";

const meetingCode = "NX-2026-MU8OO0";

export default function NexusTeamsConferencePage() {
  return (
    <main className="min-h-screen bg-[#070d14] p-6 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200">Nexus Teams</p>
            <h1 className="mt-2 text-3xl font-black">Conference</h1>
            <p className="mt-1 text-sm text-slate-400">
              Meeting scheduler, calendar, live conference rooms, interpretation, recording, and AI notes.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href={`/nexus/meetings/${meetingCode}/calendar`} className="rounded-xl border border-white/10 px-5 py-3">
              Calendar
            </Link>
            <Link href={`/nexus/meetings/${meetingCode}/v2`} className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">
              Open Live Room
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["Calendar", "Schedule and manage meetings.", `/nexus/meetings/${meetingCode}/calendar`],
            ["Scheduled Meetings", "Upcoming rooms and bookings.", `/nexus/meetings/${meetingCode}/calendar`],
            ["Active Meetings", "Open live rooms and conferences.", `/nexus/meetings/${meetingCode}/v2`],
            ["Recordings", "Open meeting recordings, transcripts, replay files, and AI summaries.", `/nexus/meetings/${meetingCode}/v2`],
            ["Shared Assets", "Manage meeting slides, documents, uploaded videos, streams, and presentation files.", `/nexus/meetings/${meetingCode}/v2`],
            ["Analytics", "View attendance, translation latency, language usage, meeting quality, and AI insights.", `/nexus/meetings/${meetingCode}/v2`],
          ].map(([title, desc, href]) => (
            <Link key={title} href={href} className="rounded-3xl border border-white/10 bg-black/20 p-5 hover:bg-white/[0.06]">
              <div className="text-lg font-bold">{title}</div>
              <p className="mt-2 text-sm text-slate-400">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
