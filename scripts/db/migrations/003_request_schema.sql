BEGIN;
CREATE TABLE IF NOT EXISTS riomind_document_registry (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_layer text NOT NULL DEFAULT 'nexus_ai',
      surface text NOT NULL DEFAULT 'nexus_documents',
      document_id text NOT NULL,
      title text NOT NULL,
      document_type text NOT NULL DEFAULT 'text',
      content_hash text NOT NULL,
      version integer NOT NULL DEFAULT 1,
      status text NOT NULL DEFAULT 'learned',
      source_type text NOT NULL DEFAULT 'document',
      source_key text NOT NULL,
      owner_user_id text NOT NULL DEFAULT 'local-user',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(ai_layer, document_id, content_hash)
    );
CREATE INDEX IF NOT EXISTS idx_riomind_document_registry_doc
    ON riomind_document_registry(ai_layer, document_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS riomind_knowledge_provenance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ai_layer text NOT NULL DEFAULT 'nexus_ai',
      source_type text NOT NULL,
      source_id text NOT NULL,
      source_title text,
      source_version integer,
      source_hash text,
      knowledge_kind text NOT NULL,
      knowledge_text text NOT NULL,
      node_key text,
      confidence numeric NOT NULL DEFAULT 0.78,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(ai_layer, source_type, source_id, source_version, knowledge_kind, knowledge_text)
    );
CREATE INDEX IF NOT EXISTS idx_riomind_knowledge_provenance_source
    ON riomind_knowledge_provenance(ai_layer, source_type, source_id, source_version);
ALTER TABLE riomind_analytics_sessions
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS riomind_analytics_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_key TEXT NOT NULL,
        session_id UUID NOT NULL,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL DEFAULT 'executive',
        status TEXT NOT NULL DEFAULT 'generated',
        content TEXT NOT NULL,
        artifact_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
COMMIT;
