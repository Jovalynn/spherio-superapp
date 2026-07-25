import { NextRequest, NextResponse } from "next/server";
import { getRioMindEvidenceBundle } from "@/lib/riomind/intelligence/evidence-engine";

function normalizeEvidenceItem(item: any) {
  if (!item) return null;

  const type =
    item.type ||
    (item.sourceId ? "document" : null) ||
    item.memoryType ||
    item.trace?.nodeType ||
    "evidence";

  const title =
    item.title ||
    item.sourceId ||
    item.nodeKey ||
    item.trace?.nodeKey ||
    item.trace?.key ||
    "Evidence item";

  const summary =
    item.summary ||
    item.valueText ||
    item.description ||
    item.status ||
    item.documentType ||
    "";

  return {
    ...item,
    type,
    title,
    summary,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const metric = url.searchParams.get("metric") || "Revenue";
    const type = url.searchParams.get("type") || "metric";
    const id = url.searchParams.get("id") || "";

    const bundle = await getRioMindEvidenceBundle({
      aiLayer: url.searchParams.get("aiLayer") || "nexus_ai",
      metric,
      limit: 50,
    });

    const evidence = bundle.evidence || {};

    const groups = [
      ...(evidence.documents || []),
      ...(evidence.metrics || []),
      ...(evidence.decisions || []),
      ...(evidence.risks || []),
      ...(evidence.memories || []),
    ].map((item: any) => normalizeEvidenceItem(item)).filter(Boolean);

    let item: any = null;

    if (id) {
      item = groups.find((x: any) =>
        x.sourceId === id ||
        x.title === id ||
        x.nodeId === id ||
        x.nodeKey === id ||
        x.trace?.nodeId === id ||
        x.trace?.nodeKey === id ||
        x.trace?.key === id
      );
    }

    if (!item && type !== "all") {
      item = groups.find((x: any) => x.type === type);
    }

    if (!item) {
      item = groups[0] || null;
    }

    return NextResponse.json({
      ok: true,
      surface: "evidence_detail",
      target: { metric, type, id },
      confidence: bundle.confidence,
      conclusion: bundle.conclusion,
      evidence: item,
      traceability: {
        source: item?.trace?.source || null,
        nodeId: item?.trace?.nodeId || null,
        nodeKey: item?.trace?.nodeKey || null,
        key: item?.trace?.key || null,
        updatedAt: item?.trace?.updatedAt || null,
      },
      relatedEvidence: groups.filter((x: any) => x !== item).slice(0, 8),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
