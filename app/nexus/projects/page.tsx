"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type NexusProject = {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type NexusMemory = {
  id: string;
  projectId: string;
  memoryType: string;
  title: string;
  content: string;
  importance: number;
  source: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function NexusProjectsPage() {
  const [projects, setProjects] = useState<NexusProject[]>([]);
  const [activeProject, setActiveProject] = useState<NexusProject | null>(null);
  const [memories, setMemories] = useState<NexusMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryType, setMemoryType] = useState("note");
  const [importance, setImportance] = useState(3);

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/riomind/projects?limit=100", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "projects_failed");
      }

      const nextProjects = Array.isArray(data.projects) ? data.projects : [];
      setProjects(nextProjects);

      if (!activeProject && nextProjects.length > 0) {
        setActiveProject(nextProjects[0]);
      }
    } catch {
      setProjects([]);
      setError("Nexus could not load Project Memory yet.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMemories(projectId: string) {
    setMemoryLoading(true);

    try {
      const res = await fetch(`/api/riomind/projects/${projectId}/memories?limit=100`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "memories_failed");
      }

      setMemories(Array.isArray(data.memories) ? data.memories : []);
    } catch {
      setMemories([]);
      setError("Nexus could not load memories for this project.");
    } finally {
      setMemoryLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (activeProject?.id) {
      void loadMemories(activeProject.id);
    } else {
      setMemories([]);
    }
  }, [activeProject?.id]);

  async function createProject() {
    const name = newProjectName.trim();
    if (!name) return;

    setError(null);

    try {
      const res = await fetch("/api/riomind/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: newProjectDescription.trim(),
          status: "active",
          metadata: {
            source: "nexus_project_workspace",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "project_create_failed");
      }

      setNewProjectName("");
      setNewProjectDescription("");
      setProjects((current) => [data.project, ...current]);
      setActiveProject(data.project);
    } catch {
      setError("Nexus could not create this project.");
    }
  }

  async function saveMemory() {
    if (!activeProject) return;

    const title = memoryTitle.trim();
    const content = memoryContent.trim();

    if (!title || !content) return;

    setError(null);

    try {
      const res = await fetch(`/api/riomind/projects/${activeProject.id}/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          memoryType,
          importance,
          source: "manual",
          metadata: {
            source: "nexus_project_workspace",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "memory_create_failed");
      }

      setMemoryTitle("");
      setMemoryContent("");
      setMemoryType("note");
      setImportance(3);
      setMemories((current) => [data.memory, ...current]);
    } catch {
      setError("Nexus could not save this memory.");
    }
  }

  const memoryStats = useMemo(() => {
    return {
      total: memories.length,
      high: memories.filter((memory) => memory.importance >= 4).length,
      notes: memories.filter((memory) => memory.memoryType === "note").length,
    };
  }, [memories]);

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-cyan-300/15 bg-white/[0.035] p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/50">
              RioMind Nexus
            </div>
            <h1 className="mt-1 text-2xl font-black text-cyan-50 sm:text-3xl">
              Project Memory
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/45">
              Save project context, decisions, notes, and long-term workspace memory.
            </p>
          </div>

          <Link
            href="/riomind/chat"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18"
          >
            Back to Chat
          </Link>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-100">
            {error}
          </div>
        ) : null}

        <section className="grid flex-1 gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[28px] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-xl">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
              Projects
            </div>

            <div className="rounded-3xl border border-cyan-300/12 bg-black/24 p-3">
              <input
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="New project name"
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
              />

              <textarea
                value={newProjectDescription}
                onChange={(event) => setNewProjectDescription(event.target.value)}
                placeholder="Description"
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
              />

              <button
                type="button"
                onClick={() => void createProject()}
                disabled={!newProjectName.trim()}
                className="mt-2 w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create Project
              </button>
            </div>

            <div className="nexus-scrollbar mt-4 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/40">
                  Loading projects...
                </div>
              ) : projects.length ? (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      activeProject?.id === project.id
                        ? "border-cyan-300/28 bg-cyan-500/12"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-cyan-500/[0.06]"
                    }`}
                  >
                    <div className="truncate text-sm font-black text-cyan-50">{project.name}</div>
                    {project.description ? (
                      <div className="mt-1 line-clamp-2 text-xs font-semibold text-white/35">
                        {project.description}
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/40">
                  No projects yet.
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.025] p-4 backdrop-blur-xl sm:p-5">
            {activeProject ? (
              <>
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/45">
                      Active Project
                    </div>
                    <h2 className="mt-1 text-2xl font-black text-cyan-50">{activeProject.name}</h2>
                    {activeProject.description ? (
                      <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-white/45">
                        {activeProject.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-lg font-black text-cyan-50">{memoryStats.total}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/32">
                        Memories
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-lg font-black text-cyan-50">{memoryStats.high}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/32">
                        High
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-lg font-black text-cyan-50">{memoryStats.notes}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/32">
                        Notes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-5 rounded-3xl border border-cyan-300/12 bg-black/24 p-4">
                  <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                    Save Memory
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
                    <input
                      value={memoryTitle}
                      onChange={(event) => setMemoryTitle(event.target.value)}
                      placeholder="Memory title"
                      className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
                    />

                    <select
                      value={memoryType}
                      onChange={(event) => setMemoryType(event.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300/30"
                    >
                      <option value="note">Note</option>
                      <option value="decision">Decision</option>
                      <option value="roadmap">Roadmap</option>
                      <option value="task">Task</option>
                      <option value="requirement">Requirement</option>
                    </select>

                    <select
                      value={importance}
                      onChange={(event) => setImportance(Number(event.target.value))}
                      className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-cyan-300/30"
                    >
                      <option value={1}>Low</option>
                      <option value={3}>Normal</option>
                      <option value={5}>Critical</option>
                    </select>
                  </div>

                  <textarea
                    value={memoryContent}
                    onChange={(event) => setMemoryContent(event.target.value)}
                    placeholder="What should Nexus remember for this project?"
                    rows={5}
                    className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/30"
                  />

                  <button
                    type="button"
                    onClick={() => void saveMemory()}
                    disabled={!memoryTitle.trim() || !memoryContent.trim()}
                    className="mt-3 rounded-2xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save to Project Memory
                  </button>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                      Memories
                    </div>
                    <div className="text-xs font-bold text-white/32">
                      {memoryLoading ? "Loading..." : `${memories.length} saved`}
                    </div>
                  </div>

                  <div className="nexus-scrollbar max-h-[48vh] space-y-3 overflow-y-auto pr-1">
                    {memories.length ? (
                      memories.map((memory) => (
                        <article
                          key={memory.id}
                          className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-cyan-300/16 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                              {memory.memoryType}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold text-white/35">
                              Importance {memory.importance}/5
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-black text-cyan-50">{memory.title}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-white/50">
                            {memory.content}
                          </p>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-8 text-center">
                        <div className="text-4xl">🧠</div>
                        <h3 className="mt-3 text-lg font-black text-cyan-50">No project memories yet</h3>
                        <p className="mt-2 text-sm font-semibold text-white/40">
                          Save decisions, notes, tasks, requirements, and roadmap context here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-10 text-center">
                <div className="text-5xl">🧠</div>
                <h2 className="mt-4 text-xl font-black text-cyan-50">Select or create a project</h2>
                <p className="mt-2 text-sm font-semibold text-white/40">
                  Project Memory gives Nexus persistent context across chats, files, and artifacts.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
