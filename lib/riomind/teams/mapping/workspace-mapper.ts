import type {
  CanonicalWorkspace,
} from "../models/canonical-workspace";
import {
  asBoolean,
  asNullableText,
  asRecord,
  asText,
} from "./mapper-utils";

export function mapWorkspaceRecord(
  value: unknown,
): CanonicalWorkspace {
  const row = asRecord(value);

  return {
    id: asText(row.id),
    teamId: asText(
      row.team_id ?? row.teamId,
    ),

    name: asText(
      row.name,
      "Main Workspace",
    ),
    description:
      asNullableText(row.description),

    sharedFilesEnabled: asBoolean(
      row.shared_files_enabled ??
        row.sharedFilesEnabled,
      true,
    ),
    sharedReportsEnabled: asBoolean(
      row.shared_reports_enabled ??
        row.sharedReportsEnabled,
      true,
    ),
    sharedAnalyticsEnabled: asBoolean(
      row.shared_analytics_enabled ??
        row.sharedAnalyticsEnabled,
      true,
    ),
    sharedArtifactsEnabled: asBoolean(
      row.shared_artifacts_enabled ??
        row.sharedArtifactsEnabled,
      true,
    ),
    sharedNotesEnabled: asBoolean(
      row.shared_notes_enabled ??
        row.sharedNotesEnabled,
      true,
    ),
    sharedDocumentsEnabled: asBoolean(
      row.shared_documents_enabled ??
        row.sharedDocumentsEnabled,
      true,
    ),
    whiteboardEnabled: asBoolean(
      row.whiteboard_enabled ??
        row.whiteboardEnabled,
      true,
    ),

    metadata: asRecord(row.metadata),
    createdAt: asNullableText(
      row.created_at ?? row.createdAt,
    ),
    updatedAt: asNullableText(
      row.updated_at ?? row.updatedAt,
    ),
  };
}
