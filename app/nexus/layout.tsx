import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RioMind Nexus",
  description:
    "RioMind Nexus is a standalone sovereign AI workspace for creation, research, coding, planning, and intelligent execution.",
};

export default function NexusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
