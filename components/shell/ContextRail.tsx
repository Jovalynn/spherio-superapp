"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Boxes,
  Braces,
  CandlestickChart,
  ChartNoAxesCombined,
  Code2,
  Compass,
  Droplets,
  FileCode2,
  Flame,
  FolderOpen,
  Globe,
  House,
  Landmark,
  LayoutDashboard,
  Library,
  Map,
  Receipt,
  Rocket,
  Settings,
  Shield,
  Store,
  Users,
  Vote,
  Wallet,
  Waypoints,
} from "lucide-react";
import { SECTION_NAV_MAP } from "./nav-config";

const ICONS = {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Boxes,
  Braces,
  CandlestickChart,
  ChartNoAxesCombined,
  Code2,
  Compass,
  Droplets,
  FileCode2,
  Flame,
  FolderOpen,
  Globe,
  House,
  Landmark,
  LayoutDashboard,
  Library,
  Map,
  Receipt,
  Rocket,
  Settings,
  Shield,
  Store,
  Users,
  Vote,
  Wallet,
  Waypoints,
} as const;

const RIO_LOGO =
  "https://avatars.githubusercontent.com/u/175851528?s=400&u=b0c1a871d1e739566c4c2bf96a97720fedfc03ab&v=4";

const RUSD_LOGO =
  "https://raw.githubusercontent.com/Lerivee/RUSD/refs/heads/main/Untitled%20design.png";

function LogoIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full">
      <img src={src} alt={alt} className="h-4 w-4 object-contain" />
    </span>
  );
}

function RailIcon({ icon, label }: { icon: string; label: string }) {
  if (icon === "RioLogo") {
    return <LogoIcon src={RIO_LOGO} alt={`${label} logo`} />;
  }

  if (icon === "RusdLogo") {
    return <LogoIcon src={RUSD_LOGO} alt={`${label} logo`} />;
  }

  const Icon = ICONS[icon as keyof typeof ICONS];
  return Icon ? <Icon size={16} /> : null;
}

export function ContextRail({ activeSection }: { activeSection: keyof typeof SECTION_NAV_MAP }) {
  const pathname = usePathname();
  const items = SECTION_NAV_MAP[activeSection] || [];

  return (
    <aside className="hidden w-[208px] shrink-0 border-r border-white/10 bg-[rgba(4,8,16,0.56)] backdrop-blur-xl lg:block">
      <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {activeSection}
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (!item.href.includes("#") && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-[rgba(130,18,49,0.48)] text-white"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <RailIcon icon={item.icon} label={item.label} />
                  <span className="truncate">{item.label}</span>
                </span>

                {"badge" in item && item.badge ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
