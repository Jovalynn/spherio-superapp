"use client";

import { useEffect, useMemo, useState } from "react";

type Team = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: string;
  default_language: string;
  translation_enabled: boolean;
  ai_summary_enabled: boolean;
  recording_enabled: boolean;
  created_at: string;
};

export default function NexusTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("Nexus Core Team");
  const [description, setDescription] = useState("Shared Nexus collaboration workspace.");
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTeams() {
    const res = await fetch("/api/riomind/teams", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setTeams(data.teams || []);
  }

  useEffect(() => {
    loadTeams().catch(() => setMessage("Could not load teams."));
  }, []);

  async function createTeam() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/riomind/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          translationEnabled,
          aiSummaryEnabled,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setMessage(data.error || "Could not create team.");
        return;
      }

      setMessage(`Created ${data.team.name} with workspace, owner, and General room.`);
      setName("");
      setDescription("");
      await loadTeams();
    } catch {
      setMessage("Could not create team.");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return {
      teams: teams.length,
      translation: teams.filter((t) => t.translation_enabled).length,
      ai: teams.filter((t) => t.ai_summary_enabled).length,
    };
  }, [teams]);

  return (
    <main className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-7 shadow-2xl shadow-cyan-950/30">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            RioMind Nexus
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Nexus Teams</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Team workspaces for shared files, reports, analytics, artifacts, rooms,
            meetings, voice collaboration, live translation, and AI meeting intelligence.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat label="Teams" value={stats.teams} />
            <Stat label="Translation-ready" value={stats.translation} />
            <Stat label="AI summary-ready" value={stats.ai} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Create Team</h2>
            <p className="mt-2 text-sm text-slate-400">
              Creates a team, owner member, main workspace, and default General room.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm text-slate-300">Team name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  placeholder="Nexus Enterprise Team"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                  placeholder="Shared collaboration workspace..."
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Live translation-ready"
                  checked={translationEnabled}
                  setChecked={setTranslationEnabled}
                />
                <Toggle
                  label="AI summary-ready"
                  checked={aiSummaryEnabled}
                  setChecked={setAiSummaryEnabled}
                />
              </div>

              <button
                onClick={createTeam}
                disabled={loading || !name.trim()}
                className="w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Team Workspace"}
              </button>

              {message ? (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
                  {message}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Team Workspaces</h2>
            <div className="mt-4 space-y-3">
              {teams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">
                  No teams yet.
                </div>
              ) : (
                teams.map((team) => (
                  <a href={`/nexus/teams/${team.id}`} key={team.id} className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.04]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{team.description || "No description"}</p>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {team.visibility}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                      <Badge label="Language" value={team.default_language} />
                      <Badge label="Translation" value={team.translation_enabled ? "Ready" : "Off"} />
                      <Badge label="AI Summary" value={team.ai_summary_enabled ? "Ready" : "Off"} />
                    </div>
                  </a>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Teams Roadmap</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Roadmap title="V1" body="Teams, members, roles, shared workspaces, files, reports, analytics, artifacts." />
            <Roadmap title="V2" body="Team rooms, meeting rooms, shared chat, notes, documents, whiteboard." />
            <Roadmap title="V3" body="Voice rooms, calls, recording, audio streams, transcription." />
            <Roadmap title="V4" body="Voice-to-voice, voice-to-text, text-to-voice, live meeting translation." />
            <Roadmap title="V5" body="Transcript, summary, decisions, action items, commitments, follow-up tasks." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-3xl font-bold text-cyan-200">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  setChecked,
}: {
  label: string;
  checked: boolean;
  setChecked: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left"
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2 text-xs text-slate-400">{checked ? "Enabled" : "Disabled"}</div>
    </button>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Roadmap({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-lg font-bold text-cyan-200">{title}</div>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}
