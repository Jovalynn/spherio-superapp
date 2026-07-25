"use client";

import type { ReactNode } from "react";

export interface StageHeaderProps {
  children: ReactNode;
}

export default function StageHeader({
  children,
}: StageHeaderProps) {
  return (
    <div
      data-stage-header-module
      className="flex items-center justify-between"
    >
      {children}
    </div>
  );
}
