import { Pool } from "pg";

let initialized = false;

export async function ensureRioMindTeamsSchema(pool: Pool) {
  if (initialized) return;

  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS riomind_teams (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      owner_user_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      default_language TEXT NOT NULL DEFAULT 'en',
      translation_enabled BOOLEAN NOT NULL DEFAULT false,
      ai_summary_enabled BOOLEAN NOT NULL DEFAULT true,
      recording_enabled BOOLEAN NOT NULL DEFAULT false,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      user_id TEXT,
      email TEXT,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'viewer',
      status TEXT NOT NULL DEFAULT 'active',
      preferred_language TEXT DEFAULT 'en',
      translation_language TEXT,
      invited_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(team_id, email)
    );

    CREATE TABLE IF NOT EXISTS riomind_team_workspaces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'Main Workspace',
      description TEXT,
      shared_files_enabled BOOLEAN NOT NULL DEFAULT true,
      shared_reports_enabled BOOLEAN NOT NULL DEFAULT true,
      shared_analytics_enabled BOOLEAN NOT NULL DEFAULT true,
      shared_artifacts_enabled BOOLEAN NOT NULL DEFAULT true,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_rooms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES riomind_team_workspaces(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      room_type TEXT NOT NULL DEFAULT 'team',
      room_status TEXT NOT NULL DEFAULT 'active',
      description TEXT,
      default_language TEXT NOT NULL DEFAULT 'en',
      translation_enabled BOOLEAN NOT NULL DEFAULT false,
      recording_enabled BOOLEAN NOT NULL DEFAULT false,
      transcription_enabled BOOLEAN NOT NULL DEFAULT true,
      ai_summary_enabled BOOLEAN NOT NULL DEFAULT true,
      whiteboard_enabled BOOLEAN NOT NULL DEFAULT true,
      shared_chat_enabled BOOLEAN NOT NULL DEFAULT true,
      shared_notes_enabled BOOLEAN NOT NULL DEFAULT true,
      created_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_shared_assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES riomind_team_workspaces(id) ON DELETE SET NULL,
      room_id UUID REFERENCES riomind_team_rooms(id) ON DELETE SET NULL,
      asset_type TEXT NOT NULL,
      asset_id TEXT,
      title TEXT,
      source_table TEXT,
      shared_by TEXT,
      shared_scope TEXT NOT NULL DEFAULT 'team',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_members_team_id ON riomind_team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_workspaces_team_id ON riomind_team_workspaces(team_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_rooms_team_id ON riomind_team_rooms(team_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_shared_assets_team_id ON riomind_team_shared_assets(team_id);

    CREATE TABLE IF NOT EXISTS riomind_team_room_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES riomind_team_rooms(id) ON DELETE CASCADE,
      sender_user_id TEXT,
      sender_name TEXT,
      message TEXT NOT NULL,
      source_language TEXT DEFAULT 'en',
      translated_language TEXT,
      translated_message TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_room_notes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES riomind_team_rooms(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Meeting Notes',
      body TEXT NOT NULL DEFAULT '',
      note_type TEXT NOT NULL DEFAULT 'note',
      created_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_room_messages_room_id ON riomind_team_room_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_room_notes_room_id ON riomind_team_room_notes(room_id);

    CREATE TABLE IF NOT EXISTS riomind_team_room_decisions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES riomind_team_rooms(id) ON DELETE CASCADE,
      decision TEXT NOT NULL,
      rationale TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_room_action_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES riomind_team_rooms(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      due_date DATE,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      created_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_room_commitments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES riomind_team_rooms(id) ON DELETE CASCADE,
      commitment TEXT NOT NULL,
      owner TEXT,
      due_date DATE,
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_room_decisions_room_id ON riomind_team_room_decisions(room_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_room_action_items_room_id ON riomind_team_room_action_items(room_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_room_commitments_room_id ON riomind_team_room_commitments(room_id);

    CREATE TABLE IF NOT EXISTS riomind_team_meetings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID NOT NULL REFERENCES riomind_teams(id) ON DELETE CASCADE,
      room_id UUID REFERENCES riomind_team_rooms(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      purpose TEXT,
      organizer TEXT,
      meeting_date DATE,
      meeting_time TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      language_mode TEXT NOT NULL DEFAULT 'single',
      default_language TEXT NOT NULL DEFAULT 'en',
      meeting_status TEXT NOT NULL DEFAULT 'scheduled',
      meeting_code TEXT UNIQUE,
      meeting_link TEXT,
      invite_link TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_team_id ON riomind_team_meetings(team_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_room_id ON riomind_team_meetings(room_id);
    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_status ON riomind_team_meetings(meeting_status);

    ALTER TABLE riomind_team_meetings
      ADD COLUMN IF NOT EXISTS meeting_type TEXT NOT NULL DEFAULT 'scheduled',
      ADD COLUMN IF NOT EXISTS owner_user_id TEXT,
      ADD COLUMN IF NOT EXISTS owner_display_name TEXT,
      ADD COLUMN IF NOT EXISTS access_policy TEXT NOT NULL DEFAULT 'team',
      ADD COLUMN IF NOT EXISTS join_slug TEXT,
      ADD COLUMN IF NOT EXISTS lobby_enabled BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS identity_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_owner_user_id
      ON riomind_team_meetings(owner_user_id);

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_meeting_type
      ON riomind_team_meetings(meeting_type);

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meetings_join_slug
      ON riomind_team_meetings(join_slug);

    CREATE TABLE IF NOT EXISTS riomind_team_meeting_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      meeting_id UUID NOT NULL REFERENCES riomind_team_meetings(id) ON DELETE CASCADE,
      display_name TEXT,
      email TEXT,
      participant_status TEXT NOT NULL DEFAULT 'invited',
      preferred_language TEXT DEFAULT 'en',
      invited_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meeting_participants_meeting_id
      ON riomind_team_meeting_participants(meeting_id);

    ALTER TABLE riomind_team_meeting_participants
      ADD COLUMN IF NOT EXISTS runtime_id UUID,
      ADD COLUMN IF NOT EXISTS invitation_id UUID
        REFERENCES riomind_team_meeting_invitations(id)
        ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS user_id TEXT,
      ADD COLUMN IF NOT EXISTS participant_role TEXT NOT NULL DEFAULT 'participant',
      ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'general_link',
      ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline',
      ADD COLUMN IF NOT EXISTS camera_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS microphone_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS screen_sharing BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS speaking BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS hand_raised BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS connection_status TEXT NOT NULL DEFAULT 'disconnected',
      ADD COLUMN IF NOT EXISTS connection_quality TEXT,
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS runtime_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

    UPDATE riomind_team_meeting_participants
    SET runtime_id = uuid_generate_v4()
    WHERE runtime_id IS NULL;

    ALTER TABLE riomind_team_meeting_participants
      ALTER COLUMN runtime_id SET DEFAULT uuid_generate_v4();

    CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_participant_runtime_id
      ON riomind_team_meeting_participants(runtime_id);

    CREATE INDEX IF NOT EXISTS idx_meeting_participants_presence
      ON riomind_team_meeting_participants(
        meeting_id,
        presence_status
      );

    CREATE INDEX IF NOT EXISTS idx_meeting_participants_invitation
      ON riomind_team_meeting_participants(invitation_id);

    

CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_participants_client_session
ON riomind_team_meeting_participants (
  meeting_id,
  client_session_id
)
WHERE client_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meeting_participants_last_seen
      ON riomind_team_meeting_participants(last_seen_at);


    CREATE TABLE IF NOT EXISTS riomind_team_meeting_invitations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      meeting_id UUID NOT NULL
        REFERENCES riomind_team_meetings(id)
        ON DELETE CASCADE,

      team_id UUID
        REFERENCES riomind_teams(id)
        ON DELETE CASCADE,

      invitee_user_id TEXT,
      invitee_email TEXT,
      invitee_display_name TEXT,

      invited_role TEXT NOT NULL DEFAULT 'participant',
      access_scope TEXT NOT NULL DEFAULT 'meeting',

      token_id TEXT NOT NULL UNIQUE,
      token_hash TEXT NOT NULL,

      invitation_status TEXT NOT NULL DEFAULT 'draft',

      invited_by_user_id TEXT,
      invited_by_display_name TEXT,

      preferred_language TEXT,
      translation_language TEXT,

      sent_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      viewed_at TIMESTAMPTZ,
      accepted_at TIMESTAMPTZ,
      declined_at TIMESTAMPTZ,
      joined_at TIMESTAMPTZ,
      left_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,

      last_ip_hash TEXT,
      last_user_agent TEXT,

      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_meeting_id
      ON riomind_team_meeting_invitations(meeting_id);

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_team_id
      ON riomind_team_meeting_invitations(team_id);

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_status
      ON riomind_team_meeting_invitations(invitation_status);

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_email
      ON riomind_team_meeting_invitations(invitee_email);

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_user_id
      ON riomind_team_meeting_invitations(invitee_user_id);

    CREATE INDEX IF NOT EXISTS idx_meeting_invitations_expires_at
      ON riomind_team_meeting_invitations(expires_at);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_active_meeting_invitation_email
      ON riomind_team_meeting_invitations(
        meeting_id,
        lower(invitee_email)
      )
      WHERE invitee_email IS NOT NULL
        AND invitation_status NOT IN ('revoked', 'expired');


    ALTER TABLE riomind_team_meetings
      ADD COLUMN IF NOT EXISTS raise_hand_enabled BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS require_approval_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS meeting_password TEXT,
      ADD COLUMN IF NOT EXISTS domain_restriction TEXT,
      ADD COLUMN IF NOT EXISTS guest_access_enabled BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS meeting_mode TEXT NOT NULL DEFAULT 'discussion';

    CREATE TABLE IF NOT EXISTS riomind_team_meeting_roles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      meeting_id UUID NOT NULL REFERENCES riomind_team_meetings(id) ON DELETE CASCADE,
      user_name TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'participant',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_meeting_raise_hands (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      meeting_id UUID NOT NULL REFERENCES riomind_team_meetings(id) ON DELETE CASCADE,
      participant_name TEXT,
      email TEXT,
      hand_status TEXT NOT NULL DEFAULT 'raised',
      allowed_to_speak BOOLEAN NOT NULL DEFAULT false,
      muted BOOLEAN NOT NULL DEFAULT true,
      removed BOOLEAN NOT NULL DEFAULT false,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meeting_roles_meeting_id
      ON riomind_team_meeting_roles(meeting_id);

    CREATE INDEX IF NOT EXISTS idx_riomind_team_meeting_raise_hands_meeting_id
      ON riomind_team_meeting_raise_hands(meeting_id);

    CREATE TABLE IF NOT EXISTS riomind_team_meeting_voice_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      meeting_id UUID NOT NULL REFERENCES riomind_team_meetings(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'ready',
      recording_enabled BOOLEAN NOT NULL DEFAULT false,
      started_by TEXT,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS riomind_team_meeting_voice_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      meeting_id UUID NOT NULL REFERENCES riomind_team_meetings(id) ON DELETE CASCADE,
      participant_name TEXT,
      email TEXT,
      role TEXT DEFAULT 'participant',
      joined_audio BOOLEAN NOT NULL DEFAULT false,
      muted BOOLEAN NOT NULL DEFAULT true,
      speaking BOOLEAN NOT NULL DEFAULT false,
      hand_raised BOOLEAN NOT NULL DEFAULT false,
      preferred_language TEXT DEFAULT 'en',
      presence_status TEXT NOT NULL DEFAULT 'in_meeting',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      joined_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_voice_sessions_meeting_id
      ON riomind_team_meeting_voice_sessions(meeting_id);

    CREATE INDEX IF NOT EXISTS idx_voice_participants_meeting_id
      ON riomind_team_meeting_voice_participants(meeting_id);


    ALTER TABLE riomind_team_meetings
      ADD COLUMN IF NOT EXISTS waiting_room_enabled BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS pause_entry_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS auto_admit_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS host_only_mute BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS allow_participant_unmute BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS screen_share_mode TEXT NOT NULL DEFAULT 'host_only',
      ADD COLUMN IF NOT EXISTS meeting_locked BOOLEAN NOT NULL DEFAULT false;

    /*
     * Canonical AI-generated meeting intelligence.
     *
     * Manual room decisions, action items and commitments remain in
     * their existing tables. Nexus intelligence is reviewed here
     * before it is promoted into an official collaboration artifact.
     */
    CREATE TABLE IF NOT EXISTS riomind_team_meeting_intelligence (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

      meeting_id UUID NOT NULL
        REFERENCES riomind_team_meetings(id)
        ON DELETE CASCADE,

      intelligence_type TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',

      status TEXT NOT NULL DEFAULT 'detected',

      speaker_id TEXT,
      speaker_name TEXT,
      participant_id TEXT,

      owner_user_id TEXT,
      owner_name TEXT,
      due_at TIMESTAMPTZ,

      source_type TEXT NOT NULL DEFAULT 'system',
      source_id TEXT,
      source_text TEXT,
      source_language TEXT,

      confidence INTEGER,
      semantic_signature TEXT NOT NULL,

      detected_by TEXT NOT NULL DEFAULT 'riomind-core',

      tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

      detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      accepted_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,

      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT chk_meeting_intelligence_type
        CHECK (
          intelligence_type IN (
            'decision',
            'action',
            'risk',
            'question',
            'commitment',
            'insight',
            'recommendation',
            'blocker',
            'follow_up'
          )
        ),

      CONSTRAINT chk_meeting_intelligence_status
        CHECK (
          status IN (
            'detected',
            'accepted',
            'resolved',
            'dismissed',
            'completed',
            'answered',
            'archived'
          )
        ),

      CONSTRAINT chk_meeting_intelligence_source
        CHECK (
          source_type IN (
            'chat',
            'transcript',
            'manual',
            'assistant',
            'system'
          )
        ),

      CONSTRAINT chk_meeting_intelligence_confidence
        CHECK (
          confidence IS NULL OR
          (confidence >= 0 AND confidence <= 100)
        ),

      UNIQUE (
        meeting_id,
        intelligence_type,
        semantic_signature
      )
    );

    CREATE INDEX IF NOT EXISTS
      idx_meeting_intelligence_meeting_id
      ON riomind_team_meeting_intelligence(meeting_id);

    CREATE INDEX IF NOT EXISTS
      idx_meeting_intelligence_meeting_type
      ON riomind_team_meeting_intelligence(
        meeting_id,
        intelligence_type
      );

    CREATE INDEX IF NOT EXISTS
      idx_meeting_intelligence_meeting_status
      ON riomind_team_meeting_intelligence(
        meeting_id,
        status
      );

    CREATE INDEX IF NOT EXISTS
      idx_meeting_intelligence_source
      ON riomind_team_meeting_intelligence(
        meeting_id,
        source_type,
        source_id
      );

    CREATE INDEX IF NOT EXISTS
      idx_meeting_intelligence_detected_at
      ON riomind_team_meeting_intelligence(
        meeting_id,
        detected_at DESC
      );





  `);

  initialized = true;
}

export const RIOMIND_TEAM_ROLES = [
  "owner",
  "admin",
  "manager",
  "analyst",
  "contributor",
  "viewer",
] as const;

export const RIOMIND_ROOM_TYPES = [
  "team",
  "meeting",
  "voice",
  "project",
  "analytics",
  "artifact",
] as const;
