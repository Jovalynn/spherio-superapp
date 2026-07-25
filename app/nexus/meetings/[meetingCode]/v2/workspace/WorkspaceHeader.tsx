import type {
  ReactNode,
} from "react";

type WorkspaceHeaderProps = {
  children: ReactNode;
};

export function WorkspaceHeader({
  children,
}: WorkspaceHeaderProps) {
  return (
    <div data-nexus-workspace-header>
      {children}
    </div>
  );
}
