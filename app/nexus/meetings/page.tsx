"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Team = {
  id: string;
  name?: string;
  slug?: string;
};

type Meeting = {
  id?: string;
  team_id?: string;
  room_id?: string | null;
  meeting_code?: string;
  title?: string;
  purpose?: string | null;
  organizer?: string | null;
  meeting_date?: string | null;
  meeting_time?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
  default_language?: string | null;
  language_mode?: string | null;
  translation_enabled?: boolean | null;
  recording_enabled?: boolean | null;
  participant_count?: number | null;
  invited_count?: number | null;
  summary_count?: number | null;
  transcript_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  team_name?: string;
};

type MeetingView = Meeting & {
  team_name: string;
};

const languageLabels: Record<string, string> = {
  en: "English",
  pcm: "Nigerian Pidgin",
  ha: "Hausa",
  ig: "Igbo",
  yo: "Yoruba",
  fr: "French",
  es: "Spanish",
  de: "German",
  zh: "Mandarin Chinese",
  ar: "Arabic",
};

function safeDateValue(meeting: Meeting) {
  if (meeting.meeting_date) {
    const combined = `${meeting.meeting_date}T${meeting.meeting_time || "00:00"}`;
    const parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  for (const value of [meeting.updated_at, meeting.created_at]) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMeetingDate(meeting: MeetingView) {
  const date = safeDateValue(meeting);

  if (!date) return "Schedule not set";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: meeting.meeting_time ? "numeric" : undefined,
    minute: meeting.meeting_time ? "2-digit" : undefined,
  }).format(date);
}

function normalizeStatus(meeting: MeetingView) {
  const raw = String(meeting.status || "").toLowerCase();
  const date = safeDateValue(meeting);
  const now = new Date();

  if (["live", "active", "in_progress", "in-progress", "started"].includes(raw)) {
    return "live";
  }

  if (["completed", "ended", "closed"].includes(raw)) {
    return "completed";
  }

  if (["cancelled", "canceled"].includes(raw)) {
    return "cancelled";
  }

  if (date && sameCalendarDay(date, now)) return "today";
  if (date && date.getTime() > now.getTime()) return "scheduled";

  return raw || "recent";
}

