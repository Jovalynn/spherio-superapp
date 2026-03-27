import Image from "next/image";
import React from "react";

export function PageHeader(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  logo?: { src: string; alt: string };
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-4">
        {props.logo ? (
          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
            <Image
              src={props.logo.src}
              alt={props.logo.alt}
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        ) : null}

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            {props.title}
          </h1>
          {props.subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{props.subtitle}</p>
          ) : null}
        </div>
      </div>

      {props.right ? <div className="flex items-center gap-2">{props.right}</div> : null}
    </div>
  );
}

export function Badge(props: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
      {props.children}
    </span>
  );
}

export function MacroStrip(props: { children: React.ReactNode }) {
  return <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{props.children}</section>;
}

export function MacroCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
      <div className="text-xs text-slate-400">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-slate-500">{props.sub}</div> : null}
    </div>
  );
}

export function Panel(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm font-semibold text-slate-100">{props.title}</div>
          {props.subtitle ? <div className="mt-1 text-xs text-slate-500">{props.subtitle}</div> : null}
        </div>
      </div>
      <div className="mt-5">{props.children}</div>
    </div>
  );
}

export function MiniStat(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-600">{props.hint}</div> : null}
    </div>
  );
}

/**
 * Institutional chart wrapper.
 * Always give Recharts deterministic height to prevent width(-1)/height(-1).
 */
export function ChartBox(props: { height?: number; children: React.ReactNode }) {
  const h = props.height ?? 280;
  return <div className="w-full" style={{ height: `${h}px` }}>{props.children}</div>;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
