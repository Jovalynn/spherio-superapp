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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="grid gap-3 md:grid-cols-3">
        {EXCHANGE_SURFACES.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-2xl border px-4 py-4 transition",
                active
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30"
              )}
            >
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-1 text-xs text-white/50">{item.description}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
