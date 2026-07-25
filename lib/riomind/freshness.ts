
export type FreshnessDecision = {
  needsFreshness: boolean;
  mode: "knowledge_only" | "web" | "news" | "official" | "research";
  reasons: string[];
};

export function detectFreshnessNeed(input: string): FreshnessDecision {
  const text = String(input || "").toLowerCase();

  const currentTerms = [
    "latest", "current", "today", "now", "recent", "this week", "this month",
    "2024", "2025", "2026", "news", "price", "schedule", "release",
    "update", "who is the current", "new version", "breaking"
  ];

  const officialTerms = [
    "official", "documentation", "docs", "website", "company site", "release notes",
    "api docs", "whitepaper"
  ];

  const researchTerms = [
    "research", "compare sources", "verify", "citations", "sources", "report",
    "deep research", "evidence"
  ];

  const reasons: string[] = [];

  if (currentTerms.some((term) => text.includes(term))) reasons.push("current_or_recent_information_requested");
  if (officialTerms.some((term) => text.includes(term))) reasons.push("official_source_requested");
  if (researchTerms.some((term) => text.includes(term))) reasons.push("multi_source_research_requested");

  if (!reasons.length) {
    return {
      needsFreshness: false,
      mode: "knowledge_only",
      reasons: ["no_freshness_signal_detected"],
    };
  }

  if (researchTerms.some((term) => text.includes(term))) {
    return { needsFreshness: true, mode: "research", reasons };
  }

  if (officialTerms.some((term) => text.includes(term))) {
    return { needsFreshness: true, mode: "official", reasons };
  }

  if (text.includes("news") || text.includes("breaking") || text.includes("recent")) {
    return { needsFreshness: true, mode: "news", reasons };
  }

  return { needsFreshness: true, mode: "web", reasons };
}
