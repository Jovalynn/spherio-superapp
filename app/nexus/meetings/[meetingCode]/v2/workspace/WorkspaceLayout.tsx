import type {
  CSSProperties,
} from "react";
import type {
  NexusWorkspaceLayoutSlots,
} from "./workspace-types";

type WorkspaceLayoutProps =
  NexusWorkspaceLayoutSlots & {
    className?: string;
    style?: CSSProperties;
  };

export function WorkspaceLayout({
  header,
  navigation,
  primary,
  secondary,
  rightRail,
  bottomDock,
  overlay,
  className,
  style,
}: WorkspaceLayoutProps) {
  return (
    <section
      className={className}
      data-nexus-workspace-layout
      style={style}
    >
      {header ? (
        <header
          data-nexus-workspace-region="header"
        >
          {header}
        </header>
      ) : null}

      <div
        data-nexus-workspace-body
        style={{
          display: "grid",
          gridTemplateColumns:
            navigation && rightRail
              ? "auto minmax(0, 1fr) auto"
              : navigation
                ? "auto minmax(0, 1fr)"
                : rightRail
                  ? "minmax(0, 1fr) auto"
                  : "minmax(0, 1fr)",
          minHeight: 0,
        }}
      >
        {navigation ? (
          <aside
            data-nexus-workspace-region="navigation"
          >
            {navigation}
          </aside>
        ) : null}

        <main
          data-nexus-workspace-region="content"
          style={{
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <div
            data-nexus-workspace-region="primary"
          >
            {primary}
          </div>

          {secondary ? (
            <div
              data-nexus-workspace-region="secondary"
            >
              {secondary}
            </div>
          ) : null}
        </main>

        {rightRail ? (
          <aside
            data-nexus-workspace-region="right-rail"
          >
            {rightRail}
          </aside>
        ) : null}
      </div>

      {bottomDock ? (
        <footer
          data-nexus-workspace-region="bottom-dock"
        >
          {bottomDock}
        </footer>
      ) : null}

      {overlay ? (
        <div
          data-nexus-workspace-region="overlay"
        >
          {overlay}
        </div>
      ) : null}
    </section>
  );
}
