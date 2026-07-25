import { NextResponse } from "next/server";

import { RIOMIND_CORE_CAPABILITIES } from "@/lib/riomind/core/capabilities";
import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";
import { RIOMIND_AGENT_REGISTRY } from "@/lib/riomind/agents/registry";
import { RIOMIND_KNOWLEDGE_REGISTRY } from "@/lib/riomind/knowledge/registry";
import { RIOMIND_TOOL_REGISTRY } from "@/lib/riomind/tools/registry";
import { RIOMIND_MEMORY_REGISTRY } from "@/lib/riomind/memory/registry";

export async function GET() {
  return NextResponse.json({
    ok: true,

    platform: "RioMind",

    version: "riomind_foundation_v1",

    nexusStatus: "foundation_ready",

    summary: {
      capabilities: RIOMIND_CORE_CAPABILITIES.length,
      providers: RIOMIND_PROVIDER_REGISTRY.length,
      agents: RIOMIND_AGENT_REGISTRY.length,
      knowledgeSources: RIOMIND_KNOWLEDGE_REGISTRY.length,
      tools: RIOMIND_TOOL_REGISTRY.length,
      memorySystems: RIOMIND_MEMORY_REGISTRY.length,
    },

    capabilities: RIOMIND_CORE_CAPABILITIES,

    providers: RIOMIND_PROVIDER_REGISTRY,

    agents: RIOMIND_AGENT_REGISTRY,

    knowledgeSources: RIOMIND_KNOWLEDGE_REGISTRY,

    tools: RIOMIND_TOOL_REGISTRY,

    memorySystems: RIOMIND_MEMORY_REGISTRY,
  });
}
