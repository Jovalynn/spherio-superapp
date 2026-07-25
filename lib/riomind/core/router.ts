export type RioMindIntent =
  | "general"
  | "research"
  | "developer"
  | "business"
  | "education"
  | "blockchain"
  | "legal"
  | "medical"
  | "finance"
  | "creator";

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function detectIntent(message: string): RioMindIntent {
  const text = message.toLowerCase();

  if (
    hasAny(text, [
      "blockchain",
      "token",
      "smart contract",
      "dex",
      "rioex",
      "riodex",
      "spheriochain",
      "validator",
      "staking",
      "governance",
    ])
  ) {
    return "blockchain";
  }

  if (
    hasAny(text, [
      "android studio",
      "android app",
      "android wallet",
      "android wallet app",
      "wallet app",
      "mobile wallet",
      "mobile wallet app",
      "kotlin",
      "gradle",
      "apk",
      "mobile app",
      "react native",
      "flutter",
      "repository",
      "repo",
      "github",
      "codebase",
      "monorepo",
      "patch my code",
      "fix my code",
      "write code",
      "debug",
      "typescript",
      "javascript",
      "python",
      "api",
      "component",
      "function",
      "terminal",
      "command line",
      "shell",
      "bash",
      "ubuntu",
      "docker",
      "build error",
      "run command",
    ])
  ) {
    return "developer";
  }

  if (
    hasAny(text, [
      "generate an image",
      "create an image",
      "make an image",
      "draw",
      "render",
      "logo",
      "visual",
      "picture",
      "image analysis",
      "look at this image",
      "screenshot",
      "vision",
      "creator",
      "content",
      "studio",
      "social media",
    ])
  ) {
    return "creator";
  }

  if (
    hasAny(text, [
      "create a document",
      "write a document",
      "document editor",
      "proposal",
      "whitepaper",
      "paper",
      "report",
      "draft",
      "artifact",
      "presentation",
      "slides",
      "spreadsheet",
      "canvas",
      "generate a file",
      "startup",
      "business",
      "launch",
      "go to market",
      "market strategy",
    ])
  ) {
    return "business";
  }

  if (
    hasAny(text, [
      "learn",
      "student",
      "teach",
      "exam",
      "course",
      "quiz",
      "flashcards",
      "curriculum",
    ])
  ) {
    return "education";
  }

  if (
    hasAny(text, [
      "legal",
      "contract",
      "clause",
      "compliance",
      "regulation",
    ])
  ) {
    return "legal";
  }

  if (
    hasAny(text, [
      "medical",
      "clinical",
      "healthcare",
      "diagnosis",
      "patient",
      "treatment",
    ])
  ) {
    return "medical";
  }

  if (
    hasAny(text, [
      "finance",
      "trading",
      "investment",
      "portfolio",
      "market analysis",
      "risk analysis",
      "forex",
      "stocks",
    ])
  ) {
    return "finance";
  }

  if (
    hasAny(text, [
      "research",
      "literature review",
      "citation",
      "science",
      "scientific",
      "hypothesis",
      "dataset",
    ])
  ) {
    return "research";
  }

  return "general";
}
