export type StructuredDocumentMetric = {
  name: string;
  valueText: string;
  valueNumber?: number | null;
  unit?: string | null;
  currency?: string | null;
  confidence: number;
};

export type StructuredDocument = {
  metadata: {
    title: string;
    documentType: string;
    language: string;
    tags: string[];
  };
  sections: Array<{ heading: string; text: string }>;
  financialMetrics: StructuredDocumentMetric[];
  dates: string[];
  people: string[];
  organizations: string[];
  technologies: string[];
  projects: string[];
  extractedText: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => String(v || "").trim()).filter(Boolean))).slice(0, 60);
}

function numberFromText(value: string) {
  const cleaned = String(value || "").replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  let n = Number(match[1]);
  if (/\bmillion\b|\bM\b/.test(value)) n *= 1_000_000;
  if (/\bbillion\b|\bB\b/.test(value)) n *= 1_000_000_000;

  return Number.isFinite(n) ? n : null;
}

function extractMetrics(text: string): StructuredDocumentMetric[] {
  const metrics: StructuredDocumentMetric[] = [];
  const patterns = [
    { name: "Revenue", re: /\brevenue(?:\s+projection)?\s+(?:is|was|reached|increased to)?\s*\$?\s*([0-9,.]+(?:\s*(?:million|billion|M|B|dollars|USD))?)/gi },
    { name: "Growth", re: /\bgrowth(?:\s+target)?\s+(?:is|was|reached)?\s*([0-9,.]+)\s*(percent|%)/gi },
    { name: "Customers", re: /\bcustomers?\s+(?:reached|is|was)?\s*([0-9,.]+)/gi },
    { name: "EBITDA", re: /\bebitda\s+(?:is|was)?\s*\$?\s*([0-9,.]+(?:\s*(?:million|billion|M|B|dollars|USD))?)/gi },
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.re)) {
      const valueText = match[0].trim();
      metrics.push({
        name: pattern.name,
        valueText,
        valueNumber: numberFromText(valueText),
        unit: /percent|%/i.test(valueText) ? "percent" : null,
        currency: /\$|dollars|usd/i.test(valueText) ? "USD" : null,
        confidence: 0.82,
      });
    }
  }

  return metrics;
}

export function parseStructuredDocument(input: {
  title?: string;
  documentType?: string;
  text: string;
}): StructuredDocument {
  const text = String(input.text || "").replace(/\s+/g, " ").trim();
  const title = input.title || text.split(".")[0]?.slice(0, 120) || "Untitled Document";

  const sections = text
    .split(/\n\s*\n/)
    .map((part, index) => ({
      heading: index === 0 ? "Overview" : `Section ${index + 1}`,
      text: part.trim(),
    }))
    .filter((s) => s.text);

  const people = unique(Array.from(text.matchAll(/\b(CEO|CFO|CTO|Founder|John|Finance Lead|Manager|Admin)\b/g)).map((m) => m[0]));
  const organizations = unique(Array.from(text.matchAll(/\b(RioMind|Nexus|SpherioChain|Finance|Enterprise|Provider|Deepgram|OpenAI)\b/gi)).map((m) => m[0]));
  const technologies = unique(Array.from(text.matchAll(/\b(Knowledge Graph|Enterprise Search|Continuous Learning|Long-Term Memory|Workflow|Agent|PDF|DOCX|XLSX|PPTX|API)\b/gi)).map((m) => m[0]));
  const projects = unique(Array.from(text.matchAll(/\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){1,4}\s+(?:Project|Dashboard|Platform|Pipeline|Engine))\b/g)).map((m) => m[0]));
  const dates = unique(Array.from(text.matchAll(/\b(?:Q[1-4]\s+\d{4}|Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December|\d{4}-\d{2}-\d{2})\b/g)).map((m) => m[0]));

  const tags = unique([
    ...(input.documentType ? [input.documentType] : []),
    ...organizations,
    ...technologies,
  ]).slice(0, 20);

  return {
    metadata: {
      title,
      documentType: input.documentType || "document",
      language: "en",
      tags,
    },
    sections: sections.length ? sections : [{ heading: "Overview", text }],
    financialMetrics: extractMetrics(text),
    dates,
    people,
    organizations,
    technologies,
    projects,
    extractedText: text,
  };
}
