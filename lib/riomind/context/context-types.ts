import type { RioMindAiLayer } from "../ai-foundation/db";

export type RioMindContextSourceType =
  | "rag_document"
  | "memory"
  | "project"
  | "team_workspace"
  | "chain_state"
  | "tool"
  | "workflow"
  | "knowledge_graph";

export type RioMindContextItem = {
  id: string;
  type: RioMindContextSourceType;
  title: string;
  content: string;
  score?: number | null;
  metadata?: Record<string, unknown>;
};

export type RioMindContextBuildInput = {
  aiLayer?: RioMindAiLayer;
  surface?: string;
  ownerUserId?: string;
  query: string;
  route?: string;
  limit?: number;
};

export type RioMindBuiltContext = {
  aiLayer: RioMindAiLayer;
  surface: string;
  query: string;
  items: RioMindContextItem[];
  injectedPrompt: string;
  confidence: number;
  metadata: Record<string, unknown>;
};
