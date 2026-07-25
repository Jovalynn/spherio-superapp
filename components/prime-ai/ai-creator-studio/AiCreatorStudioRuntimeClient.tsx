"use client";

import { useMemo, useState } from "react";
import { AI_CREATOR_STUDIO_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-creator-studio-deep-template";
import { AI_CREATOR_STUDIO_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-creator-studio-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "brand"
  | "strategy"
  | "assets"
  | "repurpose"
  | "audience"
  | "package"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this studio is", helper: "Understand the creator studio project." },
  { id: "creator", label: "Creator setup", helper: "What the studio creator configures." },
  { id: "brand", label: "Build brand context", helper: "Voice, audience, pillars, promise." },
  { id: "strategy", label: "Plan content strategy", helper: "Calendar, pillars, campaign, platforms." },
  { id: "assets", label: "Generate assets", helper: "Scripts, hooks, captions, outlines." },
  { id: "repurpose", label: "Repurpose content", helper: "Shorts, posts, threads, newsletters." },
  { id: "audience", label: "Audience fit", helper: "Tone, platform fit, CTA, optimization." },
  { id: "package", label: "Creator package", helper: "Full content package and schedule." },
  { id: "access", label: "Access model", helper: "Public, subscription, credits, teams." },
];

function panelClass(active: boolean) {
  return active
    ? "border-cyan-300/40 bg-cyan-500/16 text-cyan-100 shadow-[0_0_34px_-18px_rgba(34,211,238,0.95)]"
    : "border-white/10 bg-white/[0.045] text-white/62 hover:bg-white/[0.075]";
}

function SectionCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/24 p-5">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">{eyebrow}</div>
      <div className="mt-2 text-xl font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/58">{body}</p>
    </div>
  );
}

function StepRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm md:grid-cols-[0.18fr_0.35fr_1fr]">
      <span className="font-black text-cyan-200">{step}</span>
      <span className="font-semibold text-white">{title}</span>
      <span className="text-white/60">{body}</span>
    </div>
  );
}

