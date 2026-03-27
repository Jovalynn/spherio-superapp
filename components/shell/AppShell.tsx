"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getActiveSection } from "./nav-config";
import { TopNav } from "./TopNav";
import { ContextRail } from "./ContextRail";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-220px] top-[-140px] h-[560px] w-[560px] rounded-full bg-[#9d103e]/18 blur-[150px]" />
        <div className="absolute right-[-180px] top-[80px] h-[540px] w-[540px] rounded-full bg-[#5b0d25]/22 blur-[170px]" />
        <div className="absolute bottom-[-260px] left-[20%] h-[760px] w-[760px] rounded-full bg-[#2e0a15]/30 blur-[220px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,20,56,0.14),transparent_36%),linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(0,0,0,0.90))]" />
      </div>

      <TopNav activeSection={activeSection} />

      <div className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        <ContextRail activeSection={activeSection} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
