"use client";

import AgentStatusBadge from "./AgentStatusBadge";
import type {
  AgentCardProps,
} from "./types";

export default function MeetingAgentCard({
  agent,
}: AgentCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050b12]/40 p-4 transition hover:border-cyan-300/30">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <span className="text-xl">
              {agent.icon}
            </span>

            <h3 className="font-semibold">
              {agent.name}
            </h3>

          </div>

          <p className="mt-2 text-xs text-slate-400 leading-6">
            {agent.description}
          </p>

        </div>

        <AgentStatusBadge
          status={agent.status}
        />

      </div>

      <div className="mt-4 flex flex-wrap gap-2">

        {agent.capabilities.map(
          capability => (
            <span
              key={capability}
              className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300"
            >
              {capability}
            </span>
          )
        )}

      </div>

    </div>
  );
}
