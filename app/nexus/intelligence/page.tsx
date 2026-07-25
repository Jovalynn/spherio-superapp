"use client";

import { useEffect, useState } from "react";
import OverviewPanel from "@/components/nexus/intelligence/OverviewPanel";
import ComingSoonPanel from "@/components/nexus/intelligence/ComingSoonPanel";
import KPIPanel from "@/components/nexus/intelligence/KPIPanel";
import TrendsPanel from "@/components/nexus/intelligence/TrendsPanel";
import DocumentsPanel from "@/components/nexus/intelligence/DocumentsPanel";
import MemoryPanel from "@/components/nexus/intelligence/MemoryPanel";
import KnowledgePanel from "@/components/nexus/intelligence/KnowledgePanel";
import ReportsPanel from "@/components/nexus/intelligence/ReportsPanel";

type IntelligenceOverview = {
  ok: boolean;
  generatedAt?: string;
  summary?: Record<string, number>;
  kpiDashboard?: any;
  latestIntelligence?: Array<any>;
  recentDocuments?: Array<any>;
  memoryHighlights?: Array<any>;
};

const tabs = ["Overview", "KPIs", "Trends", "Documents", "Memory", "Knowledge", "Reports"];

export default function NexusIntelligencePage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<IntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch("/api/riomind/intelligence/overview?limit=8", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ ok: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
    const timer = window.setInterval(loadOverview, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_30%),#020617] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(34,211,238,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">RioMind Nexus</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">Intelligence Center</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Live view of RioMind Core knowledge, memory, documents, KPIs, trends, and latest organizational intelligence.
              </p>
            </div>
            <button
              onClick={loadOverview}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-300/15"
            >
              {loading ? "Refreshing..." : "Refresh intelligence"}
            </button>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition",
                  activeTab === tab
                    ? "bg-cyan-300/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === "Overview" && (
          <OverviewPanel data={data || {}} />
        )}

        {activeTab === "KPIs" && (
          <KPIPanel dashboard={data?.kpiDashboard} />
        )}

        {activeTab === "Trends" && (
          <TrendsPanel dashboard={data?.kpiDashboard} />
        )}

        {activeTab === "Documents" && (
          <DocumentsPanel documents={data?.recentDocuments} />
        )}

        {activeTab === "Memory" && (
          <MemoryPanel memories={data?.memoryHighlights || []} />
        )}

        {activeTab === "Knowledge" && (
          <KnowledgePanel />
        )}

        {activeTab === "Reports" && (
          <ReportsPanel data={data} />
        )}

        {!["Overview","KPIs","Trends","Documents","Memory","Knowledge","Reports"].includes(activeTab) && (
          <ComingSoonPanel title={activeTab} />
        )}
      </div>
    </main>
  );
}
