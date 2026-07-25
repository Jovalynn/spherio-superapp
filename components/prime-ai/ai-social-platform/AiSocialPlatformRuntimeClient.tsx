"use client";

import { useMemo, useState } from "react";
import { AI_SOCIAL_PLATFORM_DEEP_TEMPLATE } from "@/lib/prime-ai/ai-social-platform-deep-template";
import { AI_SOCIAL_PLATFORM_NEXUS_READY_CONTRACT } from "@/lib/prime-ai/ai-social-platform-nexus-contract";

type RuntimeMode =
  | "overview"
  | "creator"
  | "blueprint"
  | "structure"
  | "engagement"
  | "moderation"
  | "health"
  | "report"
  | "access";

const workflowButtons: { id: RuntimeMode; label: string; helper: string }[] = [
  { id: "overview", label: "What this platform is", helper: "Understand the AI social platform." },
  { id: "creator", label: "Creator setup", helper: "What the social-platform creator configures." },
  { id: "blueprint", label: "Build community", helper: "Purpose, audience, channels, roles." },
  { id: "structure", label: "Plan structure", helper: "Feed, groups, profiles, interactions." },
  { id: "engagement", label: "Engagement plan", helper: "Posts, campaigns, events, challenges." },
  { id: "moderation", label: "Moderation rules", helper: "Safety, abuse flags, escalation." },
  { id: "health", label: "Community health", helper: "Sentiment, retention, churn, toxicity." },
  { id: "report", label: "Social report", helper: "Blueprint, safety, growth, next actions." },
  { id: "access", label: "Access model", helper: "Public, subscription, token-gated, workspace." },
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

export function AiSocialPlatformRuntimeClient() {
  const template = AI_SOCIAL_PLATFORM_DEEP_TEMPLATE;
  const nexusContract = AI_SOCIAL_PLATFORM_NEXUS_READY_CONTRACT;

  const [mode, setMode] = useState<RuntimeMode>("overview");
  const [communityGoal, setCommunityGoal] = useState("Launch a paid community for AI founders and builders");
  const [targetMembers, setTargetMembers] = useState("AI founders, builders, creators, and startup operators");
  const [communityFeatures, setCommunityFeatures] = useState("Feed, groups, creator posts, events, subscriptions, moderation, member badges");
  const [moderationRules, setModerationRules] = useState("No spam, no harassment, no scams, human review for reported posts");
  const [accessModel, setAccessModel] = useState("Subscription with verified member access");
  const [blueprintBuilt, setBlueprintBuilt] = useState(false);

  const featureList = useMemo(
    () => communityFeatures.split(",").map((item) => item.trim()).filter(Boolean),
    [communityFeatures],
  );

  function loadExample(type: "founders" | "students" | "creators" | "brand") {
    if (type === "founders") {
      setCommunityGoal("Launch a paid community for AI founders and builders");
      setTargetMembers("AI founders, builders, creators, and startup operators");
      setCommunityFeatures("Feed, groups, creator posts, events, subscriptions, moderation, member badges");
      setModerationRules("No spam, no harassment, no scams, human review for reported posts");
      setAccessModel("Subscription with verified member access");
    }

    if (type === "students") {
      setCommunityGoal("Create a learning community for students preparing for exams");
      setTargetMembers("Students, tutors, parents, and teachers");
      setCommunityFeatures("Study groups, Q&A feed, tutor posts, progress badges, moderation, announcements");
      setModerationRules("No bullying, no cheating services, no spam, academic integrity rules");
      setAccessModel("Free basic access with premium tutor groups");
    }

    if (type === "creators") {
      setCommunityGoal("Build a creator fan community with exclusive content");
      setTargetMembers("Fans, subscribers, supporters, and content collaborators");
      setCommunityFeatures("Creator channel, comments, member-only posts, tips, badges, live events");
      setModerationRules("No harassment, no impersonation, no piracy, creator-safe moderation");
      setAccessModel("Subscription and creator tips");
    }

    if (type === "brand") {
      setCommunityGoal("Launch a brand customer community for product feedback");
      setTargetMembers("Customers, ambassadors, product users, and support staff");
      setCommunityFeatures("Feedback feed, product groups, announcements, support posts, polls, rewards");
      setModerationRules("No abuse, no fake reviews, no spam, escalation for support issues");
      setAccessModel("Verified customer access");
    }

    setBlueprintBuilt(false);
    setMode("blueprint");
  }

  function buildBlueprint() {
    setBlueprintBuilt(true);
    setMode("structure");
  }

  function activeWorkflowTitle() {
    if (mode === "overview") return "Project understanding";
    if (mode === "creator") return "Creator social platform blueprint";
    if (mode === "blueprint") return "Community blueprint";
    if (mode === "structure") return "Social structure";
    if (mode === "engagement") return "Engagement planning";
    if (mode === "moderation") return "Moderation and safety";
    if (mode === "health") return "Community health";
    if (mode === "report") return "Social intelligence report";
    if (mode === "access") return "Access and monetization model";
    return "AI social platform workflow";
  }

  function activeWorkflowOutput() {
    if (!blueprintBuilt && ["structure", "engagement", "moderation", "health", "report"].includes(mode)) {
      return "Build the community blueprint first. The runtime needs community goal, members, features, moderation rules, and access model before deeper social outputs can be generated.";
    }

    if (mode === "overview") return "This project is a creator-owned AI social/community platform for feeds, groups, moderation, subscriptions, reputation, rewards, and social intelligence.";
    if (mode === "creator") return "The creator configures community type, social workflow, trust and safety model, and access model. This turns Prime into a social platform launcher.";
    if (mode === "blueprint") return blueprintBuilt ? `Community blueprint ready: ${communityGoal}. Members: ${targetMembers}.` : "Fill the community profile and click Build Community Blueprint.";
    if (mode === "structure") return `Social structure should include ${featureList.length} major feature(s): ${featureList.join(", ")}.`;
    if (mode === "engagement") return "Engagement plan should include prompts, posts, campaigns, events, challenges, onboarding, and member retention actions.";
    if (mode === "moderation") return `Moderation should enforce: ${moderationRules}.`;
    if (mode === "health") return "Community health should inspect engagement quality, member sentiment, toxicity risk, spam, churn, retention, and growth quality.";
    if (mode === "report") return "Social report should include blueprint, structure, engagement plan, moderation policy, health signals, access model, and next actions.";
    if (mode === "access") return `Access model: ${accessModel}. The creator can support free, subscription, token-gated, verified, and creator/brand workspace access.`;
    return "Select a workflow.";
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[36px] border border-cyan-300/20 bg-white/[0.045] p-7 shadow-[0_32px_120px_-82px_rgba(34,211,238,0.9)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Prime AI Niche Template · AI Social Platform</div>
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
            <h2 className="mt-2 text-2xl font-semibold text-white">Ready for future community intelligence</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">
              This AI Social Platform niche is not Nexus-powered yet, but it is structured as if Nexus already exists.
              Later, Nexus will structure community goals, plan social workflows, generate engagement content,
              evaluate moderation risk, analyze community health, and support subscriptions, rewards, and monetization.
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
        <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200/75">How to use this social platform</div>
        <div className="mt-4 grid gap-3">
          {template.userWorkflow.map((item) => <StepRow key={item.step} step={item.step} title={item.title} body={item.description} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">Community input</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with the community goal</h2>
          <p className="mt-2 text-sm leading-7 text-white/55">The user defines community purpose, members, features, rules, and access model.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => loadExample("founders")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load founders community</button>
            <button type="button" onClick={() => loadExample("students")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load student network</button>
            <button type="button" onClick={() => loadExample("creators")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load creator fans</button>
            <button type="button" onClick={() => loadExample("brand")} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.08]">Load brand community</button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Community goal</span><textarea value={communityGoal} onChange={(event) => setCommunityGoal(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Target members</span><input value={targetMembers} onChange={(event) => setTargetMembers(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Community features</span><textarea value={communityFeatures} onChange={(event) => setCommunityFeatures(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Moderation rules</span><textarea value={moderationRules} onChange={(event) => setModerationRules(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Access model</span><input value={accessModel} onChange={(event) => setAccessModel(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="button" onClick={buildBlueprint} className="w-full rounded-2xl border border-cyan-300/25 bg-cyan-500/14 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-500/20">Build Community Blueprint</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-cyan-300/16 bg-cyan-500/[0.055] p-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">Runtime actions</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Choose what to do next</h2>
          <p className="mt-2 text-sm leading-7 text-white/58">Click a workflow. The selected workflow produces a generated output in the RioMind Nexus social intelligence panel.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workflowButtons.map((item) => (
              <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${panelClass(mode === item.id)}`}>
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 opacity-75">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Blueprint</div><div className="mt-1 text-lg font-semibold text-white">{blueprintBuilt ? "Ready" : "Pending"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Features</div><div className="mt-1 text-lg font-semibold text-cyan-100">{blueprintBuilt ? featureList.length : "--"}</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs text-white/35">Next action</div><div className="mt-1 text-sm font-semibold text-amber-100">{blueprintBuilt ? "Plan structure, then moderation." : "Fill community profile and build blueprint."}</div></div>
          </div>

          <div className="mt-5 rounded-[26px] border border-violet-300/18 bg-violet-500/[0.07] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200/80">RioMind Nexus Social Hook</div><h3 className="mt-2 text-xl font-semibold text-white">{activeWorkflowTitle()}</h3></div>
              <span className="rounded-full border border-violet-300/20 bg-black/25 px-3 py-1 text-xs font-bold text-violet-100">Nexus-ready</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/66">{activeWorkflowOutput()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[36px] border border-white/10 bg-black/20 p-5">
        {mode === "overview" ? <div className="grid gap-4 md:grid-cols-2">{template.audiences.map((audience) => <SectionCard key={audience.title} eyebrow="Who this serves" title={audience.title} body={audience.description} />)}</div> : null}
        {mode === "creator" ? <div className="grid gap-4 md:grid-cols-2">{template.creatorSetup.map((setup) => <div key={setup.title} className="rounded-3xl border border-white/10 bg-black/24 p-5"><div className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/70">{setup.title}</div><div className="mt-2 text-sm leading-7 text-white/58">{setup.description}</div><div className="mt-4 flex flex-wrap gap-2">{setup.options.map((option) => <span key={option} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-xs text-white/68">{option}</span>)}</div></div>)}</div> : null}
        {mode === "blueprint" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Community blueprint" title={blueprintBuilt ? "Blueprint ready" : "Awaiting blueprint"} body={blueprintBuilt ? `${communityGoal}. Members: ${targetMembers}.` : "Fill community input and click Build Community Blueprint."} /><SectionCard eyebrow="Community posture" title="Rules before scale" body="The runtime should define members, rules, safety, and purpose before scaling engagement." /><SectionCard eyebrow="Recommended next step" title={blueprintBuilt ? "Plan structure" : "Build blueprint first"} body={blueprintBuilt ? "Plan structure, then configure moderation." : "Fill goal, members, features, rules, and access model."} /></div> : null}
        {mode === "structure" ? <div className="grid gap-4 md:grid-cols-3">{featureList.map((feature) => <SectionCard key={feature} eyebrow="Social feature" title={feature} body="Nexus later should map this feature to UI surface, permissions, moderation, data model, and engagement purpose." />)}</div> : null}
        {mode === "engagement" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Content prompts" title="Daily engagement" body="Generate discussion prompts, polls, questions, announcements, and member spotlights." /><SectionCard eyebrow="Events" title="Community rhythm" body="Plan AMAs, live sessions, challenges, launches, and member onboarding events." /><SectionCard eyebrow="Retention" title="Keep members active" body="Use badges, recognition, useful posts, reminders, and contribution loops." /></div> : null}
        {mode === "moderation" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Rules" title="Moderation policy" body={moderationRules} /><SectionCard eyebrow="Abuse flags" title="Safety categories" body="Spam, harassment, impersonation, scams, hate, unsafe claims, and repeated violations." /><SectionCard eyebrow="Escalation" title="Human review" body="Reported or high-impact cases should be escalated to moderators." /></div> : null}
        {mode === "health" ? <div className="grid gap-4 md:grid-cols-3"><SectionCard eyebrow="Engagement" title="Quality over noise" body="Track meaningful posts, helpful replies, contributor concentration, and silent-member signals." /><SectionCard eyebrow="Sentiment" title="Community mood" body="Monitor frustration, conflict, trust signals, and moderator burden." /><SectionCard eyebrow="Churn" title="Retention risk" body="Identify inactive members, declining participation, and low-value content loops." /></div> : null}
        {mode === "report" ? <div className="grid gap-4 md:grid-cols-2">{template.deepModules.map((module) => <SectionCard key={module.title} eyebrow="Social report module" title={module.title} body={`${module.purpose} Outputs: ${module.outputs.join(", ")}.`} />)}</div> : null}
        {mode === "access" ? <div className="grid gap-4 md:grid-cols-2">{template.accessModels.map((access) => <SectionCard key={access.title} eyebrow="Access model" title={access.title} body={access.description} />)}{template.proofAndVerification.map((proof) => <SectionCard key={proof} eyebrow="Verification rule" title="Community safety layer" body={proof} />)}</div> : null}
      </section>
    </section>
  );
}
