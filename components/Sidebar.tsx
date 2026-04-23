"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RIODEX_HOME_ROUTE } from "@/lib/riodex/routes";

type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    title: "Ecosystem",
    items: [{ href: "/overview", label: "Overview" }],
  },
  {
    title: "Launch",
    items: [
      { href: "/createtoken", label: "CreateToken" },
      { href: "/advancelaunch", label: "AdvancedLaunch" },
      { href: "/pumplive", label: "Pump.live", disabled: true, badge: "coming soon" },
    ],
  },
  {
    title: "Terminals",
    items: [
      { href: "/rio", label: "RIO" },
      { href: "/rusd", label: "RUSD" },
    ],
  },
  {
    title: "Standards",
    items: [{ href: "/spo-20", label: "SPO-20" }],
  },
  {
    title: "Utilities",
    items: [
      { href: "/rioexplorer", label: "RioExplorer" },
      { href: RIODEX_HOME_ROUTE, label: "RioDex" },

      { href: "/rioex", label: "RioEx", disabled: true, badge: "Planned" },
      { href: "/riotelecoms", label: "RioTelecoms", disabled: true, badge: "Planned" },
      { href: "/rioedge", label: "RioEdge / CDN", disabled: true, badge: "Planned" },
      { href: "/rioenterprise", label: "RioEnterprise", disabled: true, badge: "Planned" },
      { href: "/riocommerce", label: "RioCommerce", disabled: true, badge: "Planned" },
      { href: "/riopay", label: "RioPay", disabled: true, badge: "Planned" },
    ],
  },
];

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-[260px] shrink-0">
      <div className="h-full overflow-y-auto pr-2">
        <div className="space-y-5">
          {NAV.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="px-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-200">
                {group.title}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                  const base =
                    "flex items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition";
                  const activeCls = "bg-white/10 text-white border border-white/10";
                  const idleCls = "text-slate-300 hover:bg-white/5";
                  const disabledCls = "text-white/30 cursor-not-allowed hover:bg-transparent";

                  const rowClass = clsx(
                    base,
                    item.disabled ? disabledCls : active ? activeCls : idleCls
                  );

                  const content = (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  );

                  if (item.disabled) {
                    return (
                      <div key={item.href} className={rowClass} aria-disabled="true">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} className={rowClass}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
