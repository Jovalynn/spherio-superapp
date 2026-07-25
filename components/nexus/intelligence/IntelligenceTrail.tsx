"use client";

import Link from "next/link";

export interface TrailItem {
  type: string;
  label: string;
  href?: string;
}

const COLORS: Record<string,string> = {
  metric:"cyan",
  document:"emerald",
  knowledge:"violet",
  memory:"amber",
  trend:"blue",
  briefing:"pink",
  forecast:"rose",
  decision:"orange",
  risk:"red",
};

function badge(type:string){

  const c = COLORS[type] || "slate";

  return {
    cyan:"bg-cyan-500/15 text-cyan-300 border-cyan-300/20",
    emerald:"bg-emerald-500/15 text-emerald-300 border-emerald-300/20",
    violet:"bg-violet-500/15 text-violet-300 border-violet-300/20",
    amber:"bg-amber-500/15 text-amber-300 border-amber-300/20",
    blue:"bg-blue-500/15 text-blue-300 border-blue-300/20",
    pink:"bg-pink-500/15 text-pink-300 border-pink-300/20",
    rose:"bg-rose-500/15 text-rose-300 border-rose-300/20",
    orange:"bg-orange-500/15 text-orange-300 border-orange-300/20",
    red:"bg-red-500/15 text-red-300 border-red-300/20",
    slate:"bg-white/10 text-slate-300 border-white/10"
  }[c];
}

export default function IntelligenceTrail({
  items
}:{items:TrailItem[]}){

  return (

<section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">

<div className="flex items-center justify-between">

<div>

<div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
Intelligence Trail
</div>

<p className="mt-2 text-sm text-slate-400">
How RioMind reached this conclusion.
</p>

</div>

</div>

<div className="mt-6 flex flex-col gap-3">

{items.map((item,index)=>(

<div key={index} className="flex flex-col items-center">

{item.href ? (

<Link
href={item.href}
className={`w-full rounded-2xl border px-4 py-4 transition hover:scale-[1.01] ${badge(item.type)}`}
>

<div className="text-xs uppercase tracking-[0.15em] opacity-70">
{item.type}
</div>

<div className="mt-1 text-lg font-bold">
{item.label}
</div>

</Link>

):(

<div
className={`w-full rounded-2xl border px-4 py-4 ${badge(item.type)}`}
>

<div className="text-xs uppercase tracking-[0.15em] opacity-70">
{item.type}
</div>

<div className="mt-1 text-lg font-bold">
{item.label}
</div>

</div>

)}

{index<items.length-1 && (

<div className="py-2 text-cyan-300 text-xl">
↓
</div>

)}

</div>

))}

</div>

</section>

);

}
