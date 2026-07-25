"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import IntelligenceTrail from "@/components/nexus/intelligence/IntelligenceTrail";

function cleanType(type: string) {
  return String(type || "knowledge").replace(/_/g, " ");
}

function badgeClass(label: string) {
  if (label === "Critical") return "border-rose-300/25 bg-rose-300/10 text-rose-200";
  if (label === "High") return "border-amber-300/25 bg-amber-300/10 text-amber-200";
  if (label === "Medium") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";
  return "border-white/10 bg-white/5 text-slate-300";
}

function nodeHref(node: any) {
  return `/nexus/intelligence/evidence/${encodeURIComponent(node?.node_type || "knowledge")}/${encodeURIComponent(node?.node_key || node?.id || "node")}?metric=Revenue`;
}

export default function ClusterIntelligencePage() {
  const params = useParams();
  const clusterId = decodeURIComponent(String(params?.clusterId || ""));

  const [data, setData] = useState<any>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<any>(null);
  const [asking, setAsking] = useState(false);

  async function load() {
    try {
      const res = await fetch(
        `/api/riomind/intelligence/clusters/detail?clusterId=${encodeURIComponent(clusterId)}&limit=100`,
        { cache: "no-store" }
      );
      setData(await res.json());
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, [clusterId]);

  async function askRioMind(question: string) {
    const q = String(question || askQuestion || "").trim();
    if (!q || !cluster?.clusterId) return;

    setAsking(true);
    setAskAnswer(null);

    try {
      const res = await fetch("/api/riomind/intelligence/clusters/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          clusterId: cluster.clusterId,
          question: q,
        }),
      });

      const json = await res.json();
      setAskAnswer(json);
      setAskQuestion(q);
    } catch {
      setAskAnswer({
        ok: false,
        answer: "RioMind could not answer this cluster question yet.",
      });
    } finally {
      setAsking(false);
    }
  }


  const cluster = data?.cluster;
  const previewNodes = cluster?.previewNodes || [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),#020617] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(34,211,238,0.10)]">
          <Link href="/nexus/intelligence" className="text-sm font-bold text-cyan-300 hover:text-cyan-100">
            ← Back to Intelligence Center
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Cluster Intelligence</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">
                {cluster?.title || "Loading cluster..."}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Connected intelligence object generated from RioMind Knowledge Graph relationships.
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 ${badgeClass(cluster?.importance?.label)}`}>
              <div className="text-xs uppercase tracking-[0.18em] opacity-80">Importance</div>
              <div className="mt-1 text-2xl font-black">{cluster?.importance?.label || "—"}</div>
            </div>
          </div>
        </header>

        {cluster && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Nodes</div>
                <div className="mt-2 text-4xl font-black text-white">{cluster.counts?.nodes || 0}</div>
              </div>

              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">Decisions</div>
                <div className="mt-2 text-4xl font-black text-white">{cluster.counts?.decisions || 0}</div>
              </div>

              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-300">Actions</div>
                <div className="mt-2 text-4xl font-black text-white">{cluster.counts?.actions || 0}</div>
              </div>

              <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.06] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-rose-300">Risks</div>
                <div className="mt-2 text-4xl font-black text-white">{cluster.counts?.risks || 0}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Cluster Summary</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">{cluster.summary}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(cluster.memberTypes || []).map((member: any) => (
                  <span key={member.nodeType} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300">
                    {cleanType(member.nodeType)} · {member.count}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Executive Cluster Brief</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    RioMind interpretation of what this connected intelligence object means.
                  </p>
                </div>

                <div className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(cluster.importance?.label)}`}>
                  {cluster.importance?.label || "Informational"} importance
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">What this means</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {cluster.title} contains {cluster.counts?.nodes || 0} connected knowledge nodes across {cluster.memberTypes?.length || 0} node types.
                  RioMind classified this cluster as {cluster.importance?.label || "informational"} because it includes
                  {cluster.counts?.decisions || 0} decision(s), {cluster.counts?.actions || 0} action item(s), and {cluster.counts?.risks || 0} risk signal(s).
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Why it matters</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This cluster groups related knowledge so users can understand the full context instead of reading isolated nodes.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">What to review</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Review connected decisions, action items, risks, and the graph preview to understand downstream impact.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Next action</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Open key connected nodes and validate whether follow-up work, reporting, or team action is required.
                  </p>
                </div>
              </div>
            </section>


            <IntelligenceTrail
              items={[
                { type: cluster.type || "cluster", label: cluster.title },
                { type: "knowledge", label: "Knowledge Graph" },
                { type: "relationship", label: "Relationship Cluster" },
                { type: "evidence", label: "Evidence Detail" },
                { type: "briefing", label: "Executive Brief" },
              ]}
            />

            <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Connected Nodes</h2>

                <div className="mt-5 space-y-3">
                  {previewNodes.map((node: any) => (
                    <Link
                      key={node.id}
                      href={nodeHref(node)}
                      className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">{cleanType(node.node_type)}</div>
                          <div className="mt-2 font-bold text-white">{node.title || node.node_key}</div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{node.description}</p>
                        </div>
                        <div className="text-cyan-300">→</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Graph Preview</h2>

                <div className="mt-5 rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.03] p-5">
                  <div className="space-y-3">
                    {previewNodes.slice(0, 8).map((node: any, index: number) => (
                      <div key={`${node.id}-${index}`} className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-cyan-300">{index === 0 ? "●" : "↓"}</span>
                        <span>{node.title || node.node_key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Confidence</div>
                  <div className="mt-2 text-2xl font-black text-white">{cluster.confidence}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Confidence is based on connected node count and relationship density.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-6 shadow-[0_0_55px_rgba(34,211,238,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.28em] text-cyan-200">Ask RioMind</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    Ask cluster-scoped questions using this connected intelligence object, evidence, graph preview, decisions, actions, risks, and related clusters.
                  </p>
                </div>

                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  Live reasoning
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  "Why is this cluster important?",
                  "Summarize the connected decisions.",
                  "Show the risks in this cluster.",
                  "What action should we take next?",
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => askRioMind(question)}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05]"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                <input
                  value={askQuestion}
                  onChange={(event) => setAskQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") askRioMind(askQuestion);
                  }}
                  placeholder="Ask RioMind about this cluster..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-300 outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => askRioMind(askQuestion)}
                  disabled={asking}
                  className="rounded-xl bg-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/30 disabled:opacity-60"
                >
                  {asking ? "Thinking..." : "Ask"}
                </button>
              </div>

              {askAnswer?.answer && (
                <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    RioMind Executive Reasoning
                  </div>

                  <div className="mx-auto mt-5 max-w-5xl space-y-5">
                    <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/[0.055] p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Executive Summary</div>
                          <p className="mt-3 text-base leading-8 text-slate-200">
                            {askAnswer.reasoning?.executiveSummary || askAnswer.answer}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-emerald-300">Confidence</div>
                          <div className="mt-1 text-2xl font-black text-white">
                            {askAnswer.reasoning?.confidence?.label || askAnswer.context?.confidence || cluster?.confidence}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!!askAnswer.reasoning?.reasoning?.length && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Intelligence Timeline</div>
                        <div className="mt-5 space-y-0">
                          {askAnswer.reasoning.reasoning.map((item: string, index: number) => (
                            <div key={`${item}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                              {index < askAnswer.reasoning.reasoning.length - 1 && (
                                <div className="absolute left-[7px] top-5 h-full w-px bg-cyan-300/20" />
                              )}
                              <div className="relative mt-1 h-4 w-4 rounded-full border border-cyan-300/40 bg-cyan-300/20" />
                              <p className="text-sm leading-7 text-slate-300">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!askAnswer.reasoning?.evidenceUsed?.length && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Evidence Explorer</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {askAnswer.reasoning.evidenceUsed.slice(0, 8).map((item: any, index: number) => (
                            <div key={`${item.nodeKey || item.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <div className="text-xs uppercase tracking-[0.16em] text-cyan-300">{String(item.type || "evidence").replace(/_/g, " ")}</div>
                              <div className="mt-2 line-clamp-2 text-sm font-black text-white">{item.title}</div>
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/[0.04] p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">Confidence Explanation</div>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          {askAnswer.reasoning?.confidence?.explanation || "Confidence is based on the available cluster context."}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Cluster Context</div>
                        <div className="mt-2 text-sm font-black text-white">{askAnswer.context?.title || cluster?.title}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                          {askAnswer.context?.counts?.nodes || cluster?.counts?.nodes || 0} connected nodes · {askAnswer.context?.counts?.decisions || cluster?.counts?.decisions || 0} decisions · {askAnswer.context?.counts?.risks || cluster?.counts?.risks || 0} risks
                        </div>
                      </div>
                    </div>

                    {!!askAnswer.reasoning?.recommendations?.length && (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recommended Actions</div>
                        <div className="mt-4 grid gap-3">
                          {askAnswer.reasoning.recommendations.map((item: string, index: number) => (
                            <div key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                              <span className="text-cyan-300">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Related Questions</div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          "Which evidence matters most?",
                          "What risks remain unresolved?",
                          "Which action item should be prioritized?",
                          "Show downstream impact.",
                        ].map((question) => (
                          <button
                            key={question}
                            onClick={() => askRioMind(question)}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.05]"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>


            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Related Clusters</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(data?.relatedClusters || []).map((item: any) => (
                  <Link
                    key={item.clusterId}
                    href={`/nexus/intelligence/cluster/${encodeURIComponent(item.clusterId)}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{cleanType(item.type)}</div>
                    <div className="mt-2 font-bold text-white">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
