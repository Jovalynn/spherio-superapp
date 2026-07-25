import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { RIOMIND_AGENT_REGISTRY } from "@/lib/riomind/agents/registry";
import { detectIntent } from "@/lib/riomind/core/router";
import { createProviderExecutionPlan } from "@/lib/riomind/execution/provider-runtime";
import { createSessionExecutionPlan } from "@/lib/riomind/execution/session-runtime";
import { createToolExecutionPlan } from "@/lib/riomind/execution/tool-runtime";
import { RIOMIND_PROVIDER_REGISTRY } from "@/lib/riomind/providers/registry";
import { runProviderRuntime } from "@/lib/riomind/providers/runtime";
import { buildRioMindContext } from "@/lib/riomind/context/context-builder";
import { createExcelArtifact } from "@/lib/riomind/artifacts/excel";
import { createPdfArtifact } from "@/lib/riomind/artifacts/pdf";
import { createPptxArtifact } from "@/lib/riomind/artifacts/pptx";
import { createDocxArtifact } from "@/lib/riomind/artifacts/docx";
import { getRioMindOwnerKey, getRioMindPgPool } from "@/lib/riomind/db";
import { logRioMindUsageEvent } from "@/lib/riomind/usage";
import { registerRioMindArtifactSafely } from "@/lib/riomind/artifacts/registry";
import { getPublicPictorialCards } from "@/lib/riomind/pictorial/public-image-cards";
import { detectFreshnessNeed } from "@/lib/riomind/freshness";
import { answerMeetingFromKnowledgeGraph } from "@/lib/riomind/meetings/meeting-graph-answer";
import { searchRioMindEnterprise } from "@/lib/riomind/search/enterprise-search";
import { ingestRioMindKnowledge } from "@/lib/riomind/learning/learning-ingestion";
import { queryRioMindLongTermMemory } from "@/lib/riomind/memory/long-term-memory-query";
import { compareRioMindDocumentVersions } from "@/lib/riomind/documents/document-diff";
import { getRioMindDocumentMetricTrends } from "@/lib/riomind/documents/document-trends";
import { getRioMindRelationshipClusters } from "@/lib/riomind/intelligence/relationship-clusters";
import { buildRioMindClusterReasoning } from "@/lib/riomind/intelligence/reasoning-engine";



function buildLiveSourceFallbackAnswer(originalQuestion: string, payload: any, citations: any[]) {
  if (!Array.isArray(citations) || citations.length === 0) return "";

  const freshness = payload?.freshness;
  const lines = [
    `${freshness?.label || "🟢 Live Web Sources"} — updated ${freshness?.updatedAt || "just now"}`,
    "",
    `Here are current source-backed results for: ${originalQuestion}`,
    "",
    ...citations.slice(0, 5).map((source: any, index: number) => {
      return [
        `${index + 1}. **${source.title || "Untitled source"}**`,
        source.provider ? `   Source: ${source.provider}` : "",
        source.snippet ? `   ${source.snippet}` : "",
        source.url ? `   ${source.url}` : "",
      ].filter(Boolean).join("\n");
    }),
    "",
    "Note: This answer used live source retrieval instead of model-only knowledge.",
  ];

  return lines.join("\n");
}

function shouldExposeRioMindDebug(request: Request, body: any) {
  const url = new URL(request.url);
  return (
    body?.debug === true ||
    body?.debug === "true" ||
    url.searchParams.get("debug") === "1" ||
    url.searchParams.get("debug") === "true" ||
    request.headers.get("x-riomind-debug") === "1" ||
    request.headers.get("x-riomind-debug") === "true"
  );
}


type NexusImageCard = {
  id?: string;
  title: string;
  imageUrl: string;
  sourceName?: string;
  sourceUrl?: string;
  caption?: string;
  alt?: string;
  kind?: "person" | "landmark" | "artwork" | "logo" | "product" | "animal" | "place" | "event" | "general";
};

type NexusRoute = {
  primaryRoute: string;
  selectedAgentId: string;
  capability: {
    ecosystem: "nexus" | "spherio" | "prime_ai";
    title: string;
    route?: string;
    api?: string;
    tools: string[];
  };
};

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function selectNexusRoute(message: string): NexusRoute {
  const text = message.toLowerCase();

  const isAttachedFileQuestion =
    text.includes("question about attached file") ||
    text.includes("use this file as the primary context") ||
    text.includes("file name:") ||
    text.includes("readable file content preview") ||
    text.includes("attached file") ||
    text.includes("explain this file") ||
    text.includes("summarize this file") ||
    text.includes("find issues in this file") ||
    text.includes("suggest improvements for this file");

  if (isAttachedFileQuestion) {
    return {
      primaryRoute: "file_analysis",
      selectedAgentId: "research",
      capability: {
        ecosystem: "nexus",
        title: "File Analysis",
        route: "/riomind/chat",
        tools: ["file_reader", "document_editor", "multimodal_reasoning"],
      },
    };
  }

  const isTableOrFormattingRequest =
    /\b(show this as a table|format this as a table|render this as a table|markdown table|table below|turn this into a table|columns|rows|csv|spreadsheet)\b/i.test(message) ||
    /\|\s*[-:]{3,}\s*\|/.test(message);

  if (isTableOrFormattingRequest) {
    return {
      primaryRoute: "structured_formatting",
      selectedAgentId: "research",
      capability: {
        ecosystem: "nexus",
        title: "Structured Formatting",
        route: "/riomind/chat",
        tools: ["document_editor", "file_reader"],
      },
    };
  }

  if (hasAny(text, ["android studio", "android app", "android wallet", "android wallet app", "wallet app", "mobile wallet", "mobile wallet app", "kotlin", "gradle", "apk", "mobile app", "react native", "flutter"])) {
    return {
      primaryRoute: "android_studio_workspace",
      selectedAgentId: "developer",
      capability: {
        ecosystem: "nexus",
        title: "Android Studio Workspace",
        route: "/riomind/chat",
        tools: ["android_studio_workspace", "mobile_app_workspace", "code_workspace", "terminal_assistant", "test_runner"],
      },
    };
  }

  if (hasAny(text, ["repository", "repo", "github", "codebase", "monorepo", "analyze this project", "project structure"])) {
    return {
      primaryRoute: "repository_analyzer",
      selectedAgentId: "developer",
      capability: {
        ecosystem: "nexus",
        title: "Repository Analyzer",
        route: "/riomind/chat",
        tools: ["repository_analyzer", "github_connector", "code_workspace", "file_reader"],
      },
    };
  }

  if (hasAny(text, ["generate an image", "create an image", "make an image", "draw", "render", "logo", "visual", "picture"])) {
    return {
      primaryRoute: "image_generation",
      selectedAgentId: "creator",
      capability: {
        ecosystem: "nexus",
        title: "Image Generation",
        route: "/riomind/chat",
        tools: ["image_generation", "image_analysis", "multimodal_reasoning"],
      },
    };
  }

  if (hasAny(text, ["analyze this image", "image analysis", "look at this image", "screenshot", "vision"])) {
    return {
      primaryRoute: "image_analysis",
      selectedAgentId: "research",
      capability: {
        ecosystem: "nexus",
        title: "Image Analysis",
        route: "/riomind/chat",
        tools: ["image_analysis", "multimodal_reasoning"],
      },
    };
  }

  if (hasAny(text, ["create a document", "write a document", "document editor", "proposal", "whitepaper", "paper", "report", "draft"])) {
    return {
      primaryRoute: "document_editor",
      selectedAgentId: "business",
      capability: {
        ecosystem: "nexus",
        title: "Document Editor",
        route: "/riomind/chat",
        tools: ["document_editor", "artifact_generation", "file_reader"],
      },
    };
  }

  if (hasAny(text, ["artifact", "presentation", "slides", "spreadsheet", "canvas", "generate a file"])) {
    return {
      primaryRoute: "artifact_generation",
      selectedAgentId: "business",
      capability: {
        ecosystem: "nexus",
        title: "Artifact Generation",
        route: "/riomind/chat",
        tools: ["artifact_generation", "document_editor", "spreadsheet_reader"],
      },
    };
  }

  if (hasAny(text, ["terminal", "command line", "shell", "bash", "ubuntu", "docker", "build error", "run command"])) {
    return {
      primaryRoute: "terminal_assistant",
      selectedAgentId: "developer",
      capability: {
        ecosystem: "nexus",
        title: "Terminal Assistant",
        route: "/riomind/chat",
        tools: ["terminal_assistant", "code_workspace", "test_runner"],
      },
    };
  }

  if (hasAny(text, ["patch my code", "fix my code", "write code", "debug", "typescript", "javascript", "python", "api", "component", "function"])) {
    return {
      primaryRoute: "code_workspace",
      selectedAgentId: "developer",
      capability: {
        ecosystem: "nexus",
        title: "Code Workspace",
        route: "/riomind/chat",
        tools: ["code_workspace", "repository_analyzer", "test_runner", "terminal_assistant"],
      },
    };
  }

  if (hasAny(text, ["build an app", "app builder", "build me an app", "web app", "saas", "dashboard"])) {
    return {
      primaryRoute: "app_builder",
      selectedAgentId: "developer",
      capability: {
        ecosystem: "nexus",
        title: "App Builder",
        route: "/riomind/chat",
        tools: ["app_builder", "ui_generator", "code_workspace", "deployment_assistant"],
      },
    };
  }

  if (hasAny(text, ["blockchain", "token", "smart contract", "dex", "rioex", "riodex", "spheriochain"])) {
    return {
      primaryRoute: "blockchain",
      selectedAgentId: "blockchain",
      capability: {
        ecosystem: "prime_ai",
        title: "Blockchain AI",
        route: "/prime-ai/blockchain-ai",
        api: "/api/prime-ai/blockchain-ai/deep-runtime",
        tools: ["code_workspace", "repository_analyzer", "api_connector"],
      },
    };
  }

  if (hasAny(text, ["startup", "business", "launch"])) {
    return {
      primaryRoute: "business",
      selectedAgentId: "business",
      capability: {
        ecosystem: "prime_ai",
        title: "AI Business Launch Hub",
        route: "/prime-ai/ai-business-launch-hub",
        api: "/api/prime-ai/ai-business-launch-hub/deep-runtime",
        tools: ["web_search", "document_editor", "artifact_generation"],
      },
    };
  }

  if (hasAny(text, ["learn", "student", "teach", "exam"])) {
    return {
      primaryRoute: "education",
      selectedAgentId: "education",
      capability: {
        ecosystem: "prime_ai",
        title: "Student AI Platform",
        route: "/prime-ai/student-ai-platform",
        api: "/api/prime-ai/student-ai-platform/deep-learning",
        tools: ["document_editor", "file_reader", "multimodal_reasoning"],
      },
    };
  }

  if (hasAny(text, ["legal", "contract", "compliance"])) {
    return {
      primaryRoute: "legal",
      selectedAgentId: "legal",
      capability: {
        ecosystem: "prime_ai",
        title: "Legal AI",
        route: "/prime-ai/legal-ai",
        api: "/api/prime-ai/legal-ai/deep-runtime",
        tools: ["document_editor", "file_reader", "web_search"],
      },
    };
  }

  if (hasAny(text, ["medical", "clinical", "healthcare"])) {
    return {
      primaryRoute: "medical",
      selectedAgentId: "medical",
      capability: {
        ecosystem: "prime_ai",
        title: "Clinical Documentation & Medical Research Support AI",
        route: "/prime-ai/medical-ai",
        api: "/api/prime-ai/medical-ai/deep-runtime",
        tools: ["document_editor", "file_reader", "research_archives"],
      },
    };
  }

  if (
    text.includes("analysis mode:") ||
    text.includes("start a nexus financial modeling") ||
    text.includes("start a nexus business intelligence") ||
    text.includes("start a nexus forecasting") ||
    text.includes("start a nexus market intelligence") ||
    text.includes("start a nexus spreadsheet intelligence") ||
    text.includes("start a nexus data analysis") ||
    text.includes("start a nexus ai analytics") ||
    text.includes("start a nexus deep research analytics")
  ) {
    return {
      primaryRoute: "analytics_workspace",
      selectedAgentId: "data_science",
      capability: {
        ecosystem: "nexus",
        title: "Analytics Workspace",
        route: "/nexus/analytics",
        tools: [
          "analytics_engine",
          "spreadsheet_analysis",
          "forecasting",
          "financial_modeling",
          "market_intelligence",
        ],
      },
    };
  }

  if (hasAny(text, ["data", "machine learning", "forecast", "model training"])) {
    return {
      primaryRoute: "data_science",
      selectedAgentId: "data_science",
      capability: {
        ecosystem: "prime_ai",
        title: "Data Science & Machine Learning AI",
        route: "/prime-ai/data-science-machine-learning-ai",
        api: "/api/prime-ai/data-science-machine-learning-ai/deep-runtime",
        tools: ["python_runtime", "sql_runtime", "database_query"],
      },
    };
  }

  if (hasAny(text, ["project", "roadmap", "milestone"])) {
    return {
      primaryRoute: "project_manager",
      selectedAgentId: "project_manager",
      capability: {
        ecosystem: "prime_ai",
        title: "Complex Project Manager AI",
        route: "/prime-ai/complex-project-manager-ai",
        api: "/api/prime-ai/complex-project-manager-ai/deep-runtime",
        tools: ["project_builder", "document_editor", "artifact_generation"],
      },
    };
  }

  if (hasAny(text, ["creator", "content", "studio"])) {
    return {
      primaryRoute: "creator",
      selectedAgentId: "creator",
      capability: {
        ecosystem: "prime_ai",
        title: "AI Creator Studio",
        route: "/prime-ai/ai-creator-studio",
        api: "/api/prime-ai/ai-creator-studio/deep-runtime",
        tools: ["image_generation", "document_editor", "artifact_generation"],
      },
    };
  }

  if (hasAny(text, ["enterprise", "automation", "workflow"])) {
    return {
      primaryRoute: "enterprise",
      selectedAgentId: "enterprise",
      capability: {
        ecosystem: "prime_ai",
        title: "Enterprise AI Automation",
        route: "/prime-ai/enterprise-ai-automation",
        api: "/api/prime-ai/enterprise-ai-automation/deep-runtime",
        tools: ["api_connector", "document_editor", "database_query"],
      },
    };
  }

  if (hasAny(text, ["finance", "trading", "market"])) {
    return {
      primaryRoute: "finance",
      selectedAgentId: "finance",
      capability: {
        ecosystem: "prime_ai",
        title: "AI Trading Intelligence",
        route: "/prime-ai/ai-trading-intelligence",
        api: "/api/prime-ai/ai-trading-intelligence/deep-runtime",
        tools: ["web_search", "database_query", "analytics"],
      },
    };
  }

  return {
    primaryRoute: "research",
    selectedAgentId: "research",
    capability: {
      ecosystem: "prime_ai",
      title: "Research Economy",
      route: "/prime-ai/research-economy",
      api: "/api/prime-ai/research-economy/deep-runtime",
      tools: ["web_search", "file_reader", "document_editor"],
    },
  };
}


type ConversationContextMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanConversationId(value: unknown) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();
  return cleaned.length ? cleaned.slice(0, 120) : null;
}

function roleLabel(role: ConversationContextMessage["role"]) {
  return role === "assistant" ? "RioMind Nexus" : "User";
}

async function loadConversationContext(
  request: Request,
  conversationId: string | null
): Promise<ConversationContextMessage[]> {
  if (!conversationId) return [];

  try {
    const db = getRioMindPgPool();
    const ownerKey = getRioMindOwnerKey(request.headers);

    const result = await db.query(
      `
        SELECT m.role, m.content, m.created_at
        FROM riomind_conversations c
        JOIN riomind_messages m ON m.conversation_id = c.id
        WHERE c.id = $1
          AND c.owner_key = $2
          AND m.role IN ('user', 'assistant')
        ORDER BY m.created_at DESC
        LIMIT 18
      `,
      [conversationId, ownerKey]
    );

    return result.rows
      .reverse()
      .map((row): ConversationContextMessage => ({
        role: row.role === "assistant" ? "assistant" : "user",
        content: String(row.content || "").trim(),
      }))
      .filter((item) => item.content);
  } catch {
    return [];
  }
}

function buildConversationAwareMessage(
  latestMessage: string,
  history: ConversationContextMessage[]
) {
  const latest = latestMessage.trim();

  if (!history.length) {
    return latest;
  }

  const normalizedHistory = [...history];
  const last = normalizedHistory[normalizedHistory.length - 1];

  if (
    !last ||
    last.role !== "user" ||
    last.content.trim().toLowerCase() !== latest.toLowerCase()
  ) {
    normalizedHistory.push({
      role: "user",
      content: latest,
    });
  }

  const renderedHistory = normalizedHistory
    .map((item) => `${roleLabel(item.role)}: ${item.content}`)
    .join("\n\n");

  return [
    "Use the following recent RioMind Nexus conversation context to answer the latest user request.",
    "Do not mention that hidden context was loaded. Do not expose internal routing or infrastructure details.",
    "",
    renderedHistory,
    "",
    "Answer the latest user request naturally and directly.",
  ].join("\n");
}


function isExcelArtifactRequest(message: string) {
  const hasExcelTerm =
    /\b(excel|xlsx|spreadsheet|workbook|worksheet)\b/i.test(message) ||
    /\.xlsx\b/i.test(message);

  const hasArtifactIntent =
    /\b(create|prepare|generate|make|build|export|produce|download|downloadable)\b/i.test(message);

  return hasExcelTerm && hasArtifactIntent;
}