export function AiCreatorStudioRuntimeClient() {
  const template = AI_CREATOR_STUDIO_DEEP_TEMPLATE;
  const nexusContract = AI_CREATOR_STUDIO_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [creatorGoal, setCreatorGoal] = useState("Launch a YouTube education channel for blockchain beginners");
  const [targetAudience, setTargetAudience] = useState("Crypto beginners and students");
  const [platforms, setPlatforms] = useState("YouTube, TikTok, LinkedIn");
  const [brandVoice, setBrandVoice] = useState("Clear, trustworthy, premium, beginner-friendly");
  const [assetsNeeded, setAssetsNeeded] = useState("Video scripts, hooks, captions, content calendar, newsletter summary");
  const [brandBuilt, setBrandBuilt] = useState(false);

  const assetList = useMemo(
    () => assetsNeeded.split(",").map((item) => item.trim()).filter(Boolean),
    [assetsNeeded],
  );

  function loadExample(type: "youtube" | "course" | "podcast" | "campaign") {
    if (type === "youtube") {
      setCreatorGoal("Launch a YouTube education channel for blockchain beginners");
      setTargetAudience("Crypto beginners and students");
      setPlatforms("YouTube, TikTok, LinkedIn");
      setBrandVoice("Clear, trustworthy, premium, beginner-friendly");
      setAssetsNeeded("Video scripts, hooks, captions, content calendar, newsletter summary");
    }

    if (type === "course") {
      setCreatorGoal("Create an online course for AI productivity");
      setTargetAudience("Professionals and entrepreneurs");
      setPlatforms("Course platform, LinkedIn, Newsletter");
      setBrandVoice("Practical, expert, concise, motivating");
      setAssetsNeeded("Course outline, lesson scripts, worksheets, launch emails, social posts");
    }

    if (type === "podcast") {
      setCreatorGoal("Plan a podcast about African technology founders");
      setTargetAudience("Tech founders, investors, builders, students");
      setPlatforms("Podcast, YouTube Shorts, X/Twitter, LinkedIn");
      setBrandVoice("Insightful, respectful, bold, founder-focused");
      setAssetsNeeded("Episode outlines, guest questions, show notes, clips, social captions");
    }

    if (type === "campaign") {
      setCreatorGoal("Launch a campaign for a new SaaS product");
      setTargetAudience("Small business owners");
      setPlatforms("LinkedIn, Email, Landing page, X/Twitter");
      setBrandVoice("Professional, conversion-focused, simple, confident");
      setAssetsNeeded("Campaign plan, landing copy, email sequence, social posts, CTA variants");
    }

    setBrandBuilt(false);
    setMode("brand");
  }

  function buildBrand() {
    setBrandBuilt(true);
    setMode("strategy");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator studio blueprint";
    if (mode === "brand") return "Brand context";
    if (mode === "strategy") return "Content strategy";
    if (mode === "assets") return "Creator asset generation";
    if (mode === "repurpose") return "Content repurposing";
    if (mode === "audience") return "Audience fit analysis";
    if (mode === "package") return "Creator package";
    if (mode === "access") return "Access and monetization model";
    return "Creator studio workflow";
  }

  function activeWorkflowOutput() {
    if (!brandBuilt && ["strategy", "assets", "repurpose", "audience", "package"].includes(mode)) {
      return "Build brand context first. The runtime needs creator goal, audience, platforms, brand voice, and asset needs before deeper creator outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned AI content and brand studio for scripts, campaigns, calendars, brand voice, content repurposing, and creator monetization.";
    if (mode === "creator") return "The creator configures creator market, content workflow, output channels, and access model. This turns Prime into a creator studio launcher.";
    if (mode === "brand") return brandBuilt ? `Brand context ready for: ${creatorGoal}. Audience: ${targetAudience}.` : "Fill the creator profile and click Build Brand Context.";
    if (mode === "strategy") return `Content strategy should plan for ${platforms}, with pillars, content calendar, campaign themes, and creator positioning.`;
    if (mode === "assets") return `Generate ${assetList.length} asset type(s): ${assetList.join(", ")}.`;
    if (mode === "repurpose") return "Repurposing should turn one core idea into platform-specific shorts, captions, newsletters, posts, and clips.";
    if (mode === "audience") return `Audience fit should check whether the tone '${brandVoice}' matches ${targetAudience} and the selected platforms.`;
    if (mode === "package") return "Creator package should include assets, schedule, campaign notes, audience-fit report, monetization ideas, and next actions.";
    if (mode === "access") return "The creator can choose public assistant, subscription creator studio, usage-credit generation, RIO/RUSD/USDT/USDC payment, card rails later, and agency workspace.";
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Creator Studio</div>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight md:text-5xl">{template.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-white/62">{template.publicPositioning}</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-300/15 bg-amber-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/75">Creator promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.creatorPromise}</p>
          </div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200/75">User promise</div>
            <p className="mt-2 text-sm leading-7 text-white/68">{template.userPromise}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[34px] border border-violet-300/18 bg-violet-500/[0.055] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.26em] text-violet-200/80">RioMind Nexus-ready contract</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future creator intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This AI Creator Studio niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will build brand context, plan content strategy, generate creator assets, repurpose content,
              analyze audience fit, and produce creator packages.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/18 bg-black/25 px-4 py-3 text-xs font-bold text-violet-100">{nexusContract.status.replaceAll("_", " ")}</div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Input fields</div><div className="mt-1 text-2xl font-semibold text-cyan-100">{nexusContract.inputSchema.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Workflows</div><div className="mt-1 text-2xl font-semibold text-amber-100">{nexusContract.workflowActions.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Outputs</div><div className="mt-1 text-2xl font-semibold text-emerald-100">{nexusContract.expectedOutputs.length}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/22 p-4"><div className="text-xs text-white/35">Verification rules</div><div className="mt-1 text-2xl font-semibold text-violet-100">{nexusContract.verificationLayer.length}</div></div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/70">Nexus role</div>
          <p className="mt-2 text-sm leading-7 text-white/62">{nexusContract.rioMindNexusRole}</p>
        </div>
      </section>

      <section className="rounded-[34px] border border-white/10 bg-black/20 p-5">
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this creator studio</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Creator input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the creator goal</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines brand goal, audience, platforms, voice, and needed content assets.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("youtube")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load YouTube example</button>
            <button type="button" onClick={() => loadExample("course")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load course example</button>
            <button type="button" onClick={() => loadExample("podcast")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load podcast example</button>
            <button type="button" onClick={() => loadExample("campaign")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load campaign example</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Creator goal</span><textarea value={creatorGoal} onChange={(event) => setCreatorGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Target audience</span><input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Platforms</span><input value={platforms} onChange={(event) => setPlatforms(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Brand voice</span><textarea value={brandVoice} onChange={(event) => setBrandVoice(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Content assets needed</span><textarea value={assetsNeeded} onChange={(event) => setAssetsNeeded(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={buildBrand} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Build Brand Context</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus creator intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Brand context</div><div className="mt-1 text-lg font-semibold text-white">{brandBuilt ? "Ready" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Assets</div><div className="mt-1 text-lg font-semibold text-cyan-100">{brandBuilt ? assetList.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{brandBuilt ? "Plan strategy, then generate assets." : "Fill creator profile and build brand."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Creator Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "brand" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Brand context" title={brandBuilt ? "Brand ready" : "Awaiting brand"} body={brandBuilt ? `${creatorGoal}. Audience: ${targetAudience}. Voice: ${brandVoice}.` : "Fill creator input and click Build Brand Context."} /><SectionCard eyebrow="Creator posture" title="Audience before assets" body="The runtime should define audience, voice, and positioning before generating content." /><SectionCard eyebrow="Recommended next step" title={brandBuilt ? "Plan content strategy" : "Build brand first"} body={brandBuilt ? "Plan strategy, then generate assets." : "Fill goal, audience, platforms, voice, and assets."} /></div> : null}
        {mode === "strategy" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Platforms" title={platforms} body="Plan platform-specific formats, cadence, content pillars, and campaign themes." /><SectionCard eyebrow="Calendar" title="Publishing rhythm" body="Create weekly content schedule with hooks, formats, and distribution plan." /><SectionCard eyebrow="Positioning" title="Creator promise" body="Every content pillar should reinforce the creator's promise and audience need." /></div> : null}
        {mode === "assets" ? <div className="grid gap-4 md:grid-cols-3">{assetList.map((asset) => <SectionCard key={asset} eyebrow="Creator asset" title={asset} body="Nexus later should generate this asset with tone, platform, audience, CTA, and quality constraints." />)}</div> : null}
        {mode === "repurpose" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Core idea" title="One idea, many formats" body="Transform core content into shorts, posts, captions, threads, carousels, newsletters, and clips." /><SectionCard eyebrow="Channel fit" title={platforms} body="Each platform needs different length, hook, CTA, tone, and visual structure." /><SectionCard eyebrow="Sequence" title="Distribution flow" body="Repurposing should create a posting order and cross-channel reinforcement plan." /></div> : null}
        {mode === "audience" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Audience" title={targetAudience} body="Check whether content answers the audience's problems, language, objections, and aspirations." /><SectionCard eyebrow="Tone" title={brandVoice} body="Review consistency, credibility, clarity, and differentiation." /><SectionCard eyebrow="CTA" title="Action alignment" body="Each piece should guide the audience toward the right next action." /></div> : null}
        {mode === "package" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Creator package module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Publishing safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
