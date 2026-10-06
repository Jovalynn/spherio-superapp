"use client";

import MeetingAgentCard
from "./MeetingAgentCard";

import type {
  AIWorkspaceProps,
} from "./types";

export default function MeetingAgentsPanel({
  runtime,
}: AIWorkspaceProps) {

  return (

    <section className="space-y-6">

      <header>

        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
          Nexus Intelligence
        </div>

        <h2 className="mt-3 text-3xl font-black">
          Meeting AI Runtime
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          Live intelligence agents coordinating
          executive reasoning, planning,
          memory, workflow,
          replay,
          presenter coaching,
          and the meeting knowledge graph.
        </p>

      </header>

      <div className="grid gap-4 xl:grid-cols-2">

        {runtime.agents.map(agent => (

          <MeetingAgentCard
            key={agent.id}
            agent={agent}
          />

        ))}

      </div>

    </section>

  );

}