function extractJsonObjectFromMessage(message: string) {
  const fencedMatch = message.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? message;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const jsonText = candidate.slice(start, end + 1);

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function splitDelimitedLine(line: string) {
  if (line.includes("\t")) {
    return line.split("\t").map((item) => item.trim());
  }

  if (line.includes("|")) {
    return line
      .split("|")
      .map((item) => item.trim())
      .filter((item, index, array) => item || (index > 0 && index < array.length - 1));
  }

  return line.split(",").map((item) => item.trim());
}


function toModernArtifactTitle(value: string, fallback: string) {
  const cleaned = value
    .replace(/\b(from|using|based on|based upon)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  return cleaned
    .split(" ")
    .map((word) => {
      const normalized = word.trim();
      if (!normalized) return "";
      if (/^(AI|API|PDF|DOCX|PPTX|RIO|RUSD|USD|USDT|USDC)$/i.test(normalized)) {
        return normalized.toUpperCase();
      }
      if (/^[A-Z0-9]{2,}$/.test(normalized)) return normalized;
      return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(" ");
}

function titleFromExcelRequest(message: string) {
  const quoted = message.match(/title\s*[:=-]?\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();

  const singleQuoted = message.match(/title\s*[:=-]?\s*'([^']+)'/i);
  if (singleQuoted?.[1]) return singleQuoted[1].trim();

  const firstLine = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "Nexus Workbook";

  const cleaned = firstLine
    .replace(/\b(create|prepare|generate|make|build|export|produce)\b/gi, "")
    .replace(/\b(modern|excel|xlsx|spreadsheet|workbook|worksheet)\b/gi, "")
    .replace(/\b(as|into|from|of|for|a|an|this)\b/gi, "")
    .replace(/[:\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toModernArtifactTitle(cleaned, "Nexus Workbook");
}

function extractTableDataFromMessage(message: string) {
  const withoutJson = message.replace(/```(?:json)?[\s\S]*?```/gi, "");
  const lines = withoutJson
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(create|generate|make|prepare|arrange|organize|organise)\b/i.test(line))
    .filter((line) => !/^title\s*:/i.test(line));

  const candidateLines = lines.filter((line) => {
    const commaCount = (line.match(/,/g) || []).length;
    const pipeCount = (line.match(/\|/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    return commaCount >= 1 || pipeCount >= 1 || tabCount >= 1;
  });

  if (candidateLines.length < 2) {
    return null;
  }

  const columns = splitDelimitedLine(candidateLines[0]).slice(0, 80);

  if (columns.length < 2) {
    return null;
  }

  const rows = candidateLines.slice(1, 5001).map((line) => {
    const values = splitDelimitedLine(line);
    const row: Record<string, unknown> = {};

    columns.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });

    return row;
  });

  const validRows = rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").trim().length > 0)
  );

  if (!validRows.length) {
    return null;
  }

  return {
    title: titleFromExcelRequest(message),
    columns,
    rows: validRows,
  };
}



function inferExcelArtifactMode(message: string, input: { columns?: unknown }) {
  const text = message.toLowerCase();
  const columns = Array.isArray(input.columns)
    ? input.columns.map((column) => String(column || "").toLowerCase())
    : [];

  const dateLikeColumns = columns.filter((column) =>
    /\b(jan|feb|mar|apr|may|jun|june|jul|aug|sep|oct|nov|dec|mon|tue|wed|thu|fri|sat|sun)\b/.test(column) ||
    /^\d{1,2}$/.test(column)
  ).length;

  if (
    text.includes("complex") ||
    text.includes("attendance") ||
    text.includes("daily") ||
    text.includes("calendar") ||
    text.includes("registry") ||
    text.includes("register") ||
    text.includes("roster") ||
    dateLikeColumns >= 3 ||
    columns.length > 8
  ) {
    return "complex_roster";
  }

  return undefined;
}




type ParsedDocxArtifactInput = {
  title?: string;
  content?: string;
  sections?: unknown;
  columns?: string[];
  rows?: Record<string, unknown>[];
};

function isDocxArtifactRequest(message: string) {
  return /\b(docx|word document|word file|microsoft word)\b/i.test(message);
}

function titleFromDocxRequest(message: string) {
  const quoted = message.match(/title\s*[:=-]?\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();

  const singleQuoted = message.match(/title\s*[:=-]?\s*'([^']+)'/i);
  if (singleQuoted?.[1]) return singleQuoted[1].trim();

  const firstLine = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "nexus document";

  const cleaned = firstLine
    .replace(/\b(create|prepare|generate|make)\b/gi, "")
    .replace(/\b(as|into|from|of|for|a|an|this)\b/gi, "")
    .replace(/\b(docx|word document|word file|microsoft word)\b/gi, "")
    .replace(/[:\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toModernArtifactTitle(cleaned, "Nexus Document");
}

function tryParseJsonObjectFromMessage(message: string) {
  const start = message.indexOf("{");
  const end = message.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(message.slice(start, end + 1));
  } catch {
    return null;
  }
}

function splitDocxDelimitedLine(line: string) {
  if (line.includes("\t")) {
    return line.split("\t").map((item) => item.trim());
  }

  if (line.includes("|")) {
    const normalized = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    return normalized.split("|").map((item) => item.trim());
  }

  return line.split(",").map((item) => item.trim());
}

function tryExtractDocxTable(message: string) {
  const allLines = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  const candidateLines = allLines.filter(
    (line) =>
      line &&
      (line.includes(",") || line.includes("\t") || line.includes("|"))
  );

  if (candidateLines.length < 2) {
    return null;
  }

  const parsed = candidateLines.map(splitDocxDelimitedLine);
  const headers = parsed[0].map((header, index) => header || `Column ${index + 1}`);

  if (headers.length < 2) {
    return null;
  }

  const dataRows = parsed
    .slice(1)
    .filter(
      (row) =>
        row.some((cell) => String(cell ?? "").trim()) &&
        !row.every((cell) => /^[-:]+$/.test(String(cell ?? "").trim()))
    );

  if (dataRows.length === 0) {
    return null;
  }

  const rows = dataRows.map((row) => {
    const output: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      output[header] = row[index] ?? "";
    });
    return output;
  });

  return {
    columns: headers,
    rows,
  };
}

function contentFromDocxRequest(message: string) {
  const cleaned = message
    .replace(/^.*?\b(create|prepare|generate|make)\b.*?\b(docx|word document|word file|microsoft word)\b[:\s-]*/i, "")
    .trim();

  return cleaned || "This document was generated by RioMind Nexus.";
}

function extractDocxArtifactInput(message: string): ParsedDocxArtifactInput | null {
  if (!isDocxArtifactRequest(message)) {
    return null;
  }

  const parsedJson = tryParseJsonObjectFromMessage(message);
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    const record = parsedJson as Record<string, unknown>;
    return {
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : titleFromDocxRequest(message),
      content: typeof record.content === "string" ? record.content : undefined,
      sections: record.sections,
      columns: Array.isArray(record.columns)
        ? record.columns.map((item) => String(item ?? "").trim()).filter(Boolean)
        : undefined,
      rows: Array.isArray(record.rows)
        ? (record.rows as Record<string, unknown>[])
        : undefined,
    };
  }

  const table = tryExtractDocxTable(message);

  return {
    title: titleFromDocxRequest(message),
    content: contentFromDocxRequest(message),
    columns: table?.columns,
    rows: table?.rows,
  };
}



type ParsedPdfArtifactInput = {
  title?: string;
  content?: string;
  sections?: unknown;
  columns?: string[];
  rows?: Record<string, unknown>[];
};

function isPdfArtifactRequest(message: string) {
  return /\b(pdf|pdf document|pdf file)\b/i.test(message);
}

function titleFromPdfRequest(message: string) {
  const quoted = message.match(/title\s*[:=-]?\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();

  const singleQuoted = message.match(/title\s*[:=-]?\s*'([^']+)'/i);
  if (singleQuoted?.[1]) return singleQuoted[1].trim();

  const firstLine = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "nexus pdf";

  const cleaned = firstLine
    .replace(/\b(create|prepare|generate|make)\b/gi, "")
    .replace(/\b(as|into|from|of|for|a|an|this)\b/gi, "")
    .replace(/\b(pdf|pdf document|pdf file)\b/gi, "")
    .replace(/[:\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toModernArtifactTitle(cleaned, "Nexus PDF");
}

function contentFromPdfRequest(message: string) {
  const cleaned = message
    .replace(/^.*?\b(create|prepare|generate|make)\b.*?\b(pdf|pdf document|pdf file)\b[:\s-]*/i, "")
    .trim();

  return cleaned || "This PDF was generated by RioMind Nexus.";
}

function extractPdfArtifactInput(message: string): ParsedPdfArtifactInput | null {
  if (!isPdfArtifactRequest(message)) {
    return null;
  }

  const parsedJson = tryParseJsonObjectFromMessage(message);
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    const record = parsedJson as Record<string, unknown>;
    return {
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : titleFromPdfRequest(message),
      content: typeof record.content === "string" ? record.content : undefined,
      sections: record.sections,
      columns: Array.isArray(record.columns)
        ? record.columns.map((item) => String(item ?? "").trim()).filter(Boolean)
        : undefined,
      rows: Array.isArray(record.rows)
        ? (record.rows as Record<string, unknown>[])
        : undefined,
    };
  }

  const table = tryExtractDocxTable(message);

  return {
    title: titleFromPdfRequest(message),
    content: contentFromPdfRequest(message),
    columns: table?.columns,
    rows: table?.rows,
  };
}



type ParsedPptxArtifactInput = {
  title?: string;
  content?: string;
  sections?: unknown;
  columns?: string[];
  rows?: Record<string, unknown>[];
};

function isPptxArtifactRequest(message: string) {
  return /\b(pptx|powerpoint|slide deck|deck|presentation|slides)\b/i.test(message);
}

function titleFromPptxRequest(message: string) {
  const quoted = message.match(/title\s*[:=-]?\s*"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();

  const singleQuoted = message.match(/title\s*[:=-]?\s*'([^']+)'/i);
  if (singleQuoted?.[1]) return singleQuoted[1].trim();

  const firstLine = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "nexus presentation";

  const cleaned = firstLine
    .replace(/\b(create|prepare|generate|make)\b/gi, "")
    .replace(/\b(as|into|from|of|for|a|an|this)\b/gi, "")
    .replace(/\b(pptx|powerpoint|slide deck|deck|presentation|slides)\b/gi, "")
    .replace(/[:\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return toModernArtifactTitle(cleaned, "Nexus Presentation");
}

function contentFromPptxRequest(message: string) {
  const cleaned = message
    .replace(/^.*?\b(create|prepare|generate|make)\b.*?\b(pptx|powerpoint|slide deck|deck|presentation|slides)\b[:\s-]*/i, "")
    .trim();

  return cleaned || "This presentation was generated by RioMind Nexus.";
}

function extractPptxArtifactInput(message: string): ParsedPptxArtifactInput | null {
  if (!isPptxArtifactRequest(message)) {
    return null;
  }

  const parsedJson = tryParseJsonObjectFromMessage(message);
  if (parsedJson && typeof parsedJson === "object" && !Array.isArray(parsedJson)) {
    const record = parsedJson as Record<string, unknown>;
    return {
      title:
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : titleFromPptxRequest(message),
      content: typeof record.content === "string" ? record.content : undefined,
      sections: record.sections,
      columns: Array.isArray(record.columns)
        ? record.columns.map((item) => String(item ?? "").trim()).filter(Boolean)
        : undefined,
      rows: Array.isArray(record.rows)
        ? (record.rows as Record<string, unknown>[])
        : undefined,
    };
  }

  const table = tryExtractDocxTable(message);

  return {
    title: titleFromPptxRequest(message),
    content: contentFromPptxRequest(message),
    columns: table?.columns,
    rows: table?.rows,
  };
}



type RioMindChatVisionInput = {
  id?: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  dataUrl?: string;
  url?: string;
};

const RIOMIND_MAX_VISION_IMAGES = 4;
const RIOMIND_MAX_VISION_IMAGE_BYTES = 8 * 1024 * 1024;

function isSupportedRioMindVisionMime(mimeType: string) {
  return /^(image\/png|image\/jpe?g|image\/webp|image\/gif)$/i.test(mimeType || "");
}

function asksForAttachedImageAnalysis(message: string) {
  return /\b(this|attached|uploaded)\s+(image|screenshot|photo|picture)\b/i.test(message) ||
    /\b(analyze|inspect|read|explain|audit|review)\s+(this\s+)?(image|screenshot|photo|picture)\b/i.test(message) ||
    /\b(read tiny text|ui auditor|visual audit|look at this image|look at this screenshot)\b/i.test(message);
}

async function loadRioMindVisionInputs(
  request: Request,
  rawInputs: unknown
): Promise<RioMindChatVisionInput[]> {
  if (!Array.isArray(rawInputs) || rawInputs.length === 0) {
    return [];
  }

  const db = getRioMindPgPool();
  const ownerKey = getRioMindOwnerKey(request.headers);
  const loaded: RioMindChatVisionInput[] = [];

  for (const raw of rawInputs.slice(0, RIOMIND_MAX_VISION_IMAGES)) {
    const fileId = String((raw as any)?.id || "").trim();
    if (!fileId) continue;

    const result = await db.query(
      `
        SELECT
          id,
          original_name,
          mime_type,
          size_bytes,
          storage_path
        FROM riomind_files
        WHERE id = $1 AND owner_key = $2
        LIMIT 1
      `,
      [fileId, ownerKey]
    );

    const row = result.rows[0];
    if (!row) continue;

    const mimeType = String(row.mime_type || "");
    if (!isSupportedRioMindVisionMime(mimeType)) continue;

    const sizeBytes = Number(row.size_bytes || 0);
    if (sizeBytes <= 0 || sizeBytes > RIOMIND_MAX_VISION_IMAGE_BYTES) continue;

    const buffer = await readFile(String(row.storage_path));

    loaded.push({
      id: row.id,
      name: row.original_name,
      mimeType,
      sizeBytes,
      dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
    });
  }

  return loaded;
}

function buildRioMindVisionContext(images: RioMindChatVisionInput[]) {
  if (!images.length) return "";

  return [
    "",
    "NEXUS_VISUAL_IMAGE_INPUTS_START",
    ...images.map((image, index) =>
      [
        `Image ${index + 1}`,
        `Name: ${image.name || "uploaded image"}`,
        `MIME type: ${image.mimeType || "image"}`,
        `Size bytes: ${image.sizeBytes ?? "unknown"}`,
        "Instruction: inspect this image visually. First identify the exact visible image inventory. If the image is a carousel, collage, gallery, screenshot containing multiple photos, or multiple panels, state how many visible panels/images are present and describe each one separately before any UI audit. Read visible text carefully, including small UI labels where possible. Identify layout, colors, icons, buttons, errors, charts, diagrams, screenshots, and visual issues only after the exact visible inventory. Do not invent details that are not visible.",
      ].join("\n")
    ),
    "NEXUS_VISUAL_IMAGE_INPUTS_END",
  ].join("\n");
}



function cleanPictorialResponseWhenCardsExist(response: string, imageCards: NexusImageCard[]) {
  if (!imageCards.length) return response;

  let cleaned = String(response || "").trim();

  cleaned = cleaned.replace(
    /\n{1,2}#{2,4}\s*(?:Typical|Common)[^\n]*(?:pictorial|visual)[^\n]*\n[\s\S]*?(?=\n{1,2}#{2,4}\s|\s*$)/gi,
    ""
  );

  cleaned = cleaned.replace(
    /\n*(?:If you want|Would you like|I can display|I can provide)[\s\S]*$/i,
    ""
  ).trim();

  if (/sourced visual card is attached below/i.test(cleaned)) {
    return cleaned;
  }

  const parts = cleaned.split(/\n{2,}/).filter(Boolean);

  if (parts.length <= 1) {
    return `${cleaned}\n\nA sourced visual card is attached below for pictorial context.`;
  }

  return [
    parts[0],
    "A sourced visual card is attached below for pictorial context.",
    ...parts.slice(1),
  ].join("\n\n");
}





function shouldAutoIngestChatMessage(message: string) {
  const text = String(message || "").trim();

  if (text.length < 80) return false;
  if (/\bNX-\d{4}-[A-Z0-9]+\b/i.test(text)) return false;

  return /\b(decided|decision|we should|should build|need to|must|risk|mainnet|subscription|security|rbac|authentication|theme|enterprise search|continuous learning|planning agents|multi-agent|workflow|knowledge graph|memory)\b/i.test(text);
}

async function autoIngestChatKnowledge(input: {
  message: string;
  conversationId?: string | null;
  ownerUserId?: string;
  surface?: string;
}) {
  if (!shouldAutoIngestChatMessage(input.message)) {
    return null;
  }

  try {
    return await ingestRioMindKnowledge({
      aiLayer: "nexus_ai",
      surface: input.surface || "nexus_chat",
      sourceType: "chat",
      sourceId: input.conversationId ? `conversation:${input.conversationId}:${Date.now()}` : `chat:${Date.now()}`,
      title: "Nexus Chat Learned Knowledge",
      text: input.message,
      ownerUserId: input.ownerUserId || "local-user",
      metadata: {
        conversationId: input.conversationId || null,
        ingestionMode: "auto_chat_learning",
      },
    });
  } catch (error) {
    console.error("autoIngestChatKnowledge failed", error);
    return null;
  }
}


function shouldUseLongTermMemory(message: string) {
  const text = String(message || "");

  if (/\bNX-\d{4}-[A-Z0-9]+\b/i.test(text)) return false;

  return /\b(what do we remember|what have we learned|what did we decide|what decisions|what risks|remember about|recall|long[- ]term memory|before mainnet|what should we do before|what do we know about)\b/i.test(text);
}

function formatLongTermMemoryAnswer(memoryResult: any) {
  return [
    "## Answer from RioMind Long-Term Memory",
    "",
    memoryResult?.answer || "No matching long-term memory found yet.",
    "",
    "## Memory Coverage",
    `- Results: ${memoryResult?.memory?.resultCount || 0}`,
    `- Knowledge: ${memoryResult?.memory?.groupCounts?.knowledge || 0}`,
    `- Workflows: ${memoryResult?.memory?.groupCounts?.workflows || 0}`,
    `- Memory: ${memoryResult?.memory?.groupCounts?.memory || 0}`,
  ].join("\\n").trim();
}

function shouldUseEnterpriseSearch(message: string) {
  const text = String(message || "");

  if (/\bNX-\d{4}-[A-Z0-9]+\b/i.test(text)) return false;

  return /\b(search|find|show me|what do we know|what have we learned|recall|remember|knowledge|memory|decision|decisions|task|tasks|workflow|mainnet|subscription|security|rbac|authentication|theme|provider|continuous learning|enterprise search|planning agents|multi-agent)\b/i.test(text);
}





function extractMetricTrendQuestion(message: string) {
  const text = String(message || "");

  if (!/\b(how has|changed|change|trend|trending|improved|declined|increased|decreased|growth over time|kpi|metrics?)\b/i.test(text)) {
    return null;
  }

  const metrics = ["Revenue", "Growth", "Customers", "EBITDA"];
  const found = metrics.find((metric) => new RegExp(`\\b${metric}\\b`, "i").test(text));

  if (found) return { metric: found };

  if (/\b(which|what)\s+kpis?\s+(improved|declined|changed|increased|decreased)/i.test(text)) {
    return { metric: undefined };
  }

  if (/\bmetrics?\b|\bkpis?\b/i.test(text)) {
    return { metric: undefined };
  }

  return null;
}

function formatMetricTrendAnswer(result: any, metric?: string) {
  const trends = Array.isArray(result?.trends) ? result.trends : [];

  if (!trends.length) {
    return [
      "## Answer from RioMind Trend Intelligence",
      "",
      metric ? `I could not find stored trend intelligence for ${metric} yet.` : "I could not find stored KPI trend intelligence yet.",
    ].join("\\n").trim();
  }

  const lines = [
    "## Answer from RioMind Trend Intelligence",
    "",
  ];

  for (const trend of trends.slice(0, 8)) {
    const pct = typeof trend.percentChangeFromFirst === "number"
      ? `${trend.percentChangeFromFirst.toFixed(2)}%`
      : "unknown";

    lines.push(`- **${trend.metricName}**: ${trend.summary}`);
    lines.push(`  - Direction: ${trend.directionFromFirst}`);
    lines.push(`  - Change from first: ${pct}`);
    lines.push(`  - Points: ${trend.points?.length || 0}`);
  }

  return lines.join("\\n").trim();
}

function extractDocumentDiffQuestion(message: string) {
  const text = String(message || "");

  if (!/\b(change|changed|compare|difference|diff|version)\b/i.test(text)) return null;

  const docMatch =
    text.match(/\b([a-z0-9][a-z0-9_-]{3,})\b/i);

  const explicitDoc =
    text.match(/\b(?:document|doc)\s+([a-z0-9][a-z0-9_-]{3,})\b/i) ||
    text.match(/\b(?:in|for|of)\s+([a-z0-9][a-z0-9_-]{3,})\b/i);

  const documentId = explicitDoc?.[1] || docMatch?.[1] || "";

  if (!documentId || ["what", "changed", "compare", "version", "document"].includes(documentId.toLowerCase())) {
    return null;
  }

  const versions = Array.from(text.matchAll(/\b(?:v|version)\s*(\d+)\b/gi)).map((m) => Number(m[1])).filter(Boolean);

  return {
    documentId,
    fromVersion: versions[0],
    toVersion: versions[1],
  };
}

function formatDocumentDiffAnswer(diff: any) {
  if (!diff?.ok) {
    return [
      "## Answer from RioMind Document Intelligence",
      "",
      diff?.error || "I could not compare the requested document versions.",
    ].join("\n").trim();
  }

  const lines = [
    "## Answer from RioMind Document Intelligence",
    "",
    `Document: ${diff.documentId}`,
    `Compared: v${diff.fromVersion} → v${diff.toVersion}`,
    "",
    `Summary: ${diff.summary}`,
    "",
  ];

  function addSection(title: string, data: any) {
    const added = data?.added || [];
    const removed = data?.removed || [];
    const unchanged = data?.unchanged || [];

    if (!added.length && !removed.length && !unchanged.length) return;

    lines.push(`## ${title}`);

    if (added.length) {
      lines.push("Added:");
      for (const item of added.slice(0, 8)) lines.push(`- ${item}`);
    }

    if (removed.length) {
      lines.push("Removed:");
      for (const item of removed.slice(0, 8)) lines.push(`- ${item}`);
    }

    if (unchanged.length) {
      lines.push("Unchanged:");
      for (const item of unchanged.slice(0, 5)) lines.push(`- ${item}`);
    }

    lines.push("");
  }

  addSection("Facts", diff.changes?.facts);
  addSection("Decisions", diff.changes?.decisions);
  addSection("Action Items", diff.changes?.actionItems);
  addSection("Risks", diff.changes?.risks);

  return lines.join("\n").trim();
}

function shouldBlockArtifactForKnowledgeQuestion(message: string) {
  return /\b(remember|recall|what do we know|what do we remember|what have we learned|what risks|what decisions|before mainnet)\b/i.test(String(message || ""));
}

function selectNexusChatKnowledgeRoute(message: string) {
  if (extractMeetingGraphQuestion(message)) return "meeting_graph";
  if (extractMetricTrendQuestion(message)) return "metric_trend";
  if (extractDocumentDiffQuestion(message)) return "document_diff";
  if (shouldUseLongTermMemory(message)) return "long_term_memory";
  if (shouldUseEnterpriseSearch(message)) return "enterprise_search";
  return "provider";
}

function deriveEnterpriseSearchQuery(message: string) {
  const cleaned = String(message || "")
    .replace(/[?!.,]/g, " ")
    .replace(/\b(what|do|we|know|about|before|show|me|find|search|recall|remember|in|the|a|an|of|to|from|please|rioMind|core)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || message;
}

function formatEnterpriseSearchAnswer(searchResult: any) {
  const results = Array.isArray(searchResult?.results) ? searchResult.results : [];
  const top = results.slice(0, 8);

  const lines = [
    "## Answer from RioMind Enterprise Search",
    "",
    top.length
      ? `I found ${searchResult.count} relevant result${searchResult.count === 1 ? "" : "s"} across RioMind Core.`
      : "I could not find matching knowledge in RioMind Core yet.",
    "",
  ];

  if (top.length) {
    lines.push("## Top Matches");

    for (const item of top) {
      lines.push(
        `- **${item.title || "Untitled"}** — ${item.source || item.type}${item.score ? ` · score ${item.score}` : ""}`
      );

      if (item.snippet && String(item.snippet).trim() && String(item.snippet).trim() !== String(item.title).trim()) {
        lines.push(`  ${String(item.snippet).slice(0, 220)}`);
      }
    }

    lines.push("");
    lines.push("## Source Groups");
    lines.push(`- Knowledge: ${searchResult.groupCounts?.knowledge || 0}`);
    lines.push(`- Workflows: ${searchResult.groupCounts?.workflows || 0}`);
    lines.push(`- Memory: ${searchResult.groupCounts?.memory || 0}`);
  }

  return lines.join("\n").trim();
}

function extractMeetingGraphQuestion(message: string) {
  const meetingCode = message.match(/\bNX-\d{4}-[A-Z0-9]+\b/i)?.[0]?.toUpperCase();
  if (!meetingCode) return null;

  const isMeetingGraphQuestion =
    /\b(meeting|topics?|discussed|risks?|speakers?|who spoke|languages?|translation|transcript|summary|summarize|voice session|realtime|decisions?|decided|action items?|next steps?|tasks?|what should we do)\b/i.test(message);

  if (!isMeetingGraphQuestion) return null;

  return {
    meetingCode,
    question: message,
  };
}

export async function POST(request: Request) {
  const requestStartedAt = Date.now();
  const body = await request.json().catch(() => ({}));
  const exposeDebug = shouldExposeRioMindDebug(request, body);
    const visionInputs = await loadRioMindVisionInputs(request, (body as any)?.imageInputs);
  const imageInputsRequested = Array.isArray((body as any)?.imageInputs) && (body as any).imageInputs.length > 0;
let message = typeof body.message === "string" ? body.message : "";
  const originalUserMessage = message;
  const visionContext = buildRioMindVisionContext(visionInputs);
  const messageMentionsVisualAttachment =
    /Visual image attachment:\s*yes/i.test(message) ||
    /image upload/i.test(message) ||
    /Content URL:\s*\/api\/riomind\/files\//i.test(message);


  if ((imageInputsRequested || asksForAttachedImageAnalysis(message) || messageMentionsVisualAttachment) && visionInputs.length === 0) {
    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response: [
        "## I cannot inspect the image yet",
        "",
        "I can see that you are asking for image or screenshot analysis, but the image did not reach Nexus vision input.",
        "",
        "## What this means",
        "- I should not invent visible text, colors, buttons, dashboards, labels, icons, errors, or UI elements.",
        "- Please attach, paste, or drag the image into the Nexus composer and try again.",
        "",
        "## Next test prompt",
        "`Analyze this screenshot. Read visible text, colors, icons, layout, and errors. Do not guess anything that is not visible.`",
      ].join("\n"),
      visionLoaded: false,
      reason: "image_did_not_reach_vision",
    });
  }

  const conversationId = cleanConversationId(body?.conversationId);
  const conversationContext = await loadConversationContext(request, conversationId);
  const conversationAwareMessage = buildConversationAwareMessage(
    message,
    conversationContext
  );


  const freshnessDecision = detectFreshnessNeed(originalUserMessage);
  let liveSourcePayload: any = null;
  let liveCitations: any[] = [];

  if (freshnessDecision.needsFreshness) {
    try {
      const liveResponse = await fetch(new URL("/api/riomind/sources/live", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: originalUserMessage,
          mode: freshnessDecision.mode === "knowledge_only" ? "web" : freshnessDecision.mode,
        }),
        cache: "no-store",
      });

      if (liveResponse.ok) {
        liveSourcePayload = await liveResponse.json();
        liveCitations = Array.isArray(liveSourcePayload?.citations)
          ? liveSourcePayload.citations.slice(0, 8)
          : [];

        if (liveCitations.length > 0) {
          const sourceContext = liveCitations
            .map((source: any, index: number) => {
              return [
                `[${index + 1}] ${source.title || "Untitled source"}`,
                `Provider: ${source.provider || source.sourceType || "Live source"}`,
                `URL: ${source.url || ""}`,
                `Summary: ${source.snippet || ""}`,
              ].join("\n");
            })
            .join("\n\n");

          message = [
            "You are RioMind Nexus using live web/news/source results.",
            "Answer the user's question using the live sources below.",
            "Do not say your knowledge is limited to 2024 if live sources are provided.",
            "Include a short freshness badge line at the top.",
            "Cite source titles or numbered sources where relevant.",
            "",
            `Freshness: ${liveSourcePayload?.freshness?.label || "🟢 Live Web Sources"}`,
            `Updated: ${liveSourcePayload?.freshness?.updatedAt || new Date().toISOString()}`,
            "",
            "LIVE SOURCES:",
            sourceContext,
            "",
            "USER QUESTION:",
            originalUserMessage,
          ].join("\n");
        }
      }
    } catch (error) {
      console.error("RioMind live source lookup failed", error);
    }
  }

  const detectedIntent = detectIntent(message);
  const nexusRoute = selectNexusRoute(message);

  const selectedAgent =
    RIOMIND_AGENT_REGISTRY.find((agent) => agent.id === nexusRoute.selectedAgentId) ??
    RIOMIND_AGENT_REGISTRY[0];

  if (isExcelArtifactRequest(message)) {
    const artifactInput =
      extractJsonObjectFromMessage(message) ?? extractTableDataFromMessage(message);

    if (
      artifactInput &&
      typeof artifactInput === "object" &&
      Array.isArray((artifactInput as { rows?: unknown }).rows)
    ) {
      const typedArtifactInput = artifactInput as {
        title?: unknown;
        columns?: unknown;
        rows?: unknown;
      };

      const artifact = await createExcelArtifact({
        ownerKey: getRioMindOwnerKey(request.headers),
        title:
          typeof typedArtifactInput.title === "string"
            ? typedArtifactInput.title
            : undefined,
        columns: typedArtifactInput.columns,
        rows: typedArtifactInput.rows,
        mode: inferExcelArtifactMode(message, typedArtifactInput),
      });
      registerRioMindArtifactSafely({
        ownerKey:
          request.headers.get("x-riomind-owner") ||
          request.headers.get("x-nexus-owner") ||
          "local_dev",
        artifact,
        source: "chat_artifact_generation",
      });


      const response = [
        "## Modern Excel workbook created",
        "",
        `I organized the data into a downloadable modern Excel workbook: **${artifact.name}**.`,
        "",
        "## Workbook contents",
        `- Rows: ${artifact.rowCount}`,
        `- Columns: ${artifact.columnCount}`,
        `- Sheets: ${artifact.sheets.join(", ")}`,
        "",
        "## Download",
        `[Download modern Excel workbook](${artifact.downloadUrl})`,
      ].join("\n");

      await logRioMindUsageEvent({
        ownerKey: getRioMindOwnerKey(request.headers),
        conversationId,
        requestType: "chat_excel_artifact",
        route: "artifact_generation",
        agent: selectedAgent?.id ?? null,
        capability: "Excel Artifact Generation",
        inputText: message,
        outputText: response,
        latencyMs: Date.now() - requestStartedAt,
        status: "completed",
        metadata: {
          artifactType: "excel",
          artifactName: artifact.name,
          rowCount: artifact.rowCount,
          columnCount: artifact.columnCount,
          downloadUrl: artifact.downloadUrl,
        },
      });

      return NextResponse.json({
        ok: true,
        standard: "sovereign_foundation",
        product: "RioMind Nexus",
        response,
        artifact,
      });
    }

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response: [
        "## I can create the Excel file",
        "",
        "Please provide the data in JSON format with `columns` and `rows` so I can generate a downloadable workbook.",
        "",
        "## Example",
        "```json",
        "{",
        '  "title": "Team Roster",',
        '  "columns": ["Full Name", "Phone Number", "Role", "Status"],',
        '  "rows": [',
        '    {"Full Name": "Ada Example", "Phone Number": "08000000001", "Role": "Coordinator", "Status": "Active"}',
        "  ]",
        "}",
        "```",
      ].join("\n"),
    });
  }

  const preferredProviders = selectedAgent?.recommendedModels ?? ["openai"];

  const providers = preferredProviders
    .map((id) => RIOMIND_PROVIDER_REGISTRY.find((provider) => provider.id === id))
    .filter(Boolean);

  const providerExecutionPlan = createProviderExecutionPlan(preferredProviders);
  const toolExecutionPlan = createToolExecutionPlan(nexusRoute.capability.tools);
  const sessionExecutionPlan = createSessionExecutionPlan();

  const systemPrompt = [
    "You are RioMind Nexus, the sovereign AI command interface for SpherioChain and general AI workspace tasks.",
    "Answer as RioMind Nexus: useful, direct, intelligent, complete, and easy to read.",
    "For factual or explanatory questions, give a helpful answer immediately before asking follow-up questions.",
    "Do not give shallow one-line answers when the user expects useful context.",
    "Write in a clean ChatGPT-class structure: short opening summary, clear markdown headings, short paragraphs, compact bullets, and practical next steps.",
    "Avoid clogged paragraph blocks. Break long explanations into readable sections with spacing.",
    "Use natural ChatGPT-class formatting. Do not start every answer with ## Summary. For simple factual answers, start directly with the answer in one clear paragraph, then use compact sections only when they improve readability.",
    "For file analysis requests, prefer this structure: ## What this file is, ## Main contents, ## Strengths, ## Possible improvements, ## Best use, ## Suggested next action.",
    "For image and screenshot analysis, inspect visible details carefully: UI layout, buttons, colors, icons, text, charts, diagrams, errors, warnings, and visual hierarchy. Be clear about what is visible and what is uncertain.",
    "For read-text-exactly requests, transcribe only visible text. If text is blurry, cropped, too small, or unreadable, say so instead of guessing.",
    "For document screenshots, summarize what type of document is visible, identify readable headings or fields, and avoid exposing private identifiers unless the user explicitly asks.",
    "For charts, graphs, and diagrams, explain visible axes, labels, trends, relationships, legends, missing information, and uncertainty. Do not invent exact values that are not visible.",
    "For UI screenshots, check spacing, alignment, contrast, cut-off text, duplicate elements, inconsistent button hierarchy, confusing navigation, overflow, mobile layout issues, and visual priority.",
    "For image answers, use compact visual sections when useful: ## What's visible, ## Key observations, ## Problems found, ## Suggested fix. Omit sections that do not apply.",
    "For multiple uploaded images, compare them by visible order. State what is visible in each image, what changed, which version is clearer, and any inconsistencies. Do not assume the images are related unless the user asks for comparison or the prompt implies it.",
    "For uploaded visual requests, classify the task mode from the user's wording: describe_image, read_text_exactly, ui_audit, find_visual_issues, compare_images, extract_chart_data, explain_diagram, or summarize_document_screenshot.",
    "For uploaded images, never invent text, colors, labels, dashboards, tables, buttons, icons, or errors. If a detail is not visible, say it is not visible.",
    "Never claim specific text, colors, buttons, tables, dashboards, panels, names, or icons are visible unless they are actually visible in the uploaded image.",
    "Every image answer must begin with an exact visible inventory. If multiple visible photos/panels are present, count them and describe each panel separately before giving UI, design, or accessibility recommendations.",
    "For image answers, default to concise output. Do not generate long UI audits, long tables, accessibility reports, or extended recommendations unless the user explicitly asks for them.",
    "Never add generic closing offers such as 'If you want...' or 'Would you like me to...' at the end of image analysis. End with the useful conclusion or suggested fix.",
    "For multiple images, compare only the visible high-impact differences unless the user asks for a full comparison.",
    "For screenshots, mention the most important visible problems first. Avoid explaining every minor detail unless requested.",
    "Only produce deep visual audits when the user asks for audit, detailed review, compare, chart extraction, accessibility, or full analysis.",
    "Fast Vision Mode: for ordinary image questions, keep the answer short and practical. Aim for 4-8 concise bullets after the exact visible inventory, not a long report.",
    "For code or terminal help, use: ## Diagnosis, ## Safe patch/commands, ## Verification, ## Next step.",
    "For document or business writing help, use: ## Purpose, ## Draft/Structure, ## Improvements, ## Next step.",
    "For tables or structured formatting, return clean markdown tables when appropriate and keep table cells concise.",
    "For spreadsheets or files containing sensitive personal or financial data, summarize structure and purpose first. Do not expose full account numbers, phone numbers, personal records, or private identifiers unless the user explicitly asks.",
    "If a question is ambiguous, state the likely interpretation and ask for the missing detail only after giving what can be answered safely.",
    "Do not invent live web facts, citations, images, or source links unless a real web/search tool has been executed.",
    "For public pictorial context requests, if sourced image cards are attached by Nexus, do not say you can provide an image later. Say that a sourced visual card is attached below, then keep the text answer concise.",
    "Preserve the selected route, agent, tools, and execution plan.",
    "Do not claim a tool was executed unless it was actually executed.",
    "Use recent conversation context when it is provided, but do not say that hidden context was loaded.",
    "Do not expose provider names, model names, fallback chains, or internal infrastructure in public answers.",
    "Do not announce internal route names, selected agents, matched capabilities, providers, runtime status, or debug metadata in normal public answers.",
    `Selected route: ${nexusRoute.primaryRoute}.`,
    `Selected agent: ${selectedAgent?.name}.`,
    `Matched capability: ${nexusRoute.capability.title}.`,
    `Required tools: ${nexusRoute.capability.tools.join(", ")}.`,
  ].join("\n");


  const docxArtifactInput = extractDocxArtifactInput(message);

  if (docxArtifactInput) {
    const artifact = await createDocxArtifact({
      ownerKey: getRioMindOwnerKey(request.headers),
      title: docxArtifactInput.title,
      content: docxArtifactInput.content,
      sections: docxArtifactInput.sections,
      columns: docxArtifactInput.columns,
      rows: docxArtifactInput.rows,
    });
    registerRioMindArtifactSafely({
      ownerKey:
        request.headers.get("x-riomind-owner") ||
        request.headers.get("x-nexus-owner") ||
        "local_dev",
      artifact,
      source: "chat_artifact_generation",
    });


    const response =
      "## Modern Word document created\n\n" +
      `I prepared a downloadable modern Word document: **${artifact.name}**.\n\n` +
      "## Document contents\n" +
      `- Paragraphs: ${artifact.paragraphCount}\n` +
      `- Tables: ${artifact.tableCount}\n` +
      `- Sections: ${artifact.sectionCount}\n\n` +
      "## Download\n" +
      `[Download modern Word document](${artifact.downloadUrl})`;

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: nexusRoute.primaryRoute,
      agent: selectedAgent?.id ?? null,
      capability: nexusRoute.capability.title,
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        debugRequested: exposeDebug,
        liveOk: true,
        provider: null,
        model: null,
        fallbackUsed: false,
        attemptedProviderCount: 0,
        historyMessagesIncluded: conversationContext.length,
        artifactType: "docx",
        artifactName: artifact.name,
        paragraphCount: artifact.paragraphCount,
        tableCount: artifact.tableCount,
        sectionCount: artifact.sectionCount,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      artifact,
    });
  }


  const pdfArtifactInput = extractPdfArtifactInput(message);

  if (pdfArtifactInput) {
    const artifact = await createPdfArtifact({
      ownerKey: getRioMindOwnerKey(request.headers),
      title: pdfArtifactInput.title,
      content: pdfArtifactInput.content,
      sections: pdfArtifactInput.sections,
      columns: pdfArtifactInput.columns,
      rows: pdfArtifactInput.rows,
    });
    registerRioMindArtifactSafely({
      ownerKey:
        request.headers.get("x-riomind-owner") ||
        request.headers.get("x-nexus-owner") ||
        "local_dev",
      artifact,
      source: "chat_artifact_generation",
    });



  if (shouldUseLongTermMemory(message)) {
    const memoryResult = await queryRioMindLongTermMemory({
      question: message,
      aiLayer: "nexus_ai",
      limit: 12,
    });

    const response = formatLongTermMemoryAnswer(memoryResult);

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "long_term_memory",
      agent: selectedAgent?.id ?? null,
      capability: "RioMind Long-Term Memory",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_long_term_memory",
        mode: memoryResult.mode,
        resultCount: memoryResult.memory?.resultCount,
        groupCounts: memoryResult.memory?.groupCounts,
        priority: "early_memory_before_pdf_artifact",
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      longTermMemory: memoryResult,
      ...(exposeDebug ? { debug: { route: "long_term_memory", priority: "early_memory_before_pdf_artifact", longTermMemory: memoryResult } } : {}),
    });
  }

    const response =
      "## Modern PDF document created\n\n" +
      `I prepared a downloadable modern PDF document: **${artifact.name}**.\n\n` +
      "## Document contents\n" +
      `- Pages: ${artifact.pageCount}\n` +
      `- Tables: ${artifact.tableCount}\n` +
      `- Sections: ${artifact.sectionCount}\n\n` +
      "## Download\n" +
      `[Download modern PDF document](${artifact.downloadUrl})`;

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: nexusRoute.primaryRoute,
      agent: selectedAgent?.id ?? null,
      capability: nexusRoute.capability.title,
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        debugRequested: exposeDebug,
        liveOk: true,
        provider: null,
        model: null,
        fallbackUsed: false,
        attemptedProviderCount: 0,
        historyMessagesIncluded: conversationContext.length,
        artifactType: "pdf",
        artifactName: artifact.name,
        pageCount: artifact.pageCount,
        tableCount: artifact.tableCount,
        sectionCount: artifact.sectionCount,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      artifact,
    });
  }


  const pptxArtifactInput = extractPptxArtifactInput(message);

  if (pptxArtifactInput) {
    const artifact = await createPptxArtifact({
      ownerKey: getRioMindOwnerKey(request.headers),
      title: pptxArtifactInput.title,
      content: pptxArtifactInput.content,
      sections: pptxArtifactInput.sections,
      columns: pptxArtifactInput.columns,
      rows: pptxArtifactInput.rows,
    });
    registerRioMindArtifactSafely({
      ownerKey:
        request.headers.get("x-riomind-owner") ||
        request.headers.get("x-nexus-owner") ||
        "local_dev",
      artifact,
      source: "chat_artifact_generation",
    });


    const response =
      "## Modern PowerPoint deck created\n\n" +
      `I prepared a downloadable modern PowerPoint presentation: **${artifact.name}**.\n\n` +
      "## Presentation contents\n" +
      `- Slides: ${artifact.slideCount}\n` +
      `- Tables: ${artifact.tableCount}\n` +
      `- Sections: ${artifact.sectionCount}\n\n` +
      "## Download\n" +
      `[Download modern PowerPoint deck](${artifact.downloadUrl})`;


    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: nexusRoute.primaryRoute,
      agent: selectedAgent?.id ?? null,
      capability: nexusRoute.capability.title,
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        debugRequested: exposeDebug,
        liveOk: true,
        provider: null,
        model: null,
        fallbackUsed: false,
        attemptedProviderCount: 0,
        historyMessagesIncluded: conversationContext.length,
        artifactType: "pptx",
        artifactName: artifact.name,
        slideCount: artifact.slideCount,
        tableCount: artifact.tableCount,
        sectionCount: artifact.sectionCount,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      artifact,
    });
  }

  const analyticsWorkspaceRequest =
    /analysis mode:/i.test(message) ||
    /start a nexus .*task/i.test(message) ||
    /financial modeling/i.test(message) ||
    /forecasting/i.test(message) ||
    /spreadsheet intelligence/i.test(message) ||
    /business intelligence/i.test(message) ||
    /market intelligence/i.test(message) ||
    /certification & compliance/i.test(message) ||
    /deep research analytics/i.test(message);

  if (analyticsWorkspaceRequest) {
    const analysisModeMatch = message.match(/Analysis mode:\s*(.+)/i);
    const goalMatch = message.match(/Goal \/ dataset \/ question:\s*([\s\S]*?)(?:\n\nDeliver|\nDeliver|$)/i);

    const analysisMode = analysisModeMatch?.[1]?.trim() || "Professional Analytics";
    const analyticsGoal = goalMatch?.[1]?.trim() || message;

    const response = [
      "# Nexus Analytics Workspace",
      "",
      "## Executive Summary",
      `Nexus has initialized a **${analysisMode}** analysis and will proceed with a professional structured output instead of stopping at clarification.`,
      "",
      "## User Goal",
      analyticsGoal,
      "",
      "## Working Assumptions",
      "- The goal is treated as a business or data-analysis objective.",
      "- Missing inputs are identified clearly, but Nexus will still provide a useful first-pass model.",
      "- Any forecast, valuation, or market prediction is scenario-based, not guaranteed.",
      "- The output should be usable for executive review, spreadsheet modeling, dashboards, or reports.",
      "",
      "## Analysis Framework",
      "| Area | What Nexus Will Analyze | Output |",
      "|---|---|---|",
      "| Objective | What decision the analysis supports | Clear problem statement |",
      "| Data Inputs | Required figures, files, assumptions, and time period | Data checklist |",
      "| Computation | Revenue, cost, KPI, valuation, forecast, or trend logic | Model structure |",
      "| Scenarios | Conservative, base, and aggressive assumptions | Scenario table |",
      "| Risks | Data gaps, uncertainty, market risks, execution risks | Risk notes |",
      "| Recommendations | Practical next actions | Action plan |",
      "",
      "## First-Pass Model Structure",
      "### 1. Revenue / Value Drivers",
      "- Customer count or transaction volume",
      "- Average price or revenue per customer",
      "- Conversion rate",
      "- Retention / churn",
      "- Growth rate",
      "- Expansion or upsell assumptions",
      "",
      "### 2. Cost / Resource Drivers",
      "- Fixed operating cost",
      "- Variable cost per customer or transaction",
      "- Payroll and team cost",
      "- Infrastructure or platform cost",
      "- Marketing and acquisition cost",
      "- Compliance, legal, and operational overhead",
      "",
      "### 3. KPI Layer",
      "| KPI | Formula | Purpose |",
      "|---|---|---|",
      "| Revenue | Customers × Average Revenue | Measures top-line performance |",
      "| Gross Profit | Revenue − Direct Costs | Measures operating efficiency |",
      "| Gross Margin | Gross Profit ÷ Revenue | Shows profitability quality |",
      "| CAC | Sales & Marketing ÷ New Customers | Measures acquisition efficiency |",
      "| LTV | ARPU × Margin × Customer Lifetime | Measures long-term value |",
      "| EBITDA | Revenue − Operating Expenses | Measures operating profitability |",
      "",
      "## Spreadsheet Formulas",
      "```excel",
      "=Revenue_Assumption * Customer_Count",
      "=Revenue - Direct_Costs",
      "=Gross_Profit / Revenue",
      "=XLOOKUP(A2, Assumptions[Metric], Assumptions[Value], \"Not found\")",
      "=SUMIFS(Sales[Amount], Sales[Month], B2, Sales[Region], C2)",
      "```",
      "",
      "## Recommended Workbook Tabs",
      "- Assumptions",
      "- Raw Data",
      "- KPI Summary",
      "- Revenue Model",
      "- Cost Model",
      "- Forecast Scenarios",
      "- Charts",
      "- Executive Summary",
      "",
      "## Visualization Recommendations",
      "- Revenue trend line",
      "- Scenario comparison bar chart",
      "- Cost breakdown chart",
      "- KPI dashboard cards",
      "- Sensitivity matrix",
      "",
      "## Risks and Limitations",
      "- The analysis depends on the accuracy of supplied assumptions.",
      "- No prediction should be treated as certainty.",
      "- Market, customer, pricing, and cost assumptions must be validated.",
      "- If live market intelligence is needed, Nexus should run web-grounded research before finalizing.",
      "",
      "## Actionable Next Steps",
      "1. Provide any available dataset, spreadsheet, or assumptions.",
      "2. Confirm the time horizon: monthly, quarterly, yearly, or multi-year.",
      "3. Choose the final deliverable: report, Excel model, dashboard, PDF, or PowerPoint.",
      "4. Nexus can then convert this into a full analytics report or exportable artifact.",
    ].join("\n");

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "analytics_workspace",
      agent: selectedAgent?.id ?? "data_science",
      capability: "Analytics Workspace",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        analyticsWorkspace: true,
        analyticsV2: true,
        analysisMode,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
    });
  }

  const retrievalContext = await buildRioMindContext({
    aiLayer: nexusRoute.primaryRoute === "blockchain" ? "core_ai" : "nexus_ai",
    surface: nexusRoute.primaryRoute === "blockchain" ? "spheriochain" : "nexus",
    ownerUserId: "local-user",
    query: message,
    route: nexusRoute.primaryRoute,
    limit: 6,
  });

  const retrievalAwareMessage = retrievalContext.injectedPrompt
    ? `${retrievalContext.injectedPrompt}\n\n## User Request\n${conversationAwareMessage}`
    : conversationAwareMessage;

  const hasVisionInputsForRuntime = visionInputs.length > 0;
  const isDeepVisionRuntimeTask =
    hasVisionInputsForRuntime &&
    /\b(compare|comparison|chart|diagram|audit|accessibility|detailed|deep|full|extract|all images|multiple|inconsistenc|read text exactly)\b/i.test(message);
  const fastVisionModel = process.env.RIOMIND_OPENAI_FAST_VISION_MODEL?.trim();




