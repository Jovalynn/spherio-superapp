import type {
  ReactNode,
} from "react";

type WorkspaceContentProps = {
  children: ReactNode;
};

export function WorkspaceContent({
  children,
}: WorkspaceContentProps) {
  return (
    <div data-nexus-workspace-content>
      {children}
    </div>
  );
}
