import type {
  ReactNode,
} from "react";

type WorkspaceSidebarProps = {
  children: ReactNode;
};

export function WorkspaceSidebar({
  children,
}: WorkspaceSidebarProps) {
  return (
    <div data-nexus-workspace-sidebar>
      {children}
    </div>
  );
}
