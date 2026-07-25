export type RioMindExecutionStatus =
  | "planned"
  | "ready"
  | "pending_provider_connection"
  | "pending_tool_connection"
  | "pending_memory_connection"
  | "blocked"
  | "active";

export type RioMindExecutionLayer =
  | "provider_execution"
  | "tool_execution"
  | "memory_execution"
  | "artifact_execution"
  | "repository_ingestion"
  | "terminal_execution"
  | "image_execution"
  | "orchestration_execution";

export type RioMindExecutionContract = {
  id: string;
  layer: RioMindExecutionLayer;
  title: string;
  description: string;
  status: RioMindExecutionStatus;
  dependsOn: string[];
  unlocks: string[];
};

export const RIOMIND_EXECUTION_CONTRACTS: RioMindExecutionContract[] = [
  {
    id: "provider_runtime",
    layer: "provider_execution",
    title: "Live Provider Runtime",
    description: "Connects RioMind Nexus to live model providers.",
    status: "pending_provider_connection",
    dependsOn: ["provider_registry", "agent_registry", "routing_runtime"],
    unlocks: ["live_chat_responses", "multi_provider_orchestration", "provider_fallback"],
  },
  {
    id: "tool_runtime",
    layer: "tool_execution",
    title: "Live Tool Runtime",
    description: "Executes registered Nexus tools including code, repository, terminal, document, image, and data tools.",
    status: "pending_tool_connection",
    dependsOn: ["tool_registry", "execution_contracts"],
    unlocks: ["artifact_generation", "repository_ingestion", "terminal_execution", "image_generation"],
  },
  {
    id: "session_memory_runtime",
    layer: "memory_execution",
    title: "Persistent Session and Memory Runtime",
    description: "Persists RioMind conversations, project memory, workspace memory, and long-term memory.",
    status: "pending_memory_connection",
    dependsOn: ["memory_registry", "chat_runtime"],
    unlocks: ["long_term_memory", "project_context", "workspace_continuity"],
  },
  {
    id: "artifact_runtime",
    layer: "artifact_execution",
    title: "Artifact and File Generation Runtime",
    description: "Creates documents, generated files, structured outputs, code artifacts, and future workspace files.",
    status: "planned",
    dependsOn: ["tool_runtime", "document_editor", "artifact_generation"],
    unlocks: ["document_output", "file_output", "workspace_artifacts"],
  },
  {
    id: "repository_ingestion_runtime",
    layer: "repository_ingestion",
    title: "Repository Ingestion Runtime",
    description: "Reads and indexes repositories, file trees, codebases, package files, logs, and project structure.",
    status: "planned",
    dependsOn: ["tool_runtime", "repository_analyzer", "github_connector", "file_reader"],
    unlocks: ["codebase_analysis", "patch_planning", "architecture_review"],
  },
  {
    id: "terminal_execution_runtime",
    layer: "terminal_execution",
    title: "Terminal and Code Execution Runtime",
    description: "Provides controlled terminal guidance and later sandboxed command execution for build/test/debug workflows.",
    status: "planned",
    dependsOn: ["tool_runtime", "terminal_assistant", "test_runner", "code_workspace"],
    unlocks: ["build_debugging", "test_execution", "safe_terminal_workflows"],
  },
  {
    id: "image_generation_runtime",
    layer: "image_execution",
    title: "Image Generation and Multimodal Runtime",
    description: "Connects image generation, image analysis, screenshot understanding, visual design, and multimodal reasoning.",
    status: "planned",
    dependsOn: ["tool_runtime", "image_generation", "image_analysis", "multimodal_reasoning"],
    unlocks: ["image_output", "visual_analysis", "design_generation"],
  },
  {
    id: "multi_provider_orchestration_runtime",
    layer: "orchestration_execution",
    title: "Multi-Provider Orchestration Runtime",
    description: "Runs routing, fallback, scoring, voting, model debate, confidence scoring, and multi-provider execution.",
    status: "planned",
    dependsOn: ["provider_runtime", "orchestration_registry", "scoring_runtime", "fallback_runtime"],
    unlocks: ["model_voting", "provider_fallback", "consensus_answers", "quality_scoring"],
  },
];
