"use client";

import { useEffect, useMemo, useState } from "react";

type LiveIntel = {
  counts?: {
    sessions?: number;
    transcriptEntries?: number;
    speakers?: number;
    sourceLanguages?: number;
    targetLanguages?: number;
    decisions?: number;
  };
  speakers?: string[];
  languageCoverage?: {
    configuredTargets?: string[];
    sourceLanguages?: string[];
    targetLanguages?: string[];
  };
  topics?: string[];
  risks?: string[];
  liveSummary?: string;
  transcriptPreview?: string;
};

export default function NexusTeamsLiveIntelligencePanel({
  meetingCode,
}: {
  meetingCode: string;
}) {
  const [data, setData] = useState<LiveIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const targets = useMemo(() => "de,fr,zh,yo,ig,ha,ar,es,pt,sw", []);

  async function loadLiveIntel() {
    if (!meetingCode) return;

    setLoading(true);
    try {
      const [intelRes, tasksRes] = await Promise.all([
        fetch(`/api/riomind/meetings/${meetingCode}/live-intelligence?targets=${targets}`, {
          cache: "no-store",
        }),
        fetch(`/api/riomind/meetings/${meetingCode}/tasks`, {
          cache: "no-store",
        }),
      ]);

      const intelJson = await intelRes.json();
      const tasksJson = await tasksRes.json();

      setData(intelJson?.intelligence || null);
      setTasks(Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : []);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiveIntel();
    const timer = window.setInterval(loadLiveIntel, 15000);
    return () => window.clearInterval(timer);
  }, [meetingCode]);

  return (
    <section className="mt-5 rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-4 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
            Nexus Live AI
          </p>
          <h3 className="text-lg font-semibold">Meeting Intelligence</h3>
        </div>

        <button
          type="button"
          onClick={loadLiveIntel}
          className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100 hover:bg-cyan-300/10"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 text-sm">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            Live Summary
          </p>
          <p className="text-slate-100">
            {data?.liveSummary || "No live meeting intelligence captured yet."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs text-slate-400">Voice sessions</p>
            <p className="text-xl font-semibold">{data?.counts?.sessions ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs text-slate-400">Transcript entries</p>
            <p className="text-xl font-semibold">{data?.counts?.transcriptEntries ?? 0}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Speakers
          </p>
          <div className="flex flex-wrap gap-2">
            {(data?.speakers?.length ? data.speakers : ["No speaker labels yet"]).map((speaker) => (
              <span key={speaker} className="rounded-full bg-slate-800 px-2 py-1 text-xs">
                {speaker}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Topics
          </p>
          <div className="flex flex-wrap gap-2">
            {(data?.topics?.length ? data.topics : ["No topics yet"]).map((topic) => (
              <span key={topic} className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-100">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Risks
          </p>
          <ul className="space-y-1 text-xs text-amber-100">
            {(data?.risks?.length ? data.risks : ["No risks detected."]).map((risk) => (
              <li key={risk}>• {risk}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Decisions
          </p>
          <ul className="space-y-1 text-xs text-cyan-100">
            {((data as any)?.decisions?.length ? (data as any).decisions : ["No decisions detected yet."]).map((decision: string) => (
              <li key={decision}>• {decision}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Action Items
          </p>
          <ul className="space-y-1 text-xs text-emerald-100">
            {((data as any)?.actionItems?.length ? (data as any).actionItems : ["No action items detected yet."]).map((item: string) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Meeting Tasks
            </p>
            <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-100">
              {tasks.length} task{tasks.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-2">
            {tasks.length ? (
              tasks.map((task) => (
                <div key={task.taskKey || task.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-slate-100">
                    {task.actionText || task.title || "Meeting task"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="rounded-full bg-slate-800 px-2 py-1">
                      Status: {task.status || "created"}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-1">
                      Runs: {task.workflowRuns?.length || 0}
                    </span>
                    {task.graphNode ? (
                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-100">
                        KG linked
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                No workflow tasks have been created from this meeting yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            Live Transcript
          </p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-200">
            {data?.transcriptPreview || "No transcript captured yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}
