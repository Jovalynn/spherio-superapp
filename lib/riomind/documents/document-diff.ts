import { listRioMindKnowledgeProvenance } from "./document-provenance";

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => String(v || "").trim()).filter(Boolean)));
}

export async function compareRioMindDocumentVersions(input: {
  aiLayer?: unknown;
  documentId: string;
  fromVersion?: number;
  toVersion?: number;
}) {
  const provenance = await listRioMindKnowledgeProvenance({
    aiLayer: input.aiLayer || "nexus_ai",
    sourceId: input.documentId,
    limit: 500,
  });

  const rows = provenance.provenance || [];
  const versions = unique(rows.map((row: any) => String(row.source_version)))
    .map(Number)
    .filter(Boolean)
    .sort((a, b) => a - b);

  const toVersion = input.toVersion || versions[versions.length - 1];
  const fromVersion = input.fromVersion || versions[versions.length - 2];

  if (!fromVersion || !toVersion || fromVersion === toVersion) {
    return {
      ok: false,
      error: "Two different document versions are required for comparison.",
      documentId: input.documentId,
      versions,
    };
  }

  function rowsFor(version: number) {
    return rows.filter((row: any) => Number(row.source_version) === Number(version));
  }

  const before = rowsFor(fromVersion);
  const after = rowsFor(toVersion);

  function valuesByKind(sourceRows: any[], kind: string) {
    return unique(
      sourceRows
        .filter((row: any) => row.knowledge_kind === kind)
        .map((row: any) => row.knowledge_text)
    );
  }

  function diff(kind: string) {
    const beforeValues = valuesByKind(before, kind);
    const afterValues = valuesByKind(after, kind);

    return {
      added: afterValues.filter((value) => !beforeValues.includes(value)),
      removed: beforeValues.filter((value) => !afterValues.includes(value)),
      unchanged: afterValues.filter((value) => beforeValues.includes(value)),
    };
  }

  const facts = diff("fact");
  const decisions = diff("decision");
  const actionItems = diff("action_item");
  const risks = diff("risk");
  const topics = diff("topic");

  const summaryParts = [];

  if (facts.added.length || facts.removed.length) {
    summaryParts.push(`Facts changed: +${facts.added.length}, -${facts.removed.length}`);
  }

  if (decisions.added.length || decisions.removed.length) {
    summaryParts.push(`Decisions changed: +${decisions.added.length}, -${decisions.removed.length}`);
  }

  if (actionItems.added.length || actionItems.removed.length) {
    summaryParts.push(`Action items changed: +${actionItems.added.length}, -${actionItems.removed.length}`);
  }

  if (risks.added.length || risks.removed.length) {
    summaryParts.push(`Risks changed: +${risks.added.length}, -${risks.removed.length}`);
  }

  if (!summaryParts.length) {
    summaryParts.push("No material extracted-knowledge changes detected.");
  }

  return {
    ok: true,
    documentId: input.documentId,
    fromVersion,
    toVersion,
    versions,
    summary: summaryParts.join("; "),
    changes: {
      facts,
      decisions,
      actionItems,
      risks,
      topics,
    },
  };
}
