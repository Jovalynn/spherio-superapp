"use client";

import { useEffect, useMemo, useState } from "react";

type TeamPayload = {
  ok: boolean;
  team?: any;
  workspaces?: any[];
  members?: any[];
  rooms?: any[];
  sharedAssets?: any[];
  error?: string;
};

const roleOrder = ["owner", "admin", "manager", "analyst", "contributor", "viewer"];

const languageOptions = [
  { code: "en", label: "English" },
  { code: "pcm", label: "Nigerian Pidgin" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "yo", label: "Yoruba" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "ar", label: "Arabic" },
];

const roomTypeOptions = ["team", "meeting", "voice", "project", "analytics", "artifact"];
const assetTypeOptions = ["file", "report", "analytics", "artifact", "dashboard", "document", "note"];

export default function TeamWorkspacePage({ params }: { params: Promise<{ teamId: string }> }) {
  const [teamId, setTeamId] = useState("");
  const [data, setData] = useState<TeamPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingPurpose, setMeetingPurpose] = useState("");
  const [meetingOrganizer, setMeetingOrganizer] = useState("John");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("60");
  const [meetingLanguageMode, setMeetingLanguageMode] = useState("single");
  const [meetingLanguage, setMeetingLanguage] = useState("en");
  const [meetingRoomId, setMeetingRoomId] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("viewer");
  const [memberLanguage, setMemberLanguage] = useState("en");

  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("team");
  const [roomLanguage, setRoomLanguage] = useState("en");
  const [roomTranslation, setRoomTranslation] = useState(true);
  const [roomAiSummary, setRoomAiSummary] = useState(true);

  const [assetTitle, setAssetTitle] = useState("");
  const [assetType, setAssetType] = useState("report");

  useEffect(() => {
    params.then((p) => setTeamId(p.teamId));
  }, [params]);

  async function loadTeam() {
    if (!teamId) return;
    setLoading(true);

    try {
      const [teamRes, meetingsRes] = await Promise.all([
        fetch(`/api/riomind/teams/${teamId}`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${teamId}/meetings`, { cache: "no-store" }),
      ]);

      const json = await teamRes.json();
      const meetingsJson = await meetingsRes.json();

      setData(json);
      if (meetingsJson.ok) setMeetings(meetingsJson.meetings || []);
    } catch {
      setData({ ok: false, error: "Could not load team workspace." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, [teamId]);

  async function createMeeting() {
    if (!teamId || !meetingTitle.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${teamId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: meetingRoomId || rooms[0]?.id || null,
        title: meetingTitle,
        purpose: meetingPurpose,
        organizer: meetingOrganizer || "Organizer",
        meetingDate,
        meetingTime,
        durationMinutes: Number(meetingDuration || 60),
        languageMode: meetingLanguageMode,
        defaultLanguage: meetingLanguage,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not create meeting.");
      return;
    }

    setMeetings((prev) => [json.meeting, ...prev]);
    setMeetingTitle("");
    setMeetingPurpose("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingDuration("60");
    setMeetingLanguageMode("single");
    setMeetingLanguage("en");
    setMeetingRoomId("");
    setActionMessage(`Meeting created: ${json.meeting.meeting_code}`);
  }

  async function addMember() {
    if (!teamId) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: memberName,
        email: memberEmail,
        role: memberRole,
        preferredLanguage: memberLanguage,
        translationLanguage: memberLanguage,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not add member.");
      return;
    }

    setActionMessage(`Added member: ${json.member.display_name || json.member.email || "Member"}`);
    setMemberName("");
    setMemberEmail("");
    setMemberRole("viewer");
    setMemberLanguage("en");
    await loadTeam();
  }

  async function shareAsset() {
    if (!teamId) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${teamId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: assetTitle,
        assetType,
        sharedScope: "team",
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not share asset.");
      return;
    }

    setActionMessage(`Shared asset: ${json.asset.title}`);
    setAssetTitle("");
    setAssetType("report");
    await loadTeam();
  }

  async function createRoom() {
    if (!teamId) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${teamId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomName,
        roomType,
        defaultLanguage: roomLanguage,
        translationEnabled: roomTranslation,
        aiSummaryEnabled: roomAiSummary,
        description: `${roomType} room for team collaboration.`,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not create room.");
      return;
    }

    setActionMessage(`Created room: ${json.room.name}`);
    setRoomName("");
    setRoomType("team");
    setRoomLanguage("en");
    setRoomTranslation(true);
    setRoomAiSummary(true);
    await loadTeam();
  }

  const members = data?.members || [];
  const rooms = data?.rooms || [];
  const assets = data?.sharedAssets || [];
  const workspace = data?.workspaces?.[0];

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const role of roleOrder) counts[role] = 0;
    for (const member of members) counts[member.role] = (counts[member.role] || 0) + 1;
    return counts;
  }, [members]);

  if (loading) {
    return <main className="min-h-screen bg-[#070B12] p-8 text-slate-100">Loading team workspace...</main>;
  }

  if (!data?.ok || !data.team) {
    return (
      <main className="min-h-screen bg-[#070B12] p-8 text-slate-100">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
          {data?.error || "Team not found."}
        </div>
      </main>
    );
  }

  const team = data.team;

  return (
    <main className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <a href="/nexus/teams" className="mb-5 inline-block text-sm text-cyan-300 hover:text-cyan-100">
          ← Back to Teams
        </a>

        <section className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-7 shadow-2xl shadow-cyan-950/30">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Team Workspace
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{team.name}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">{team.description || "Shared Nexus team workspace."}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
              {team.translation_enabled ? "Translation-ready" : "Translation off"} ·{" "}
              {team.ai_summary_enabled ? "AI summary-ready" : "AI summary off"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Stat label="Members" value={members.length} />
            <Stat label="Rooms" value={rooms.length} />
            <Stat label="Shared Assets" value={assets.length} />
            <Stat label="Workspace" value={workspace ? 1 : 0} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Workspace Overview</h2>
            <p className="mt-2 text-sm text-slate-400">
              Shared foundation for files, reports, analytics, artifacts, rooms, meetings, notes, whiteboards, voice, translation, and AI meeting intelligence.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Capability title="Shared Files" status={workspace?.shared_files_enabled ? "Ready" : "Off"} />
              <Capability title="Shared Reports" status={workspace?.shared_reports_enabled ? "Ready" : "Off"} />
              <Capability title="Shared Analytics" status={workspace?.shared_analytics_enabled ? "Ready" : "Off"} />
              <Capability title="Shared Artifacts" status={workspace?.shared_artifacts_enabled ? "Ready" : "Off"} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Roles</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {roleOrder.map((role) => (
                <div key={role} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{role}</div>
                  <div className="mt-2 text-2xl font-bold text-cyan-200">{roleCounts[role] || 0}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Scheduler</h2>
          <p className="mt-2 text-sm text-slate-400">
            Organizer fills the meeting once. Participants only click the invite link to join or reserve their place.
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <input
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Meeting title"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <input
              value={meetingOrganizer}
              onChange={(e) => setMeetingOrganizer(e.target.value)}
              placeholder="Organizer"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <textarea
              value={meetingPurpose}
              onChange={(e) => setMeetingPurpose(e.target.value)}
              placeholder="Purpose of the meeting"
              className="min-h-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60 lg:col-span-2"
            />

            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <input
              type="number"
              min="5"
              value={meetingDuration}
              onChange={(e) => setMeetingDuration(e.target.value)}
              placeholder="Duration minutes"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <select
              value={meetingRoomId}
              onChange={(e) => setMeetingRoomId(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            >
              <option value="">Default room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>

            <select
              value={meetingLanguageMode}
              onChange={(e) => setMeetingLanguageMode(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            >
              <option value="single">Single-language meeting</option>
              <option value="multi">Multi-language meeting</option>
            </select>

            <select
              value={meetingLanguage}
              onChange={(e) => setMeetingLanguage(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>

            <button
              onClick={createMeeting}
              disabled={!meetingTitle.trim()}
              className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 lg:col-span-2"
            >
              Create Meeting + Invite Link
            </button>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Upcoming Meetings</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {meetings.length === 0 ? (
                <Empty text="No meetings scheduled yet." />
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-cyan-100">{meeting.title}</div>
                        <div className="mt-1 text-sm text-slate-400">{meeting.purpose || "No purpose provided"}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : "No date"} · {meeting.meeting_time || "No time"} · {meeting.duration_minutes} mins
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {meeting.meeting_status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                      <div>Code: {meeting.meeting_code}</div>
                      <div>Invite: {meeting.invite_link}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Add Member</h2>
            <p className="mt-2 text-sm text-slate-400">
              Invite or register a team member with role and preferred translation language.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Display name"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <input
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Email address"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                >
                  {roleOrder.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <select
                  value={memberLanguage}
                  onChange={(e) => setMemberLanguage(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={addMember}
                className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950"
              >
                Add Member
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Create Room</h2>
            <p className="mt-2 text-sm text-slate-400">
              Create team, meeting, voice, project, analytics, or artifact rooms.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                >
                  {roomTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={roomLanguage}
                  onChange={(e) => setRoomLanguage(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRoomTranslation(!roomTranslation)}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left"
                >
                  <div className="text-sm font-medium">Translation</div>
                  <div className="mt-1 text-xs text-cyan-200">{roomTranslation ? "Enabled" : "Disabled"}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomAiSummary(!roomAiSummary)}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left"
                >
                  <div className="text-sm font-medium">AI Summary</div>
                  <div className="mt-1 text-xs text-cyan-200">{roomAiSummary ? "Enabled" : "Disabled"}</div>
                </button>
              </div>

              <button
                onClick={createRoom}
                disabled={!roomName.trim()}
                className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Room
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Shared Assets</h2>
          <p className="mt-2 text-sm text-slate-400">
            Share files, reports, analytics, artifacts, dashboards, documents, and notes with this team.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_160px]">
            <input
              value={assetTitle}
              onChange={(e) => setAssetTitle(e.target.value)}
              placeholder="Asset title, e.g. Q3 Strategy Report"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            />

            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
            >
              {assetTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <button
              onClick={shareAsset}
              disabled={!assetTitle.trim()}
              className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Share Asset
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {assets.length === 0 ? (
              <Empty text="No shared assets yet." />
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{asset.title}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        Scope: {asset.shared_scope || "team"} · Shared by: {asset.shared_by || "local-user"}
                      </div>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                      {asset.asset_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {actionMessage ? (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {actionMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Members</h2>
            <div className="mt-4 space-y-3">
              {members.length === 0 ? (
                <Empty text="No members yet." />
              ) : (
                members.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{m.display_name || m.email || m.user_id || "Member"}</div>
                        <div className="text-sm text-slate-500">{m.email || m.user_id || "No email"}</div>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {m.role}
                      </span>
                    </div>
                    </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Rooms</h2>
            <div className="mt-4 space-y-3">
              {rooms.length === 0 ? (
                <Empty text="No rooms yet." />
              ) : (
                rooms.map((room) => (
                  <a
                    key={room.id}
                    href={`/nexus/teams/${teamId}/rooms/${room.id}`}
                    className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{room.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{room.description || "Team room"}</div>
                      </div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                        {room.room_type}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                      <Mini label="Chat" value={room.shared_chat_enabled ? "Ready" : "Off"} />
                      <Mini label="Notes" value={room.shared_notes_enabled ? "Ready" : "Off"} />
                      <Mini label="Whiteboard" value={room.whiteboard_enabled ? "Ready" : "Off"} />
                      <Mini label="Transcript" value={room.transcription_enabled ? "Ready" : "Off"} />
                      <Mini label="Translation" value={room.translation_enabled ? "Ready" : "Off"} />
                      <Mini label="AI Summary" value={room.ai_summary_enabled ? "Ready" : "Off"} />
                    </div>
                  </a>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Intelligence Foundation</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Capability title="Transcript" status="Foundation ready" />
            <Capability title="Summary" status="Foundation ready" />
            <Capability title="Decisions" status="Planned" />
            <Capability title="Action Items" status="Planned" />
            <Capability title="Commitments" status="Planned" />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Teams V1–V5 Capability Map</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Roadmap title="V1 Workspace" body="Team creation, members, roles, shared workspace, files, reports, analytics, artifacts." />
            <Roadmap title="V2 Meetings" body="Team rooms, meeting rooms, shared chat, notes, documents, whiteboard foundation." />
            <Roadmap title="V3 Voice" body="Voice rooms, multi-user calls, audio streams, meeting recording, transcription." />
            <Roadmap title="V4 Translation" body="Voice-to-voice, voice-to-text, text-to-voice, live meeting translation." />
            <Roadmap title="V5 AI Intelligence" body="Transcript, summary, decisions, action items, commitments, follow-up tasks." />
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

function Capability({ title, status }: { title: string; status: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-cyan-200">{status}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-200">{value}</div>
    </div>
  );
}

function Roadmap({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="font-bold text-cyan-200">{title}</div>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">{text}</div>;
}
