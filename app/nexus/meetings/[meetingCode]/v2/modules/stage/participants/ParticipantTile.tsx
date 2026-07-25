"use client";

import type { ReactNode } from "react";

export interface ParticipantTileProps {
  children: ReactNode;
  title: string;
  className: string;
}

export default function ParticipantTile({
  children,
  title,
  className,
}: ParticipantTileProps) {
  return (
    <article
      data-participant-tile-module
      title={title}
      className={className}
    >
      {children}
    </article>
  );
}
