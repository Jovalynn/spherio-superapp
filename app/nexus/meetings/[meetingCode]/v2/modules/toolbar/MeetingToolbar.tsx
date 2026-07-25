"use client";

import ToolbarButton from "./ToolbarButton";

export interface MeetingToolbarProps {
  children?: React.ReactNode;
}

export default function MeetingToolbar({
  children,
}: MeetingToolbarProps) {
  return (
    <div
      data-nexus-toolbar-root
      className="nexus-toolbar-scroll relative flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2 overflow-visible pb-1 text-sm 2xl:ml-auto"
    >
      {children}
    </div>
  );
}
