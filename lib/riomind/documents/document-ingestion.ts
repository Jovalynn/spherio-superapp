import { ingestRioMindKnowledge } from "../learning/learning-ingestion";
import { registerRioMindDocument } from "./document-registry";
import { recordRioMindKnowledgeProvenance } from "./document-provenance";
import { parseStructuredDocument } from "./structured-document-parser";
import { upsertRioMindKgEdge, upsertRioMindKgNode } from "../knowledge-graph/kg-engine";

export async function ingestRioMindDocument(input: {
  aiLayer?: unknown;
  surface?: string;
  documentId?: string;
  documentType?: string;
  title?: string;
  text: string;
  ownerUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const documentType = String(input.documentType || "text").toLowerCase();
  const documentId = input.documentId || `document:${Date.now()}`;
  const title = input.title || "Untitled Document";

  const structuredDocument = parseStructuredDocument({
    title,
    documentType,
    text: input.text || "",
  });

  const registry = await registerRioMindDocument({
    aiLayer: input.aiLayer || "nexus_ai",
    surface: input.surface || "nexus_documents",
    documentId,
    title,
    documentType,
    text: input.text || "",
    ownerUserId: input.ownerUserId || "local-user",
    metadata: input.metadata || {},
  });

  if (registry.alreadySeen) {
    return {
      ok: true,
      skipped: true,
      reason: "document_unchanged",
      sourceId: documentId,
      title,
      registry,
      knowledge: null,
      graph: { createdCounts: { entities: 0, topics: 0, facts: 0, decisions: 0, actionItems: 0, risks: 0 } },
      memory: null,
      searchable: true,
      provenance: { ok: true, count: 0, rows: [] },
    };
  }

  const learned = await ingestRioMindKnowledge({
    aiLayer: input.aiLayer || "nexus_ai",
    surface: input.surface || "nexus_documents",
    sourceType: "document",
    sourceId: `${documentId}:v${registry.version}`,
    title,
    text: input.text || "",
    ownerUserId: input.ownerUserId || "local-user",
    metadata: {
      documentType,
      documentId,
      documentVersion: registry.version,
      contentHash: registry.contentHash,
      structuredDocument: {
        metadata: structuredDocument.metadata,
        sections: structuredDocument.sections.slice(0, 10),
        financialMetrics: structuredDocument.financialMetrics,
        dates: structuredDocument.dates,
        people: structuredDocument.people,
        organizations: structuredDocument.organizations,
        technologies: structuredDocument.technologies,
        projects: structuredDocument.projects,
      },
      changed: registry.changed,
      previousVersion: registry.previous?.version || null,
      ...(input.metadata || {}),
    },
  });

  const provenance = await recordRioMindKnowledgeProvenance({
    aiLayer: input.aiLayer || "nexus_ai",
    sourceType: "document",
    sourceId: documentId,
    sourceTitle: title,
    sourceVersion: registry.version,
    sourceHash: registry.contentHash,
    extracted: {
      ...learned.knowledge,
      financialMetrics: structuredDocument.financialMetrics,
    },
    metadata: {
      documentType,
      documentId,
      documentVersion: registry.version,
      contentHash: registry.contentHash,
      structuredDocument: {
        metadata: structuredDocument.metadata,
        sections: structuredDocument.sections.slice(0, 10),
        financialMetrics: structuredDocument.financialMetrics,
        dates: structuredDocument.dates,
        people: structuredDocument.people,
        organizations: structuredDocument.organizations,
        technologies: structuredDocument.technologies,
        projects: structuredDocument.projects,
      },
      changed: registry.changed,
    },
  });


  const metricNodes = [];
  const sourceNode = learned.graph?.sourceNode;

  if (sourceNode?.id) {
    for (const metric of structuredDocument.financialMetrics) {
      const metricKey = `${documentId}:v${registry.version}:metric:${metric.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}:${String(metric.valueNumber ?? metric.valueText).replace(/[^a-z0-9.]+/gi, "_")}`;

      const metricNode = await upsertRioMindKgNode({
        aiLayer: input.aiLayer || "nexus_ai",
        nodeType: "document_metric",
        nodeKey: metricKey,
        title: `${metric.name}: ${metric.valueText}`,
        description: `${metric.name} extracted from ${title}`,
        metadata: {
          documentId,
          documentVersion: registry.version,
          documentType,
          metric,
          contentHash: registry.contentHash,
        },
      });

      await upsertRioMindKgEdge({
        aiLayer: input.aiLayer || "nexus_ai",
        fromNodeId: sourceNode.id,
        toNodeId: metricNode.id,
        relation: "has_metric",
        confidence: metric.confidence || 0.82,
        metadata: {
          documentId,
          documentVersion: registry.version,
          metricName: metric.name,
        },
      });

      metricNodes.push(metricNode);
    }
  }

  return {
    ...learned,
    structuredDocument,
    metricNodes,
    registry,
    provenance,
  };
}
