export type ScienceVirtualLabExperiment = {
  id: string;
  subject: "physics" | "chemistry" | "biology" | "engineering";
  title: string;
  status: "draft" | "ready" | "running" | "reported";
};

export function describeScienceVirtualLabRuntime() {
  return {
    product: "Science & Virtual Lab Platform",
    modules: [
      "Experiment registry",
      "Simulation orchestration",
      "Scientific model explanation",
      "Dataset viewer",
      "Lab report generator",
    ],
    rioMindNexusHooks: [
      "Experiment explainer",
      "Simulation setup assistant",
      "Scientific calculation assistant",
      "Lab report assistant",
    ],
  };
}
