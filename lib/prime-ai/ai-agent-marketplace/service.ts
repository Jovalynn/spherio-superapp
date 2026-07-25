export type AiAgentMarketplaceAgent = {
  id: string;
  name: string;
  category: string;
  status: "draft" | "listed" | "installed" | "running" | "paused";
};

export function describeAiAgentMarketplaceRuntime() {
  return {
    product: "AI Agent Marketplace",
    modules: [
      "Agent registry",
      "Agent install service",
      "Agent execution router",
      "Publisher payout service",
      "Agent review service",
    ],
    rioMindNexusHooks: [
      "Agent recommendation engine",
      "Agent capability reviewer",
      "Workflow execution assistant",
      "Publisher onboarding assistant",
    ],
  };
}
