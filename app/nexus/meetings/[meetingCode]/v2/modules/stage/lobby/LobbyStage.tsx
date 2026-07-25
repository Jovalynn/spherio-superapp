"use client";

import type { ReactNode } from "react";

export interface LobbyStageProps {
  children: ReactNode;
}

export default function LobbyStage({
  children,
}: LobbyStageProps) {
  return (
    <div
      data-stage-lobby-module
      className="contents"
    >
      {children}
    </div>
  );
}
