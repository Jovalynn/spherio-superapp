"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXCHANGE_SURFACES } from "@/lib/navigation/exchange";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function ExchangeSurfaceRail() {
  const pathname = usePathname();

  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-3 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="grid gap-3 md:grid-cols-3">
        {EXCHANGE_SURFACES.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group relative overflow-hidden rounded-[22px] border px-5 py-4 transition duration-200",
                active
                  ? "border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.04))] text-white shadow-[0_18px_45px_rgba(124,24,74,0.16)]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(255,255,255,0.02))] text-white/80 hover:border-cyan-400/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]"
              )}
            >
              <div
                className={clsx(
                  "absolute inset-x-0 top-0 h-px",
                  active
                    ? "bg-[linear-gradient(90deg,transparent,rgba(244,114,182,0.9),rgba(34,211,238,0.8),transparent)]"
                    : "bg-transparent"
                )}
              />

              <div
                className={clsx(
                  "pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full blur-3xl",
                  active ? "bg-fuchsia-500/12" : "bg-transparent"
                )}
              />

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div
                    className={clsx(
                      active
                        ? "text-[10px] font-semibold uppercase tracking-[0.22em] text-white/48"
                        : "text-[15px] font-semibold tracking-tight text-white/90"
                    )}
                  >
                    {item.title}
                  </div>

                  <div
                    className={clsx(
                      active
                        ? "mt-2 text-[12px] leading-5 text-white/70"
                        : "mt-1 text-[11px] leading-5 text-white/45"
                    )}
                  >
                    {item.description}
                  </div>
                </div>

                {active ? (
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
