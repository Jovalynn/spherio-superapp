import { LegalAiRuntimeClient } from "@/components/prime-ai/legal-ai/LegalAiRuntimeClient";

export default function LegalAiPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.13),transparent_34%),linear-gradient(180deg,#050814,#070a14)] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <LegalAiRuntimeClient />
      </div>
    </main>
  );
}
