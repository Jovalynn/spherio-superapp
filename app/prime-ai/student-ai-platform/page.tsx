import { StudentAiMiniApp } from "@/components/prime-ai/miniapps/StudentAiMiniApp";

export default function StudentAiPlatformPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,#050814,#070a14)] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <StudentAiMiniApp projectName="Student learning command center" />
      </div>
    </main>
  );
}
