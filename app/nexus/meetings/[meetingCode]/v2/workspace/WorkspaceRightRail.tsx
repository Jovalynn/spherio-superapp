import type {
  ReactNode,
} from "react";

type WorkspaceRightRailProps = {
  children: ReactNode;
};

export function WorkspaceRightRail({
  children,
}: WorkspaceRightRailProps) {
  return (
    <div data-nexus-workspace-right-rail>
      {children}
    </div>
  );
}
