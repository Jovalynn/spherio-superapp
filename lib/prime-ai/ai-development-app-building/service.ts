export type AiBuilderProject = {
  id: string;
  name: string;
  template: string;
  status: "draft" | "building" | "deployment_ready" | "live";
};

export function describeAiBuilderRuntime() {
  return {
    product: "AI Development & App Building",
    modules: [
      "AI model router",
      "Usage credit service",
      "App template service",
      "Deployment registry",
      "Developer API key management",
    ],
    rioMindNexusHooks: [
      "Prompt-to-app assistant",
      "Architecture generator",
      "Model selection advisor",
      "Deployment checklist assistant",
    ],
  };
}
