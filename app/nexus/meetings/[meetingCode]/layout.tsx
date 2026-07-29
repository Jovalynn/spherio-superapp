import { redirect } from "next/navigation";
import type { ReactNode } from "react";

function decodeMeetingCode(value: string): string {
  let decoded = value;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded.trim();
}

function isValidMeetingCode(value: string): boolean {
  const normalized = value.toLowerCase();

  if (
    !value ||
    value.includes("<") ||
    value.includes(">") ||
    normalized.includes("your-meeting-code") ||
    normalized.includes("meeting-code-here") ||
    normalized === "undefined" ||
    normalized === "null"
  ) {
    return false;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/.test(value);
}

export default async function MeetingCodeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ meetingCode: string }>;
}) {
  const resolvedParams = await params;
  const meetingCode = decodeMeetingCode(resolvedParams.meetingCode || "");

  if (!isValidMeetingCode(meetingCode)) {
    redirect("/nexus/meetings?error=invalid-meeting-code");
  }

  return children;
}
