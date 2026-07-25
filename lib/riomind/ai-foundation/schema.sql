CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS riomind_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  surface TEXT NOT NULL DEFAULT 'nexus',
  owner_user_id TEXT NOT NULL DEFAULT 'local-user',
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_uri TEXT,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES riomind_documents(id) ON DELETE CASCADE,
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(content,''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riomind_document_chunks_search
ON riomind_document_chunks USING GIN(search_vector);

CREATE TABLE IF NOT EXISTS riomind_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID REFERENCES riomind_document_chunks(id) ON DELETE CASCADE,
  provider TEXT,
  model TEXT,
  dimensions INTEGER,
  embedding JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_retrieval_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  surface TEXT NOT NULL DEFAULT 'nexus',
  user_id TEXT NOT NULL DEFAULT 'local-user',
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES riomind_agent_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'reasoning',
  status TEXT NOT NULL DEFAULT 'created',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  permission_scope TEXT NOT NULL DEFAULT 'read',
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES riomind_agent_runs(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'created',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES riomind_workflows(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'created',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  surface TEXT NOT NULL DEFAULT 'nexus',
  owner_user_id TEXT NOT NULL DEFAULT 'local-user',
  memory_type TEXT NOT NULL DEFAULT 'project',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ai_layer, surface, owner_user_id, memory_type, key)
);

CREATE TABLE IF NOT EXISTS riomind_reasoning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES riomind_agent_runs(id) ON DELETE SET NULL,
  ai_layer TEXT NOT NULL DEFAULT 'shared',
  summary TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_guardrail_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  surface TEXT NOT NULL DEFAULT 'nexus',
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  allowed BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  target_type TEXT NOT NULL,
  target_id TEXT,
  score NUMERIC,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  node_type TEXT NOT NULL,
  node_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ai_layer, node_type, node_key)
);

CREATE TABLE IF NOT EXISTS riomind_kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'shared' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  from_node_id UUID NOT NULL REFERENCES riomind_kg_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES riomind_kg_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ai_layer, from_node_id, to_node_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_riomind_kg_nodes_lookup
ON riomind_kg_nodes(ai_layer, node_type, node_key);

CREATE INDEX IF NOT EXISTS idx_riomind_kg_edges_from
ON riomind_kg_edges(from_node_id);

CREATE INDEX IF NOT EXISTS idx_riomind_kg_edges_to
ON riomind_kg_edges(to_node_id);

CREATE TABLE IF NOT EXISTS riomind_voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_layer TEXT NOT NULL DEFAULT 'nexus_ai' CHECK (ai_layer IN ('core_ai','nexus_ai','shared')),
  surface TEXT NOT NULL DEFAULT 'nexus',
  session_type TEXT NOT NULL DEFAULT 'realtime',
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  meeting_code TEXT,
  owner_user_id TEXT NOT NULL DEFAULT 'local-user',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_voice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES riomind_voice_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'internal',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS riomind_voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES riomind_voice_sessions(id) ON DELETE CASCADE,
  meeting_code TEXT,
  speaker_label TEXT,
  source_language TEXT,
  target_language TEXT,
  transcript TEXT NOT NULL DEFAULT '',
  translation TEXT,
  confidence NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riomind_voice_sessions_meeting
ON riomind_voice_sessions(meeting_code);

CREATE INDEX IF NOT EXISTS idx_riomind_voice_transcripts_meeting
ON riomind_voice_transcripts(meeting_code);

