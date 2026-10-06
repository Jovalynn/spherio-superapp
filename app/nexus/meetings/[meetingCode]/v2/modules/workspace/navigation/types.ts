import type {
  WorkspaceId,
} from "@/lib/riomind/workspace";

export type {
  WorkspaceId,
} from "@/lib/riomind/workspace";

export type WorkspaceNavigationItem = {
  id: WorkspaceId;
  label: string;
  icon: string;
};
