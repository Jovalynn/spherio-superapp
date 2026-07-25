"use client";

import { useEffect, useState } from "react";

export default function RoomWorkspacePage({
  params,
}: {
  params: Promise<{ teamId: string; roomId: string }>;
}) {
  const [ids, setIds] = useState<{ teamId: string; roomId: string } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [noteTitle, setNoteTitle] = useState("Meeting Notes");
  const [noteBody, setNoteBody] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [decisions, setDecisions] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);

  const [decisionText, setDecisionText] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");

  const [actionTitle, setActionTitle] = useState("");
  const [actionAssignee, setActionAssignee] = useState("");
  const [actionDescription, setActionDescription] = useState("");

  const [commitmentText, setCommitmentText] = useState("");
  const [commitmentOwner, setCommitmentOwner] = useState("");

  useEffect(() => {
    params.then(setIds);
  }, [params]);

  async function loadRoom() {
    if (!ids) return;
    setLoading(true);

    try {
      const [
        roomRes,
        messagesRes,
        notesRes,
        decisionsRes,
        actionItemsRes,
        commitmentsRes,
      ] = await Promise.all([
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/messages`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/notes`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/decisions`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/action-items`, { cache: "no-store" }),
        fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/commitments`, { cache: "no-store" }),
      ]);

      const roomJson = await roomRes.json();
      const messagesJson = await messagesRes.json();
      const notesJson = await notesRes.json();
      const decisionsJson = await decisionsRes.json();
      const actionItemsJson = await actionItemsRes.json();
      const commitmentsJson = await commitmentsRes.json();

      setData(roomJson);
      if (messagesJson.ok) setMessages(messagesJson.messages || []);
      if (notesJson.ok) setNotes(notesJson.notes || []);
      if (decisionsJson.ok) setDecisions(decisionsJson.decisions || []);
      if (actionItemsJson.ok) setActionItems(actionItemsJson.actionItems || []);
      if (commitmentsJson.ok) setCommitments(commitmentsJson.commitments || []);
    } catch {
      setData({ ok: false, error: "Could not load room workspace." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
  }, [ids]);

  async function sendMessage() {
    if (!ids || !chatText.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderName: "Local User",
        message: chatText,
        sourceLanguage: data?.room?.default_language || "en",
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not send message.");
      return;
    }

    setChatText("");
    setMessages((prev) => [...prev, json.message]);
    setActionMessage("Message sent.");
  }

  async function saveNote() {
    if (!ids || !noteBody.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: noteTitle || "Meeting Notes",
        body: noteBody,
        noteType: "meeting",
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      setActionMessage(json.error || "Could not save note.");
      return;
    }

    setNoteTitle("Meeting Notes");
    setNoteBody("");
    setNotes((prev) => [json.note, ...prev]);
    setActionMessage("Note saved.");
  }

  async function saveDecision() {
    if (!ids || !decisionText.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: decisionText, rationale: decisionRationale }),
    });

    const json = await res.json();
    if (!json.ok) {
      setActionMessage(json.error || "Could not save decision.");
      return;
    }

    setDecisions((prev) => [json.decision, ...prev]);
    setDecisionText("");
    setDecisionRationale("");
    setActionMessage("Decision saved.");
  }

  async function saveActionItem() {
    if (!ids || !actionTitle.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/action-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: actionTitle,
        assignee: actionAssignee,
        description: actionDescription,
        priority: "normal",
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      setActionMessage(json.error || "Could not save action item.");
      return;
    }

    setActionItems((prev) => [json.actionItem, ...prev]);
    setActionTitle("");
    setActionAssignee("");
    setActionDescription("");
    setActionMessage("Action item saved.");
  }

  async function saveCommitment() {
    if (!ids || !commitmentText.trim()) return;
    setActionMessage("");

    const res = await fetch(`/api/riomind/teams/${ids.teamId}/rooms/${ids.roomId}/commitments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitment: commitmentText, owner: commitmentOwner }),
    });

    const json = await res.json();
    if (!json.ok) {
      setActionMessage(json.error || "Could not save commitment.");
      return;
    }

    setCommitments((prev) => [json.commitment, ...prev]);
    setCommitmentText("");
    setCommitmentOwner("");
    setActionMessage("Commitment saved.");
  }

  if (loading) {
    return <main className="min-h-screen bg-[#070B12] p-8 text-slate-100">Loading room workspace...</main>;
  }

  if (!data?.ok || !data.room || !ids) {
    return (
      <main className="min-h-screen bg-[#070B12] p-8 text-slate-100">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
          {data?.error || "Room not found."}
        </div>
      </main>
    );
  }

  const { team, room, assets, intelligence } = data;

  return (
    <main className="min-h-screen bg-[#070B12] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <a href={`/nexus/teams/${ids.teamId}`} className="mb-5 inline-block text-sm text-cyan-300 hover:text-cyan-100">
          ← Back to Team Workspace
        </a>

        <section className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-7 shadow-2xl shadow-cyan-950/30">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Room Workspace
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{room.name}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                {room.description || "Shared room for team collaboration."}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Team: {team?.name || "Team"} · Type: {room.room_type} · Language: {room.default_language}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
              {room.translation_enabled ? "Translation-ready" : "Translation off"} ·{" "}
              {room.ai_summary_enabled ? "AI summary-ready" : "AI summary off"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Stat label="Shared Chat" value={room.shared_chat_enabled ? "Ready" : "Off"} />
            <Stat label="Notes" value={room.shared_notes_enabled ? "Ready" : "Off"} />
            <Stat label="Whiteboard" value={room.whiteboard_enabled ? "Ready" : "Off"} />
            <Stat label="Assets" value={String(assets?.length || 0)} />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Shared Chat" subtitle="Room-level conversation with persisted history.">
            <div className="space-y-3">
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <Empty text="No messages yet. Start the room conversation." />
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-cyan-100">{msg.sender_name || "Member"}</div>
                        <div className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</div>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{msg.message}</p>
                      <div className="mt-2 text-xs text-slate-500">Language: {msg.source_language || "en"}</div>
                    </div>
                  ))
                )}
              </div>

              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Send a message to this room..."
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />

              <button
                onClick={sendMessage}
                disabled={!chatText.trim()}
                className="w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </Panel>

          <Panel title="Shared Notes" subtitle="Create meeting notes and preserve room memory.">
            <div className="space-y-3">
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />

              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Write meeting notes, decisions, action items, or context..."
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />

              <button
                onClick={saveNote}
                disabled={!noteBody.trim()}
                className="w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Note
              </button>

              <div className="mt-4 space-y-3">
                {notes.length === 0 ? (
                  <Empty text="No notes yet." />
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-cyan-100">{note.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</div>
                        </div>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                          {note.note_type}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{note.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Shared Documents" subtitle="Documents and room artifacts.">
            <Empty text="Document linking and room assets come next." />
          </Panel>

          <Panel title="Shared Assets" subtitle="Team and room assets visible to this room.">
            <div className="space-y-3">
              {assets?.length ? (
                assets.map((asset: any) => (
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
              ) : (
                <Empty text="No room assets yet." />
              )}
            </div>
          </Panel>
        </div>

        {actionMessage ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {actionMessage}
          </div>
        ) : null}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Meeting Intelligence</h2>
          <p className="mt-2 text-sm text-slate-400">
            Foundation for transcript, summary, decisions, action items, commitments, and follow-up tasks.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Intel title="Transcript" value={intelligence?.transcript ? "Ready" : "Foundation"} />
            <Intel title="Summary" value={intelligence?.summary ? "Ready" : "Foundation"} />
            <Intel title="Decisions" value={`${decisions.length}`} />
            <Intel title="Action Items" value={`${actionItems.length}`} />
            <Intel title="Commitments" value={`${commitments.length}`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold">Add Decision</h3>
              <textarea
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                placeholder="What decision was made?"
                className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <input
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                placeholder="Why was this decided?"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <button onClick={saveDecision} disabled={!decisionText.trim()} className="mt-3 w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                Save Decision
              </button>

              <div className="mt-4 space-y-3">
                {decisions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-semibold text-cyan-100">{item.decision}</div>
                    {item.rationale ? <div className="mt-1 text-xs text-slate-400">{item.rationale}</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold">Add Action Item</h3>
              <input
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="Action item"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <input
                value={actionAssignee}
                onChange={(e) => setActionAssignee(e.target.value)}
                placeholder="Assignee"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <textarea
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Details"
                className="mt-3 min-h-20 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <button onClick={saveActionItem} disabled={!actionTitle.trim()} className="mt-3 w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                Save Action
              </button>

              <div className="mt-4 space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-semibold text-cyan-100">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.assignee ? `Assignee: ${item.assignee}` : "Unassigned"} · {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold">Add Commitment</h3>
              <textarea
                value={commitmentText}
                onChange={(e) => setCommitmentText(e.target.value)}
                placeholder="What commitment was made?"
                className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <input
                value={commitmentOwner}
                onChange={(e) => setCommitmentOwner(e.target.value)}
                placeholder="Owner"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60"
              />
              <button onClick={saveCommitment} disabled={!commitmentText.trim()} className="mt-3 w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                Save Commitment
              </button>

              <div className="mt-4 space-y-3">
                {commitments.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="font-semibold text-cyan-100">{item.commitment}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.owner ? `Owner: ${item.owner}` : "No owner"} · {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Voice + Translation Layer</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Intel title="Voice Session" value={room.room_type === "voice" || room.room_type === "meeting" ? "Ready foundation" : "Available later"} />
            <Intel title="Live Translation" value={room.translation_enabled ? "Ready foundation" : "Disabled"} />
            <Intel title="AI Summary" value={room.ai_summary_enabled ? "Ready foundation" : "Disabled"} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-xl font-bold text-cyan-200">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function Intel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-cyan-200">{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 p-5 text-slate-400">{text}</div>;
}
