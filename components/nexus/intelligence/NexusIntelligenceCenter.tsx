"use client";

import { useNexusIntelligence } from "@/hooks/useNexusIntelligence";

function Pill({ children, tone = "cyan" }: { children: any; tone?: "cyan" | "emerald" | "amber" | "rose" | "slate" }) {
  const tones = {
    cyan: "bg-cyan-400/10 text-cyan-100 border-cyan-300/20",
    emerald: "bg-emerald-400/10 text-emerald-100 border-emerald-300/20",
    amber: "bg-amber-400/10 text-amber-100 border-amber-300/20",
    rose: "bg-rose-400/10 text-rose-100 border-rose-300/20",
    slate: "bg-slate-700/40 text-slate-200 border-white/10",
  };

  return <span className={`rounded-full border px-2 py-1 text-[10px] ${tones[tone]}`}>{children}</span>;
}

function Card({ title, children, className = "" }: { title: string; children: any; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-lg ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg bg-white/5 p-1.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="mt-0.5 text-xs font-bold text-white">{value}</div>
    </div>
  );
}

export default function NexusIntelligenceCenter(props: any) {
  const { loading, intelligence } = useNexusIntelligence(props);

  const i = intelligence || {};
  const topics = i.knowledge?.topics || [];
  const entities = i.knowledge?.entities || [];
  const facts = i.knowledge?.facts || [];
  const decisions = i.decisions || [];
  const actionItems = i.actionItems || [];
  const tasks = i.tasks || [];
  const agents = i.agents || [];
  const memory = i.memory || {};
  const risks = i.summary?.risks || [];

  const runningTasks = tasks.filter((t: any) => ["running", "in_progress"].includes(String(t.status || "").toLowerCase())).length;
  const createdTasks = tasks.filter((t: any) => String(t.status || "").toLowerCase() === "created").length;

  return (
    <aside className="rounded-3xl border border-cyan-300/20 bg-[#06111d]/95 p-3 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-300">RioMind Core</div>
          <h2 className="mt-1 text-sm font-black text-white">Nexus Intelligence Center</h2>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-100">
          Live
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Loading RioMind Core intelligence...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <Card title="Summary">
            <p className="text-xs leading-relaxed text-slate-200">
              {i.summary?.text || "No summary available yet."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat label="Transcript entries" value={i.summary?.transcriptEntries || 0} />
              <MiniStat label="Speakers" value={i.summary?.speakers?.length || 0} />
            </div>
          </Card>

          <Card title="Knowledge Graph">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Nodes" value={memory.graphNodeCount || 0} />
              <MiniStat label="Edges" value={memory.graphEdgeCount || 0} />
              <MiniStat label="Topics" value={topics.length} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.length ? topics.slice(0, 8).map((topic: string) => (
                <Pill key={topic}>{topic}</Pill>
              )) : <Pill tone="slate">No topics yet</Pill>}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {entities.length} linked entities · {facts.length} graph relationships
            </div>
          </Card>

          <Card title="Reasoning">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold text-slate-300">Decisions ({decisions.length})</div>
                <div className="space-y-1 text-xs text-slate-200">
                  {decisions.length ? decisions.slice(0, 3).map((d: any, idx: number) => (
                    <div key={idx}>✓ {typeof d === "string" ? d : d.title || d.description}</div>
                  )) : <div className="text-slate-500">No decisions detected.</div>}
                </div>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-semibold text-slate-300">Risks ({risks.length})</div>
                <div className="space-y-1 text-xs text-amber-100">
                  {risks.length ? risks.slice(0, 3).map((risk: string, idx: number) => (
                    <div key={idx}>⚠ {risk}</div>
                  )) : <div className="text-slate-500">No risks detected.</div>}
                </div>
              </div>

              <div className="text-[11px] text-emerald-100">
                {facts.length} graph facts available for retrieval.
              </div>
            </div>
          </Card>

          <Card title="Execution">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Tasks" value={tasks.length} />
              <MiniStat label="Created" value={createdTasks} />
              <MiniStat label="Running" value={runningTasks} />
            </div>

            <div className="mt-3 space-y-2">
              {tasks.length ? tasks.slice(0, 4).map((task: any) => (
                <div key={task.taskKey || task.id} className="rounded-xl border border-white/10 bg-black/25 p-2">
                  <div className="text-xs font-semibold text-white">{task.actionText || task.title || "Meeting task"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill tone="emerald">{task.status || "created"}</Pill>
                    <Pill tone="slate">{task.workflowRuns?.length || 0} runs</Pill>
                    {task.graphNode ? <Pill tone="cyan">KG linked</Pill> : null}
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-500">No workflow tasks created yet.</div>
              )}
            </div>
          </Card>

          <Card title="Memory">
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Graph" value={memory.graphUpdated ? "Updated" : "Pending"} />
              <MiniStat label="Search" value={memory.searchIndexed ? "Indexed" : "Pending"} />
              <MiniStat label="Knowledge" value={memory.knowledgeLinked ? "Linked" : "Pending"} />
              <MiniStat label="Meeting" value={memory.meetingCode || "—"} />
            </div>
          </Card>

          <Card title="Search (KG)">
            <div className="rounded-xl border border-white/10 bg-black/25 p-2 text-xs text-slate-400">
              Enterprise Search placeholder is active. Current backing source: Knowledge Graph.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.slice(0, 5).map((topic: string) => <Pill key={topic} tone="slate">{topic}</Pill>)}
            </div>
          </Card>

          <Card title="Agents">
            <div className="space-y-1">
              {agents.map((agent: any) => (
                <div key={agent.name} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-2 text-xs">
                  <span className="text-slate-200">{agent.name}</span>
                  <Pill tone={agent.status === "running" ? "emerald" : agent.status === "ready" ? "cyan" : "slate"}>
                    {agent.status}
                  </Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </aside>
  );
}
