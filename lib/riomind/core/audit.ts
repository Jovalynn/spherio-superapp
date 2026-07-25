import { RIOMIND_CORE_CAPABILITIES } from "./capabilities";
import { RIOMIND_PROVIDER_REGISTRY } from "../providers/registry";
import { RIOMIND_AGENT_REGISTRY } from "../agents/registry";
import { RIOMIND_KNOWLEDGE_REGISTRY } from "../knowledge/registry";
import { RIOMIND_TOOL_REGISTRY } from "../tools/registry";
import { RIOMIND_MEMORY_REGISTRY } from "../memory/registry";

export const RIOMIND_FOUNDATION_AUDIT = {
  status: "healthy",

  capabilities: RIOMIND_CORE_CAPABILITIES.length,

  providers: RIOMIND_PROVIDER_REGISTRY.length,

  agents: RIOMIND_AGENT_REGISTRY.length,

  knowledgeSources: RIOMIND_KNOWLEDGE_REGISTRY.length,

  tools: RIOMIND_TOOL_REGISTRY.length,

  memorySystems: RIOMIND_MEMORY_REGISTRY.length,
};