function selectRioMindReasoningIntent(message: string) {
  const lower = String(message || "").toLowerCase();

  const asksWhy =
    lower.includes("why") ||
    lower.includes("important") ||
    lower.includes("reason") ||
    lower.includes("explain") ||
    lower.includes("what does this mean") ||
    lower.includes("what should we do") ||
    lower.includes("next action");

  const mentionsCluster =
    lower.includes("cluster") ||
    lower.includes("connected intelligence") ||
    lower.includes("relationship") ||
    lower.includes("meeting nx-") ||
    lower.includes("nx-");

  if (!asksWhy || !mentionsCluster) return null;

  const directCluster = String(message || "").match(/(?:clusterId|cluster)\s*[:=]\s*([A-Za-z0-9:_-]+)/i);
  if (directCluster?.[1]) {
    return {
      route: "reasoning_intelligence",
      clusterId: directCluster[1],
      question: message,
    };
  }

  const meetingCode = String(message || "").match(/NX-\d{4}-[A-Z0-9]+/i);
  if (meetingCode?.[0]) {
    return {
      route: "reasoning_intelligence",
      clusterId: `meeting:${meetingCode[0]}`,
      question: message,
    };
  }

  return {
    route: "reasoning_intelligence",
    clusterId: "",
    question: message,
  };
}

