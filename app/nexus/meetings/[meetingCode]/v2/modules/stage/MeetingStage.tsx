"use client";

import type { ReactNode } from "react";

export interface MeetingStageProps {
  children: ReactNode;
}

export default function MeetingStage({
  children,
}: MeetingStageProps) {
  return (
    <section
      data-meeting-stage-module
      className="relative w-full"
    >
      {children}
    </section>
  );
}
