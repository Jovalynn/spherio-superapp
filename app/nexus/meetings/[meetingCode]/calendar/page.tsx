"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type MeetingStatus = "Scheduled" | "Live" | "Ended" | "Cancelled";

type ScheduledMeeting = {
  title: string;
  organizer: string;
  date: string;
  start: string;
  end: string;
  language: string;
  translation: boolean;
  recording: boolean;
  meetingType: string;
  agenda: string;
  code: string;
  status: MeetingStatus;
  invited: string;
};

function makeCode() {
  return `NX-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatInviteText(meeting: ScheduledMeeting, invite: string) {
  return `You are invited to ${meeting.title}

Date: ${meeting.date}
Time: ${meeting.start} - ${meeting.end}
Type: ${meeting.meetingType}
Language: ${meeting.language}
Translation: ${meeting.translation ? "Enabled" : "Off"}
Recording: ${meeting.recording ? "Enabled" : "Off"}

Join Nexus Teams:
${invite}`;
}

export default function NexusTeamsCalendarPage() {
  const params = useParams();
  const meetingCode = String(params?.meetingCode || "NX-2026-MU8OO0");
  const [showScheduler, setShowScheduler] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([
    {
      title: "Nexus Teams Scheduler Kickoff",
      organizer: "John",
      date: "2026-06-23",
      start: "14:00",
      end: "15:00",
      language: "English",
      translation: true,
      recording: false,
      meetingType: "Conference",
      agenda: "Plan meeting scheduler, invite links, lobby, voice translation, and AI intelligence.",
      code: meetingCode,
      status: "Scheduled",
      invited: "0",
    },
  ]);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  async function copyInvite(code: string, invite: string) {
    await navigator.clipboard?.writeText(invite);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1600);
  }

  async function shareInvite(meeting: ScheduledMeeting, invite: string) {
    const text = formatInviteText(meeting, invite);

    if (navigator.share) {
      await navigator.share({
        title: meeting.title,
        text,
        url: invite,
      });
      return;
    }

    await copyInvite(meeting.code, invite);
  }

  function scheduleMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const code = makeCode();

    const meeting: ScheduledMeeting = {
      title: String(form.get("title") || "Nexus Teams Meeting"),
      organizer: String(form.get("organizer") || "John"),
      date: String(form.get("date") || ""),
      start: String(form.get("start") || ""),
      end: String(form.get("end") || ""),
      language: String(form.get("language") || "English"),
      translation: form.get("translation") === "on",
      recording: form.get("recording") === "on",
      meetingType: String(form.get("meetingType") || "Conference"),
      agenda: String(form.get("agenda") || ""),
      invited: String(form.get("invited") || "0"),
      code,
      status: "Scheduled",
    };

    setMeetings((prev) => [meeting, ...prev]);
    setShowScheduler(false);
  }

  return (
    <main className="min-h-screen bg-[#070d14] p-6 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h1 className="text-3xl font-black">Calendar</h1>
            <p className="text-sm text-slate-400">
              Schedule Nexus Teams meetings, create invite links, and join conference rooms.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href={`/nexus/meetings/${meetingCode}/v2`} className="rounded-xl border border-white/10 px-4 py-3">
              Back to meeting
            </Link>
            <button onClick={() => setShowScheduler(true)} className="rounded-xl bg-indigo-500 px-5 py-3 font-bold">
              + New meeting
            </button>
          </div>
        </div>

        {showScheduler ? (
          <form onSubmit={scheduleMeeting} className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Schedule a Nexus Teams meeting</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Create a room, generate invite links, and prepare multilingual meeting settings.
                </p>
              </div>
              <button type="button" onClick={() => setShowScheduler(false)} className="rounded-xl border border-white/10 px-3 py-2">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Meeting title
                <input name="title" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" defaultValue="Nexus Teams Meeting" />
              </label>

              <label className="text-xs text-slate-400">
                Organizer / host
                <input name="organizer" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" defaultValue="John" />
              </label>

              <label className="text-xs text-slate-400">
                Meeting date
                <input name="date" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" type="date" required />
              </label>

              <label className="text-xs text-slate-400">
                Start time
                <input name="start" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" type="time" required />
              </label>

              <label className="text-xs text-slate-400">
                End time
                <input name="end" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" type="time" required />
              </label>

              <label className="text-xs text-slate-400">
                Meeting type
                <select name="meetingType" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100">
                  <option>Conference</option>
                  <option>Team Meeting</option>
                  <option>Voice Room</option>
                  <option>Webinar</option>
                  <option>Broadcast</option>
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Default meeting language
                <select name="language" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100">
                  <option>English</option>
                  <option>French</option>
                  <option>Arabic</option>
                  <option>Spanish</option>
                  <option>Hausa</option>
                  <option>Yoruba</option>
                  <option>Igbo</option>
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Invited participants
                <input name="invited" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" type="number" min="0" defaultValue="0" />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <input name="translation" type="checkbox" defaultChecked />
                Enable multilingual translation
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                <input name="recording" type="checkbox" />
                Enable recording
              </label>
            </div>

            <label className="mt-4 block text-xs text-slate-400">
              Meeting agenda / purpose
              <textarea name="agenda" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100" rows={3} />
            </label>

            <div className="mt-5 flex gap-3">
              <button className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Generate Link & Schedule</button>
              <button type="button" onClick={() => setShowScheduler(false)} className="rounded-xl border border-white/10 px-5 py-3">Cancel</button>
            </div>
          </form>
        ) : null}

        <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Scheduled Meetings Intelligence</h2>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
              {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {meetings.map((meeting) => {
              const invite = `${origin}/nexus/meetings/${meeting.code}/v2`;
              const shareText = formatInviteText(meeting, invite);
              const mailto = `mailto:?subject=${encodeURIComponent(`Invitation: ${meeting.title}`)}&body=${encodeURIComponent(shareText)}`;
              const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
              const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${meeting.date.replaceAll("-", "")}T${meeting.start.replace(":", "")}00/${meeting.date.replaceAll("-", "")}T${meeting.end.replace(":", "")}00&details=${encodeURIComponent(shareText)}`;

              return (
                <div key={meeting.code} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{meeting.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {meeting.date} · {meeting.start}–{meeting.end} · {meeting.meetingType}
                      </div>
                      <div className="mt-2 text-xs text-cyan-200">
                        Code: {meeting.code}
                      </div>
                    </div>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      {meeting.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-slate-400">Organizer</div>
                      <div className="font-bold">{meeting.organizer}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-slate-400">Language</div>
                      <div className="font-bold">{meeting.language}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-slate-400">Translation</div>
                      <div className={meeting.translation ? "font-bold text-emerald-300" : "font-bold text-slate-500"}>{meeting.translation ? "Enabled" : "Off"}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-slate-400">Invited</div>
                      <div className="font-bold">{meeting.invited}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
                    <div className="text-xs text-slate-400">Generated invite link</div>
                    <a
                      href={invite}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-sm text-cyan-100 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200"
                    >
                      {invite}
                    </a>
                  </div>

                  {meeting.agenda ? <p className="mt-3 text-sm text-slate-400">{meeting.agenda}</p> : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/nexus/meetings/${meeting.code}/v2`} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                      Join
                    </Link>
                    <button onClick={() => copyInvite(meeting.code, invite)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">
                      {copiedCode === meeting.code ? "Copied" : "Copy Link"}
                    </button>
                    <button onClick={() => shareInvite(meeting, invite)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">
                      Share
                    </button>
                    <a href={mailto} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Email</a>
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2 text-sm">WhatsApp</a>
                    <a href={google} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Google Calendar</a>
                    <button className="rounded-xl border border-white/10 px-4 py-2 text-sm">Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
