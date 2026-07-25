import { NextRequest, NextResponse } from "next/server";
import { ensureRioMindAiFoundationSchema, getRioMindAiFoundationPool, normalizeAiLayer } from "@/lib/riomind/ai-foundation/db";
import { linkMemoryToKnowledgeGraph } from "@/lib/riomind/knowledge-graph/kg-autopopulate";

export async function GET(req: NextRequest) {
  try {
    await ensureRioMindAiFoundationSchema();
    const { searchParams } = new URL(req.url);
    const aiLayer = normalizeAiLayer(searchParams.get("aiLayer") || searchParams.get("ai_layer"));
    const surface = searchParams.get("surface") || "nexus";
    const ownerUserId = searchParams.get("ownerUserId") || searchParams.get("owner_user_id") || "local-user";

    const result = await getRioMindAiFoundationPool().query(
      `SELECT * FROM riomind_memory
       WHERE ai_layer = $1 AND surface = $2 AND owner_user_id = $3
       ORDER BY updated_at DESC LIMIT 100`,
      [aiLayer, surface, ownerUserId]
    );

    return NextResponse.json({ ok: true, memory: result.rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureRioMindAiFoundationSchema();
    const body = await req.json();

    if (!body?.key || !body?.value) {
      return NextResponse.json({ ok: false, error: "key and value are required" }, { status: 400 });
    }

    const aiLayer = normalizeAiLayer(body.aiLayer || body.ai_layer);
    const result = await getRioMindAiFoundationPool().query(
      `INSERT INTO riomind_memory
       (ai_layer, surface, owner_user_id, memory_type, key, value, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (ai_layer, surface, owner_user_id, memory_type, key)
       DO UPDATE SET value = EXCLUDED.value, metadata = EXCLUDED.metadata, updated_at = now()
       RETURNING *`,
      [
        aiLayer,
        body.surface || "nexus",
        body.ownerUserId || body.owner_user_id || "local-user",
        body.memoryType || body.memory_type || "project",
        body.key,
        body.value,
        body.metadata || {},
      ]
    );

    await linkMemoryToKnowledgeGraph({
      aiLayer,
      surface: body.surface || "nexus",
      memoryId: result.rows[0].id,
      memoryType: result.rows[0].memory_type,
      key: result.rows[0].key,
      value: result.rows[0].value,
    }).catch(() => null);

    return NextResponse.json({ ok: true, memory: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
