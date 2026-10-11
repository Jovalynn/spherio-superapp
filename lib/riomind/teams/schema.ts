import type { Pool } from "pg";

const readiness = new WeakMap<Pool, Promise<void>>();

// Runtime identities never create schema. Apply scripts/db/migrations first.
export async function ensureRioMindTeamsSchema(pool: Pool) {
  let pending = readiness.get(pool);
  if (!pending) {
    pending = (async () => {
      await pool.query("SELECT * FROM riomind_team_meeting_intelligence LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_invitations LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_participants LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_raise_hands LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_roles LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_voice_participants LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meeting_voice_sessions LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_meetings LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_members LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_room_action_items LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_room_commitments LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_room_decisions LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_room_messages LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_room_notes LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_rooms LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_shared_assets LIMIT 0");
      await pool.query("SELECT * FROM riomind_team_workspaces LIMIT 0");
      await pool.query("SELECT * FROM riomind_teams LIMIT 0");
      await pool.query("SELECT metadata FROM riomind_messages LIMIT 0");
    })().catch((error) => {
      readiness.delete(pool);
      throw error;
    });
    readiness.set(pool, pending);
  }
  await pending;
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