function statusClasses(status: string) {
  if (status === "live") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "today") {
    return "border-cyan-300/30 bg-cyan-400/10 text-cyan-200";
  }

  if (status === "scheduled") {
    return "border-violet-300/30 bg-violet-400/10 text-violet-200";
  }

  if (status === "completed") {
    return "border-slate-300/20 bg-slate-400/10 text-slate-200";
  }

  if (status === "cancelled") {
    return "border-red-300/25 bg-red-400/10 text-red-200";
  }

  return "border-amber-300/25 bg-amber-400/10 text-amber-200";
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingView }) {
  const code = String(meeting.meeting_code || "").trim();
  const validCode = Boolean(code && !code.includes("<") && !code.includes(">"));
  const status = normalizeStatus(meeting);
  const meetingUrl = validCode
    ? `/nexus/meetings/${encodeURIComponent(code)}/v2`
    : "";
  const workspaceUrl = validCode
    ? `/nexus/meetings/${encodeURIComponent(code)}`
    : "";
  const calendarUrl = validCode
    ? `/nexus/meetings/${encodeURIComponent(code)}/calendar`
    : "";

  const participantCount =
    Number(meeting.participant_count ?? meeting.invited_count ?? 0) || 0;
  const summaryCount = Number(meeting.summary_count ?? 0) || 0;
  const transcriptCount = Number(meeting.transcript_count ?? 0) || 0;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${statusClasses(
                status,
              )}`}
            >
              {status.replaceAll("_", " ")}
            </span>

            {meeting.recording_enabled ? (
              <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-[11px] font-semibold text-red-200">
                Recording enabled
              </span>
            ) : null}

            {meeting.translation_enabled ? (
              <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold text-teal-200">
                Translation enabled
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 truncate text-xl font-bold text-white">
            {meeting.title || "Untitled Nexus meeting"}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
            {meeting.purpose || "Nexus Teams collaboration meeting."}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left xl:text-right">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Meeting code
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-cyan-200">
            {validCode ? code : "Unavailable"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Team
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-100">
            {meeting.team_name || "Nexus Team"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Organizer
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-100">
            {meeting.organizer || "Organizer"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Schedule
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-100">
            {formatMeetingDate(meeting)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Language
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-100">
            {languageLabels[meeting.default_language || ""] ||
              meeting.default_language ||
              "English"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300">
          People {participantCount}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300">
          AI summaries {summaryCount}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300">
          Transcripts {transcriptCount}
        </span>
        {meeting.duration_minutes ? (
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-slate-300">
            {meeting.duration_minutes} minutes
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {validCode ? (
          <>
            <Link
              href={meetingUrl}
              className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Open meeting
            </Link>

            <Link
              href={workspaceUrl}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/30"
            >
              Open workspace
            </Link>

            <Link
              href={calendarUrl}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-violet-300/30"
            >
              Calendar
            </Link>
          </>
        ) : (
          <span className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">
            This meeting has no valid meeting code.
          </span>
        )}

        <button
          type="button"
          onClick={async () => {
            if (!validCode) return;
            await navigator.clipboard?.writeText(code);
          }}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-300/30"
        >
          Copy code
        </button>
      </div>
    </article>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
      <div className="text-lg font-bold text-slate-200">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function NexusMeetingsDashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [meetings, setMeetings] = useState<MeetingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");

  const [joinCode, setJoinCode] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingOrganizer, setMeetingOrganizer] = useState("John");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("60");
  const [meetingLanguage, setMeetingLanguage] = useState("en");

  async function loadDashboard() {
    setLoading(true);
    setLoadMessage("");

    try {
      const teamsResponse = await fetch("/api/riomind/teams", {
        cache: "no-store",
      });
      const teamsJson = await teamsResponse.json();

      if (!teamsResponse.ok || !teamsJson.ok) {
        throw new Error(teamsJson.error || "Could not load teams.");
      }

      const loadedTeams: Team[] = Array.isArray(teamsJson.teams)
        ? teamsJson.teams
        : [];

      setTeams(loadedTeams);

      if (!selectedTeamId && loadedTeams[0]?.id) {
        setSelectedTeamId(loadedTeams[0].id);
      }

      const meetingResponses = await Promise.all(
        loadedTeams.map(async (team) => {
          try {
            const response = await fetch(
              `/api/riomind/teams/${encodeURIComponent(team.id)}/meetings`,
              { cache: "no-store" },
            );
            const json = await response.json();

            if (!response.ok || !json.ok) return [];

            const rows: Meeting[] = Array.isArray(json.meetings)
              ? json.meetings
              : [];

            return rows.map(
              (meeting): MeetingView => ({
                ...meeting,
                team_id: meeting.team_id || team.id,
                team_name: team.name || "Nexus Team",
              }),
            );
          } catch {
            return [];
          }
        }),
      );

      const flattened = meetingResponses
        .flat()
        .sort((left, right) => {
          const rightDate = safeDateValue(right)?.getTime() || 0;
          const leftDate = safeDateValue(left)?.getTime() || 0;
          return rightDate - leftDate;
        });

      setMeetings(flattened);
    } catch (error) {
      setLoadMessage(
        error instanceof Error
          ? error.message
          : "Could not load the meetings dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const groups = useMemo(() => {
    const now = new Date();

    const live = meetings.filter(
      (meeting) => normalizeStatus(meeting) === "live",
    );

    const today = meetings.filter((meeting) => {
      const date = safeDateValue(meeting);
      return date ? sameCalendarDay(date, now) : false;
    });

    const scheduled = meetings.filter((meeting) => {
      const date = safeDateValue(meeting);
      return (
        date &&
        date.getTime() > now.getTime() &&
        !sameCalendarDay(date, now) &&
        normalizeStatus(meeting) !== "live"
      );
    });

    const recent = meetings
      .filter(
        (meeting) =>
          !live.includes(meeting) &&
          !today.includes(meeting) &&
          !scheduled.includes(meeting),
      )
      .slice(0, 8);

    return { live, today, scheduled, recent };
  }, [meetings]);

  function joinMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleaned = joinCode.trim().replace(/^\/+|\/+$/g, "");

    if (!cleaned || cleaned.includes("<") || cleaned.includes(">")) {
      setActionMessage("Enter a valid Nexus meeting code.");
      return;
    }

    window.location.href = `/nexus/meetings/${encodeURIComponent(cleaned)}/v2`;
  }

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");

    if (!selectedTeamId) {
      setActionMessage("Choose a team before creating a meeting.");
      return;
    }

    if (!meetingTitle.trim()) {
      setActionMessage("Enter a meeting title.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(
        `/api/riomind/teams/${encodeURIComponent(selectedTeamId)}/meetings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: meetingTitle.trim(),
            purpose: meetingPurpose.trim(),
            organizer: meetingOrganizer.trim() || "Organizer",
            meetingDate,
            meetingTime,
            durationMinutes: Number(meetingDuration || 60),
            languageMode: "single",
            defaultLanguage: meetingLanguage,
          }),
        },
      );

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Could not create meeting.");
      }

      const newCode = String(json.meeting?.meeting_code || "").trim();

      setMeetingTitle("");
      setMeetingPurpose("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingDuration("60");
      setMeetingLanguage("en");
      setActionMessage(
        newCode
          ? `Meeting created successfully: ${newCode}`
          : "Meeting created successfully.",
      );

      await loadDashboard();
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Could not create meeting.",
      );
    } finally {
      setCreating(false);
    }
  }

  const resumeMeeting =
    groups.live[0] || groups.today[0] || groups.scheduled[0] || meetings[0];

  return (
    <main className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-10">
        <header className="rounded-[28px] border border-cyan-300/15 bg-white/[0.035] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">
                Nexus Teams
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Meetings
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Create, join, resume, schedule, and manage Nexus meetings from
                one collaboration hub.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/nexus/teams"
                className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30"
              >
                My teams
              </Link>

              {resumeMeeting?.meeting_code ? (
                <Link
                  href={`/nexus/meetings/${encodeURIComponent(
                    resumeMeeting.meeting_code,
                  )}/v2`}
                  className="rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/15"
                >
                  Quick resume
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setShowCreate((current) => !current)}
                className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              >
                {showCreate ? "Close creator" : "+ New meeting"}
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Live meetings"
              value={groups.live.length}
              detail="Active collaboration rooms"
            />
            <MetricCard
              label="Today"
              value={groups.today.length}
              detail="Meetings scheduled today"
            />
            <MetricCard
              label="Scheduled"
              value={groups.scheduled.length}
              detail="Upcoming meetings"
            />
            <MetricCard
              label="My teams"
              value={teams.length}
              detail="Available team workspaces"
            />
          </div>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form
            onSubmit={joinMeeting}
            className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
              Join by code
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">
              Enter a Nexus meeting
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Paste the generated meeting code from an invitation or calendar
              entry.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Example: NX-2026-MU8O00"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
              />
              <button
                type="submit"
                className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              >
                Join meeting
              </button>
            </div>
          </form>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
              Meeting tools
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">
              Collaboration shortcuts
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/nexus/teams"
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30"
              >
                <div className="font-bold text-white">My Teams</div>
                <div className="mt-1 text-sm text-slate-500">
                  Open team workspaces and members.
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-violet-300/30"
              >
                <div className="font-bold text-white">Create Meeting</div>
                <div className="mt-1 text-sm text-slate-500">
                  Schedule inside a selected team.
                </div>
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-bold text-white">Meeting Templates</div>
                <div className="mt-1 text-sm text-slate-500">
                  Team sync, planning, review, and workshop foundations.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-bold text-white">Calendar</div>
                <div className="mt-1 text-sm text-slate-500">
                  Calendar access is available from every meeting card.
                </div>
              </div>
            </div>
          </div>
        </section>

        {showCreate ? (
          <section className="mt-6 rounded-[28px] border border-violet-300/15 bg-violet-400/[0.045] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
                  Create meeting
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  New Nexus Teams meeting
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="self-start rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/20"
              >
                Close
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                Create a Nexus Team before scheduling a team meeting.
                <Link
                  href="/nexus/teams"
                  className="ml-2 font-bold text-amber-50 underline"
                >
                  Open Teams
                </Link>
              </div>
            ) : (
              <form
                onSubmit={createMeeting}
                className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              >
                <label className="text-sm text-slate-300">
                  Team
                  <select
                    value={selectedTeamId}
                    onChange={(event) => setSelectedTeamId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111B] px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name || team.slug || team.id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-300">
                  Meeting title
                  <input
                    value={meetingTitle}
                    onChange={(event) => setMeetingTitle(event.target.value)}
                    placeholder="Weekly Nexus sync"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-300/40"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Organizer
                  <input
                    value={meetingOrganizer}
                    onChange={(event) => setMeetingOrganizer(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Language
                  <select
                    value={meetingLanguage}
                    onChange={(event) => setMeetingLanguage(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111B] px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  >
                    {Object.entries(languageLabels).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-slate-300 md:col-span-2">
                  Purpose
                  <textarea
                    value={meetingPurpose}
                    onChange={(event) => setMeetingPurpose(event.target.value)}
                    rows={3}
                    placeholder="Purpose, agenda, or expected outcome"
                    className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-300/40"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Date
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Time
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  />
                </label>

                <label className="text-sm text-slate-300">
                  Duration
                  <select
                    value={meetingDuration}
                    onChange={(event) => setMeetingDuration(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B111B] px-4 py-3 text-white outline-none focus:border-violet-300/40"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full rounded-xl bg-violet-400 px-5 py-3 font-black text-white transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create meeting"}
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : null}

        {actionMessage ? (
          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100">
            {actionMessage}
          </div>
        ) : null}

        {loadMessage ? (
          <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-4 text-sm text-red-100">
            {loadMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
            Loading Nexus meetings...
          </div>
        ) : (
          <div className="mt-7 space-y-8">
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                    Live meetings
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Active now
                  </h2>
                </div>
                <div className="text-sm text-slate-500">
                  {groups.live.length} live
                </div>
              </div>

              <div className="grid gap-4">
                {groups.live.length ? (
                  groups.live.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.id || meeting.meeting_code || index}
                      meeting={meeting}
                    />
                  ))
                ) : (
                  <EmptySection
                    title="No live meetings"
                    description="Meetings marked active or in progress will appear here for immediate entry."
                  />
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
                    Today&apos;s meetings
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Today
                  </h2>
                </div>
                <div className="text-sm text-slate-500">
                  {groups.today.length} today
                </div>
              </div>

              <div className="grid gap-4">
                {groups.today.length ? (
                  groups.today.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.id || meeting.meeting_code || index}
                      meeting={meeting}
                    />
                  ))
                ) : (
                  <EmptySection
                    title="Nothing scheduled today"
                    description="Create a meeting or use an existing meeting code to enter a collaboration room."
                  />
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
                    Scheduled meetings
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Upcoming
                  </h2>
                </div>
                <div className="text-sm text-slate-500">
                  {groups.scheduled.length} upcoming
                </div>
              </div>

              <div className="grid gap-4">
                {groups.scheduled.length ? (
                  groups.scheduled.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.id || meeting.meeting_code || index}
                      meeting={meeting}
                    />
                  ))
                ) : (
                  <EmptySection
                    title="No upcoming meetings"
                    description="Scheduled team meetings will appear here in chronological order."
                  />
                )}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                    Recent meetings
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    History and quick resume
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              <div className="grid gap-4">
                {groups.recent.length ? (
                  groups.recent.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.id || meeting.meeting_code || index}
                      meeting={meeting}
                    />
                  ))
                ) : meetings.length === 0 ? (
                  <EmptySection
                    title="No meetings yet"
                    description="Create your first Nexus Teams meeting or open a Team Workspace to begin collaboration."
                  />
                ) : (
                  <EmptySection
                    title="No additional recent meetings"
                    description="All available meetings are already displayed in the live, today, or scheduled sections."
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
