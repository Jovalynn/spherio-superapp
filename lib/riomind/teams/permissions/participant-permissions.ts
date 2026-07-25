import type {
  ParticipantPermissions,
  ParticipantRole,
} from "../models/canonical-participant";

export function resolveParticipantPermissions(
  role: ParticipantRole,
): ParticipantPermissions {
  const ownerOrAdmin =
    role === "owner" ||
    role === "admin";

  const managementRole =
    ownerOrAdmin ||
    role === "manager";

  return {
    canShareScreen:
      role !== "viewer",
    canRecord: ownerOrAdmin,
    canInvite: managementRole,
    canModerate: managementRole,
    canRemoveParticipants:
      ownerOrAdmin,
    canManageRoles: ownerOrAdmin,
    canManageTranslation:
      managementRole,
  };
}
