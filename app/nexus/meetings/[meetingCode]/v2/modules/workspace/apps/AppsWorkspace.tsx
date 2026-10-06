"use client";

import WorkspaceModuleShell from "../WorkspaceModuleShell";

type AppEntry = {
  name: string;
  icon: string;
  description: string;
  action: string;
  href?: string;
};

const PRODUCTIVITY_APPS: AppEntry[] = [
  {
    name: "Calendar",
    icon: "📅",
    description: "Meeting scheduling, follow-ups, milestones, and availability.",
    action: "Connect",
  },
  {
    name: "GitHub",
    icon: "🐙",
    description: "Repositories, issues, pull requests, releases, and engineering workflows.",
    action: "Connect",
  },
  {
    name: "Jira",
    icon: "📋",
    description: "Projects, tickets, sprints, assignments, and delivery tracking.",
    action: "Connect",
  },
];

const SPHERIO_APPS: AppEntry[] = [
  {
    name: "Prime",
    icon: "🚀",
    description: "Structured project and token launch workflows.",
    action: "Open",
    href: "/createtoken/prime",
  },
  {
    name: "Pump.live",
    icon: "🔥",
    description: "Bonding-curve launches, discovery, and graduation.",
    action: "Open",
    href: "/pump.live",
  },
  {
    name: "Spherio SuperApp",
    icon: "🌐",
    description: "Main Spherio ecosystem and application hub.",
    action: "Open",
    href: "/",
  },
  {
    name: "RioExplorer",
    icon: "🔎",
    description: "Transactions, contracts, assets, pools, and chain activity.",
    action: "Open",
    href: "/rioexplorer",
  },
  {
    name: "RioLight",
    icon: "💼",
    description: "Wallet, portfolio, signing, assets, and execution.",
    action: "Open",
    href: "/riolight",
  },
  {
    name: "RioEx",
    icon: "📈",
    description: "Markets, assets, liquidity, trading, and valuation.",
    action: "Open",
    href: "/rioex",
  },
];

const PLATFORM_APPS: AppEntry[] = [
  {
    name: "Marketplace",
    icon: "🧩",
    description: "Future AI agents, plugins, apps, integrations, and developer extensions.",
    action: "Explore",
  },
];

function AppCard({
  app,
}: {
  app: AppEntry;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl">
          {app.icon}
        </span>

        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
          {app.action}
        </span>
      </div>

      <div className="mt-4 font-black text-white">
        {app.name}
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {app.description}
      </p>
    </>
  );

  if (app.href) {
    return (
      <a
        href={app.href}
        className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.05]"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-300/30 hover:bg-purple-300/[0.05]"
    >
      {content}
    </button>
  );
}

function AppGroup({
  title,
  apps,
}: {
  title: string;
  apps: AppEntry[];
}) {
  return (
    <section>
      <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <AppCard
            key={app.name}
            app={app}
          />
        ))}
      </div>
    </section>
  );
}

export default function AppsWorkspace() {
  return (
    <WorkspaceModuleShell
      eyebrow="Connected Collaboration"
      title="Apps Workspace"
      description="Bring productivity tools, Spherio applications, ecosystem services, and future Marketplace extensions directly into the meeting."
    >
      <div className="space-y-7">
        <AppGroup
          title="Productivity"
          apps={PRODUCTIVITY_APPS}
        />

        <AppGroup
          title="Spherio Platform"
          apps={SPHERIO_APPS}
        />

        <AppGroup
          title="Platform"
          apps={PLATFORM_APPS}
        />
      </div>
    </WorkspaceModuleShell>
  );
}
