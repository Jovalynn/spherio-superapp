type Database = { query: (sql: string, values: unknown[]) => Promise<{rows: Record<string, unknown>[]}> };
export class TeamAuthorizationError extends Error { constructor() { super("Team access denied"); this.name = "TeamAuthorizationError"; } }
export async function requireTeamAccess(db: Database, subject: string, teamId: string, write: boolean, administrative: boolean, roomId?: string) {
  if (!subject || !/^[0-9a-f-]{36}$/i.test(teamId)) throw new TeamAuthorizationError();
  const result = await db.query(`SELECT t.owner_user_id, m.role, m.status FROM riomind_teams t
    LEFT JOIN riomind_team_members m ON m.team_id=t.id AND m.user_id=$2 AND m.status='active'
    WHERE t.id=$1`, [teamId,subject]);
  const roles = result.rows;
  const owner = roles.some(row => row.owner_user_id === subject);
  const allowed = owner || roles.some(row => row.status === "active" && (administrative ? row.role === "admin" : write ? ["admin","manager","analyst","contributor"].includes(String(row.role)) : ["admin","manager","analyst","contributor","viewer"].includes(String(row.role))));
  if (!allowed) throw new TeamAuthorizationError();
  if (roomId) {
    if (!/^[0-9a-f-]{36}$/i.test(roomId)) throw new TeamAuthorizationError();
    const room = await db.query("SELECT id FROM riomind_team_rooms WHERE id=$1 AND team_id=$2", [roomId,teamId]);
    if (!room.rows.length) throw new TeamAuthorizationError();
  }
  return subject;
}
export function requireTeamsOperator(subject: string) {
  const subjects = (process.env.CF_ACCESS_TEAMS_OPERATOR_SUBJECTS || "").split(",").map(s=>s.trim()).filter(Boolean);
  if (!subjects.includes(subject)) throw new TeamAuthorizationError();
}