async function answerRioMindReasoningQuestion(input: {
  message: string;
  clusterId?: string;
}) {
  const clustersResult = await getRioMindRelationshipClusters({
    aiLayer: "nexus_ai",
    limit: 200,
  });

  const cluster =
    (input.clusterId
      ? clustersResult.clusters.find((item: any) => item.clusterId === input.clusterId) ||
        clustersResult.clusters.find((item: any) => String(item.clusterId || "").includes(String(input.clusterId)))
      : null) ||
    clustersResult.clusters?.[0] ||
    null;

  if (!cluster) {
    return {
      ok: false,
      response:
        "## Answer from RioMind Reasoning Intelligence\n\nRioMind could not find a relationship cluster to reason over yet.",
      reasoning: null,
      cluster: null,
    };
  }

  const reasoning = buildRioMindClusterReasoning(cluster, input.message);

  const response =
    "## Answer from RioMind Reasoning Intelligence\n\n" +
    `### Executive Summary\n${reasoning.executiveSummary}\n\n` +
    `### Reasoning\n${reasoning.reasoning.map((item: string) => `- ${item}`).join("\n")}\n\n` +
    `### Evidence Used\n${reasoning.evidenceUsed.map((item: any) => `- ${item.title}`).join("\n")}\n\n` +
    `### Confidence\n${reasoning.confidence.label} — ${reasoning.confidence.explanation}\n\n` +
    `### Recommended Actions\n${reasoning.recommendations.map((item: string) => `- ${item}`).join("\n")}`;

  return {
    ok: true,
    response,
    reasoning,
    cluster: {
      clusterId: cluster.clusterId,
      title: cluster.title,
      type: cluster.type,
      importance: cluster.importance,
      confidence: cluster.confidence,
      counts: cluster.counts,
    },
  };
}


  const selectedKnowledgeRoute = selectNexusChatKnowledgeRoute(message);

  const autoLearning = await autoIngestChatKnowledge({
    message,
    conversationId,
    ownerUserId: "local-user",
    surface: "nexus_chat",
  });




  const metricTrendQuestion = extractMetricTrendQuestion(message);
  if (selectedKnowledgeRoute === "metric_trend" && metricTrendQuestion) {
    const trendResult = await getRioMindDocumentMetricTrends({
      aiLayer: "nexus_ai",
      metric: metricTrendQuestion.metric,
      limit: 1000,
    });

    const response = formatMetricTrendAnswer(trendResult, metricTrendQuestion.metric);

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "metric_trend",
      agent: selectedAgent?.id ?? null,
      capability: "RioMind Trend Intelligence",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_metric_trends",
        metric: metricTrendQuestion.metric || null,
        trendCount: trendResult.count,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      metricTrends: trendResult,
      autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null,
      ...(exposeDebug ? { debug: { route: "metric_trend", metricTrends: trendResult, autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null } } : {}),
    });
  }

  const documentDiffQuestion = extractDocumentDiffQuestion(message);
  const reasoningIntent = selectRioMindReasoningIntent(message);

  if (reasoningIntent?.route === "reasoning_intelligence") {
    const reasoningAnswer = await answerRioMindReasoningQuestion({
      message,
      clusterId: reasoningIntent.clusterId,
    });

    return NextResponse.json({
      ok: reasoningAnswer.ok,
      response: reasoningAnswer.response,
      reasoning: reasoningAnswer.reasoning,
      cluster: reasoningAnswer.cluster,
      autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null,
      ...(exposeDebug ? {
        debug: {
          route: "reasoning_intelligence",
          priority: "early_reasoning_before_generic_chat",
          cluster: reasoningAnswer.cluster,
          reasoning: reasoningAnswer.reasoning,
          autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null
        }
      } : {}),
    });
  }

  if (selectedKnowledgeRoute === "document_diff" && documentDiffQuestion) {
    const diff = await compareRioMindDocumentVersions({
      aiLayer: "nexus_ai",
      documentId: documentDiffQuestion.documentId,
      fromVersion: documentDiffQuestion.fromVersion,
      toVersion: documentDiffQuestion.toVersion,
    });

    const response = formatDocumentDiffAnswer(diff);

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "document_diff",
      agent: selectedAgent?.id ?? null,
      capability: "RioMind Document Intelligence",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: diff.ok ? "completed" : "failed",
      metadata: {
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_document_diff",
        documentId: documentDiffQuestion.documentId,
        fromVersion: diff.fromVersion || documentDiffQuestion.fromVersion || null,
        toVersion: diff.toVersion || documentDiffQuestion.toVersion || null,
      },
    });

    return NextResponse.json({
      ok: diff.ok,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      documentDiff: diff,
      autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null,
      ...(exposeDebug ? { debug: { route: "document_diff", documentDiff: diff, autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null } } : {}),
    });
  }

  if (selectedKnowledgeRoute === "long_term_memory") {
    const memoryResult = await queryRioMindLongTermMemory({
      question: message,
      aiLayer: "nexus_ai",
      limit: 12,
    });

    const response = formatLongTermMemoryAnswer(memoryResult);

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "long_term_memory",
      agent: selectedAgent?.id ?? null,
      capability: "RioMind Long-Term Memory",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_long_term_memory",
        mode: memoryResult.mode,
        resultCount: memoryResult.memory?.resultCount,
        groupCounts: memoryResult.memory?.groupCounts,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      longTermMemory: memoryResult,
      autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null,
      ...(exposeDebug ? { debug: { route: "long_term_memory", longTermMemory: memoryResult, autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null } } : {}),
    });
  }

  if (selectedKnowledgeRoute === "enterprise_search") {
    const enterpriseSearchQuery = deriveEnterpriseSearchQuery(message);

    const searchResult = await searchRioMindEnterprise({
      q: enterpriseSearchQuery,
      aiLayer: "nexus_ai",
      limit: 10,
    });

    const response = formatEnterpriseSearchAnswer(searchResult);

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "enterprise_search",
      agent: selectedAgent?.id ?? null,
      capability: "RioMind Enterprise Search",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_enterprise_search",
        originalQuery: message,
        searchQuery: enterpriseSearchQuery,
        resultCount: searchResult.count,
        groupCounts: searchResult.groupCounts,
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      enterpriseSearch: searchResult,
      autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null,
      ...(exposeDebug ? { debug: { route: "enterprise_search", enterpriseSearch: searchResult, autoLearning: autoLearning ? { ok: true, sourceId: autoLearning.sourceId, createdCounts: autoLearning.graph?.createdCounts } : null } } : {}),
    });
  }


  const meetingGraphQuestion = extractMeetingGraphQuestion(message);
  if (selectedKnowledgeRoute === "meeting_graph" && meetingGraphQuestion) {
    const graphAnswer = await answerMeetingFromKnowledgeGraph(meetingGraphQuestion);

    const response = [
      "## Answer from Nexus Meeting Knowledge Graph",
      "",
      graphAnswer.answer,
      "",
      "## Graph Summary",
      `- Topics: ${graphAnswer.graphSummary.topics.length}`,
      `- Speakers: ${graphAnswer.graphSummary.speakers.length}`,
      `- Risks: ${graphAnswer.graphSummary.risks.length}`,
      `- Transcript nodes: ${graphAnswer.graphSummary.transcriptCount}`,
      `- Translation nodes: ${graphAnswer.graphSummary.translationCount}`,
    ].join("\n");

    await logRioMindUsageEvent({
      ownerKey: getRioMindOwnerKey(request.headers),
      conversationId,
      requestType: "chat",
      route: "meeting_graph",
      agent: selectedAgent?.id ?? null,
      capability: "Meeting Knowledge Graph",
      inputText: message,
      outputText: response,
      latencyMs: Date.now() - requestStartedAt,
      status: "completed",
      metadata: {
        meetingCode: meetingGraphQuestion.meetingCode,
        mode: graphAnswer.mode,
        provider: null,
        model: null,
        fallbackUsed: false,
        source: "riomind_meeting_graph_query",
      },
    });

    return NextResponse.json({
      ok: true,
      standard: "sovereign_foundation",
      product: "RioMind Nexus",
      response,
      imageCards: [],
      meetingGraph: graphAnswer,
      ...(exposeDebug ? { debug: { route: "meeting_graph", meetingGraph: graphAnswer } } : {}),
    });
  }

  const liveProviderResult = await runProviderRuntime({
    selectedProvider: hasVisionInputsForRuntime ? "openai" : providerExecutionPlan.selectedProvider,
    candidateProviders: hasVisionInputsForRuntime ? ["openai", "openrouter"] : providerExecutionPlan.configuredProviders,
    model: hasVisionInputsForRuntime && !isDeepVisionRuntimeTask && fastVisionModel ? fastVisionModel : undefined,
    maxOutputTokens: hasVisionInputsForRuntime ? (isDeepVisionRuntimeTask ? 850 : 420) : undefined,
    message: visionContext
      ? `${retrievalAwareMessage}\n${visionContext}\n\nRESPONSE REQUIREMENT: Start with 'Exact visible inventory'. Count visible image panels/photos if there are multiple. Describe each visible panel/object briefly and exactly. Keep the default image answer concise: exact inventory first, then only 3-5 key observations. Do not produce a long UI audit unless the user explicitly asks for a full audit, accessibility report, or detailed design review.`
      : retrievalAwareMessage,
    systemPrompt,
    images: visionInputs,
  });

  const retrievalFallbackResponse = retrievalContext.items.length
    ? [
        "## Answer from retrieved RioMind context",
        "",
        ...retrievalContext.items.slice(0, 5).map((item, index) =>
          [
            `### ${index + 1}. ${item.title}`,
            item.content,
          ].join("\n")
        ),
        "",
        "## Source status",
        "This answer was generated from Nexus retrieved context because the live model provider was unavailable.",
      ].join("\n")
    : "";

  const fallbackResponse =
    retrievalFallbackResponse ||
    (nexusRoute.primaryRoute === "file_analysis"
      ? [
          "## I could not fully read this file yet",
          "",
          "I can see that a file was attached, but I could not access enough readable content to give a reliable explanation.",
          "",
          "## What to do next",
          "- Re-upload the file and ask again.",
          "- If it is a PDF, DOCX, XLSX, or PPTX, make sure the document contains selectable text rather than only scanned images.",
          "- If the file is image-scanned, Nexus will need OCR/vision extraction before it can explain the contents accurately.",
          "",
          "## Note",
          "I will not guess private file contents when readable extraction is unavailable.",
        ].join("\n")
      : [
          "## I could not complete that response",
          "",
          "Nexus was not able to generate a complete answer for this request.",
          "",
          "## What you can try",
          "- Send the message again.",
          "- Add more detail if the request is complex.",
          "- Attach the relevant file again if the answer depends on a document.",
        ].join("\n"));

  const response =
    liveProviderResult?.ok && liveProviderResult.response
      ? liveProviderResult.response
      : fallbackResponse;

    const imageCards: NexusImageCard[] = await getPublicPictorialCards(message);
    const publicResponse = cleanPictorialResponseWhenCardsExist(response, imageCards);

  await logRioMindUsageEvent({
    ownerKey: getRioMindOwnerKey(request.headers),
    conversationId,
    requestType: "chat",
    route: nexusRoute.primaryRoute,
    agent: selectedAgent?.id ?? null,
    capability: nexusRoute.capability.title,
    inputText: message,
    outputText: publicResponse,
    latencyMs: Date.now() - requestStartedAt,
    status: liveProviderResult?.status ?? "completed",
    metadata: {
      debugRequested: exposeDebug,
      liveOk: Boolean(liveProviderResult?.ok),
      provider: liveProviderResult?.provider ?? null,
      model: liveProviderResult?.model ?? null,
      fallbackUsed: Boolean(liveProviderResult?.fallbackUsed),
      attemptedProviderCount: liveProviderResult?.attemptedProviders?.length ?? 0,
      historyMessagesIncluded: conversationContext.length,
      retrievalContextItems: retrievalContext.items.length,
      retrievalConfidence: retrievalContext.confidence,
      retrievalSourceTypes: retrievalContext.metadata.sourceTypes,
    },
  });

  return NextResponse.json({
    ok: true,
    standard: "sovereign_foundation",
    product: "RioMind Nexus",
    response: publicResponse,
      imageCards,
    ...(exposeDebug
      ? {
          debug: {
            routing: {
              detectedIntent,
              primaryRoute: nexusRoute.primaryRoute,
              selectedAgent: selectedAgent?.id,
              selectedAgentName: selectedAgent?.name,
              preferredProviders,
              providers,
              requiredTools: nexusRoute.capability.tools,
              relatedCapability: nexusRoute.capability,
            },
            execution: {
              providerExecutionPlan,
              toolExecutionPlan,
              sessionExecutionPlan,
            },
            liveProviderResult,
            conversation: {
              conversationId,
              historyMessagesIncluded: conversationContext.length,
              retrievalContextItems: retrievalContext.items.length,
              retrievalConfidence: retrievalContext.confidence,
              retrievalSourceTypes: retrievalContext.metadata.sourceTypes,
            },
          },
        }
      : {}),
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    standard: "sovereign_foundation",
    product: "RioMind Nexus",
    endpoint: "chat",
    methods: ["POST"],
    publicResponsePolicy: "provider_details_hidden_by_default",
    debugPolicy: "provider_details_available_only_when_explicit_debug_is_requested",
  });
}
