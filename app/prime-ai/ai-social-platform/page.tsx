import { AiSocialPlatformRuntimeClient } from "@/components/prime-ai/ai-social-platform/AiSocialPlatformRuntimeClient";

export default function AiSocialPlatformPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_100%_0%,rgba(236,72,153,0.13),transparent_34%),linear-gradient(180deg,#050814,#070a14)] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <AiSocialPlatformRuntimeClient />
      </div>
    </main>
  );
}
