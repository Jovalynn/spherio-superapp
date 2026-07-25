import { NextRequest, NextResponse } from "next/server";
import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "@/lib/riomind/ai-foundation/db";

export async function GET(req: NextRequest) {
  try {
    await ensureRioMindAiFoundationSchema();

    const url = new URL(req.url);
    const aiLayer = normalizeAiLayer(url.searchParams.get("aiLayer") || "nexus_ai");
    const limit = Math.min(Number(url.searchParams.get("limit") || 24), 100);

    const db = getRioMindAiFoundationPool();

    const [nodes, groups, edges] = await Promise.all([
      db.query(
        `SELECT id, node_type, node_key, title, description, metadata, updated_at
         FROM riomind_kg_nodes
         WHERE ai_layer=$1
         ORDER BY updated_at DESC
         LIMIT $2`,
        [aiLayer, limit]
      ),
      db.query(
        `SELECT node_type, count(*)::int AS count
         FROM riomind_kg_nodes
         WHERE ai_layer=$1
         GROUP BY node_type
         ORDER BY count DESC
         LIMIT 12`,
        [aiLayer]
      ),
      db.query(
        `SELECT count(*)::int AS count
         FROM riomind_kg_edges
         WHERE ai_layer=$1`,
        [aiLayer]
      ),
    ]);

    return NextResponse.json({
      ok: true,
      surface: "knowledge_intelligence",
      aiLayer,
      summary: {
        nodes: nodes.rowCount || 0,
        edgeCount: edges.rows?.[0]?.count || 0,
        groups: groups.rows || [],
      },
      nodes: nodes.rows || [],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown knowledge intelligence error" },
      { status: 500 }
    );
  }
}
