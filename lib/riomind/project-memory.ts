import { randomUUID } from "crypto";

import { getRioMindPgPool } from "@/lib/riomind/db";

export type RioMindProject = {
  id: string;
  ownerKey: string;
  name: string;
  description: string | null;
  status: string;
  languagePreferences: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RioMindProjectMemory = {
  id: string;
  ownerKey: string;
  projectId: string;
  memoryType: string;
  title: string;
  content: string;
  importance: number;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function normalizeOwnerKey(value: string) {
  return String(value || "local_dev")
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .slice(0, 120) || "local_dev";
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function clampImportance(value: unknown) {
  const numeric = Number(value ?? 3);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(Math.max(Math.round(numeric), 1), 5);
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapProject(row: any): RioMindProject {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    name: row.name,
    description: row.description,
    status: row.status,
    languagePreferences: row.language_preferences ?? {},
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMemory(row: any): RioMindProjectMemory {
  return {
    id: row.id,
    ownerKey: row.owner_key,
    projectId: row.project_id,
    memoryType: row.memory_type,
    title: row.title,
    content: row.content,
    importance: Number(row.importance ?? 3),
    source: row.source,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRioMindProjects(input: {
  ownerKey: string;
  status?: string | null;
  search?: string | null;
  limit?: number;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const limit = Math.min(Math.max(Number(input.limit || 50), 1), 100);
  const status = cleanText(input.status || "");
  const search = cleanText(input.search || "");

  const params: unknown[] = [ownerKey];
  const where = ["owner_key = $1"];

  if (status && status !== "all") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  params.push(limit);

  const result = await db.query(
    `
      SELECT
        id,
        owner_key,
        name,
        description,
        status,
        language_preferences,
        metadata,
        created_at,
        updated_at
      FROM riomind_projects
      WHERE ${where.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapProject);
}

export async function getRioMindProject(input: {
  ownerKey: string;
  projectId: string;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const projectId = cleanText(input.projectId);

  const result = await db.query(
    `
      SELECT
        id,
        owner_key,
        name,
        description,
        status,
        language_preferences,
        metadata,
        created_at,
        updated_at
      FROM riomind_projects
      WHERE owner_key = $1 AND id = $2
      LIMIT 1
    `,
    [ownerKey, projectId]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function createRioMindProject(input: {
  ownerKey: string;
  name: string;
  description?: string | null;
  status?: string | null;
  languagePreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const name = cleanText(input.name);

  if (!name) {
    throw new Error("project_name_required");
  }

  const id = randomUUID();
  const status = cleanText(input.status || "active") || "active";

  const result = await db.query(
    `
      INSERT INTO riomind_projects (
        id,
        owner_key,
        name,
        description,
        status,
        language_preferences,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
      RETURNING
        id,
        owner_key,
        name,
        description,
        status,
        language_preferences,
        metadata,
        created_at,
        updated_at
    `,
    [
      id,
      ownerKey,
      name,
      cleanText(input.description || "") || null,
      status,
      JSON.stringify(asObject(input.languagePreferences)),
      JSON.stringify(asObject(input.metadata)),
    ]
  );

  return mapProject(result.rows[0]);
}

export async function updateRioMindProject(input: {
  ownerKey: string;
  projectId: string;
  name?: string;
  description?: string | null;
  status?: string;
  languagePreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const projectId = cleanText(input.projectId);

  const existing = await getRioMindProject({ ownerKey, projectId });

  if (!existing) {
    return null;
  }

  const result = await db.query(
    `
      UPDATE riomind_projects
      SET
        name = $3,
        description = $4,
        status = $5,
        language_preferences = $6::jsonb,
        metadata = $7::jsonb,
        updated_at = NOW()
      WHERE owner_key = $1 AND id = $2
      RETURNING
        id,
        owner_key,
        name,
        description,
        status,
        language_preferences,
        metadata,
        created_at,
        updated_at
    `,
    [
      ownerKey,
      projectId,
      cleanText(input.name ?? existing.name) || existing.name,
      input.description === undefined
        ? existing.description
        : cleanText(input.description || "") || null,
      cleanText(input.status ?? existing.status) || existing.status,
      JSON.stringify(
        input.languagePreferences === undefined
          ? existing.languagePreferences
          : asObject(input.languagePreferences)
      ),
      JSON.stringify(input.metadata === undefined ? existing.metadata : asObject(input.metadata)),
    ]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function listRioMindProjectMemories(input: {
  ownerKey: string;
  projectId: string;
  memoryType?: string | null;
  search?: string | null;
  limit?: number;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const projectId = cleanText(input.projectId);
  const limit = Math.min(Math.max(Number(input.limit || 50), 1), 100);
  const memoryType = cleanText(input.memoryType || "");
  const search = cleanText(input.search || "");

  const params: unknown[] = [ownerKey, projectId];
  const where = ["owner_key = $1", "project_id = $2"];

  if (memoryType && memoryType !== "all") {
    params.push(memoryType);
    where.push(`memory_type = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`);
  }

  params.push(limit);

  const result = await db.query(
    `
      SELECT
        id,
        owner_key,
        project_id,
        memory_type,
        title,
        content,
        importance,
        source,
        metadata,
        created_at,
        updated_at
      FROM riomind_project_memories
      WHERE ${where.join(" AND ")}
      ORDER BY importance DESC, created_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(mapMemory);
}

export async function createRioMindProjectMemory(input: {
  ownerKey: string;
  projectId: string;
  memoryType?: string;
  title: string;
  content: string;
  importance?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getRioMindPgPool();
  const ownerKey = normalizeOwnerKey(input.ownerKey);
  const projectId = cleanText(input.projectId);
  const title = cleanText(input.title);
  const content = String(input.content || "").trim();

  if (!title) {
    throw new Error("memory_title_required");
  }

  if (!content) {
    throw new Error("memory_content_required");
  }

  const project = await getRioMindProject({ ownerKey, projectId });

  if (!project) {
    throw new Error("project_not_found");
  }

  const id = randomUUID();

  const result = await db.query(
    `
      INSERT INTO riomind_project_memories (
        id,
        owner_key,
        project_id,
        memory_type,
        title,
        content,
        importance,
        source,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      RETURNING
        id,
        owner_key,
        project_id,
        memory_type,
        title,
        content,
        importance,
        source,
        metadata,
        created_at,
        updated_at
    `,
    [
      id,
      ownerKey,
      projectId,
      cleanText(input.memoryType || "note") || "note",
      title,
      content,
      clampImportance(input.importance),
      cleanText(input.source || "manual") || "manual",
      JSON.stringify(asObject(input.metadata)),
    ]
  );

  await db.query(
    `
      UPDATE riomind_projects
      SET updated_at = NOW()
      WHERE owner_key = $1 AND id = $2
    `,
    [ownerKey, projectId]
  );

  return mapMemory(result.rows[0]);
}
