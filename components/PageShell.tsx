import React from "react";

/**
 * Sovereign Page Shell
 * - Enforces consistent max width, vertical rhythm, and reading comfort
 * - Prevents “component-by-component spacing drift”
 */
export default function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8 py-8 sm:py-10">
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
