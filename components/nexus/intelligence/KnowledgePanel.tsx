"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RelationshipClusterCard from "./RelationshipClusterCard";

function cleanType(type: string) {
  return String(type || "knowledge").replace(/_/g, " ");
}

export default function KnowledgePanel() {
  const [data, setData] = useState<any>(null);
  const [clusterData, setClusterData] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");

  async function load() {
    try {
      const [knowledgeRes, clusterRes] = await Promise.all([
        fetch("/api/riomind/intelligence/knowledge?limit=100", { cache: "no-store" }),
        fetch("/api/riomind/intelligence/clusters?limit=100", { cache: "no-store" }),
      ]);

      setData(await knowledgeRes.json());
      setClusterData(await clusterRes.json());
    } catch {
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const groups = data?.summary?.groups || [];
  const nodes = data?.nodes || [];
  const clusters = clusterData?.clusters || [];

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return nodes.filter((node: any) => {
      const matchesType = activeType === "all" || node.node_type === activeType;

      const haystack = [
        node.node_type,
        node.node_key,
        node.title,
        node.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);

      return matchesType && matchesQuery;
    });
  }, [nodes, query, activeType]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Knowledge Nodes</div>
          <div className="mt-2 text-4xl font-black text-white">{nodes.length}</div>
        </div>

        <div className="rounded-3xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Node Types</div>
          <div className="mt-2 text-4xl font-black text-white">{groups.length}</div>
        </div>

        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Graph Edges</div>
          <div className="mt-2 text-4xl font-black text-white">{data?.summary?.edgeCount || 0}</div>
        </div>
      </section>


      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Relationship Clusters</div>
            <p className="mt-2 text-sm text-slate-400">
              RioMind groups connected knowledge nodes into intelligence objects so users can browse relationships instead of isolated records.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Clusters</div>
            <div className="mt-1 text-2xl font-black text-white">{clusters.length}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {clusters.slice(0, 6).map((cluster: any) => (
            <RelationshipClusterCard key={cluster.clusterId} cluster={cluster} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Knowledge Explorer</div>
            <p className="mt-2 text-sm text-slate-400">
              Search and filter RioMind Core knowledge nodes by title, type, description, and node key.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search knowledge: revenue, meeting, decision, risk, language..."
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveType("all")}
            className={[
              "rounded-full border px-3 py-2 text-xs font-bold transition",
              activeType === "all"
                ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]",
            ].join(" ")}
          >
            All · {nodes.length}
          </button>

          {groups.map((g: any) => (
            <button
              key={g.node_type}
              onClick={() => setActiveType(g.node_type)}
              className={[
                "rounded-full border px-3 py-2 text-xs font-bold transition",
                activeType === g.node_type
                  ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]",
              ].join(" ")}
            >
              {cleanType(g.node_type)} · {g.count}
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
          Showing {filteredNodes.length} of {nodes.length} visible nodes
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredNodes.map((node: any) => (
          <Link
            key={node.id}
            href={`/nexus/intelligence/evidence/${encodeURIComponent(node.node_type || "knowledge")}/${encodeURIComponent(node.node_key || node.id)}?metric=Revenue`}
            className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.035]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  {cleanType(node.node_type)}
                </div>
                <div className="mt-2 text-xl font-black text-white">{node.title || node.node_key}</div>
              </div>
              <div className="text-cyan-300">→</div>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">
              {node.description || "Knowledge node stored in RioMind Core."}
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Node Key</div>
              <div className="mt-2 break-all text-xs font-bold text-white">{node.node_key}</div>
            </div>
          </Link>
        ))}

        {!filteredNodes.length && (
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center text-sm text-slate-400">
            No knowledge nodes match this search/filter.
          </div>
        )}
      </section>
    </div>
  );
}
