import type {
  CSSProperties,
  ReactNode,
} from "react";
import {
  WorkspaceLayout,
} from "./WorkspaceLayout";

type WorkspaceShellProps = {
  header?: ReactNode;
  navigation?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  rightRail?: ReactNode;
  bottomDock?: ReactNode;
  overlay?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function WorkspaceShell({
  header,
  navigation,
  primary,
  secondary,
  rightRail,
  bottomDock,
  overlay,
  className,
  style,
}: WorkspaceShellProps) {
  return (
    <WorkspaceLayout
      header={header}
      navigation={navigation}
      primary={primary}
      secondary={secondary}
      rightRail={rightRail}
      bottomDock={bottomDock}
      overlay={overlay}
      className={className}
      style={style}
    />
  );
}
