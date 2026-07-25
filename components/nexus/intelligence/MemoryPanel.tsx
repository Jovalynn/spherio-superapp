"use client";

import Link from "next/link";

function categoryColor(category:string){

switch((category||"").toLowerCase()){

case "finance":
return "text-emerald-300 border-emerald-300/20 bg-emerald-500/10";

case "engineering":
return "text-cyan-300 border-cyan-300/20 bg-cyan-500/10";

case "operations":
return "text-amber-300 border-amber-300/20 bg-amber-500/10";

case "research":
return "text-violet-300 border-violet-300/20 bg-violet-500/10";

default:
return "text-slate-300 border-white/10 bg-white/5";

}

}

export default function MemoryPanel({memories}:{memories?:any[]}){

const list = (memories || []).map((m:any)=>({
  ...m,
  memoryKey: m.memoryKey || m.key || "memory",
  title: m.title || m.key || "Enterprise Memory",
  summary: m.summary || m.value || "No memory summary available.",
  category: m.category || m.memory_type || m.surface || "General",
  relatedCount: m.relatedCount || 0,
  confidence: m.confidence || "High",
}));

const categories =
Array.from(new Set(list.map(m=>m.category||"General")));

return (

<div className="space-y-6">

<div className="grid md:grid-cols-4 gap-4">

<div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-5">
<div className="text-xs uppercase tracking-[0.2em] text-cyan-300">
Memory Nodes
</div>
<div className="mt-2 text-4xl font-black text-white">
{list.length}
</div>
</div>

<div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
<div className="text-xs uppercase tracking-[0.2em] text-emerald-300">
Categories
</div>
<div className="mt-2 text-4xl font-black text-white">
{categories.length}
</div>
</div>

<div className="rounded-3xl border border-violet-300/20 bg-violet-500/10 p-5">
<div className="text-xs uppercase tracking-[0.2em] text-violet-300">
Connected
</div>
<div className="mt-2 text-4xl font-black text-white">
{list.filter(x=>x.relatedCount>0).length}
</div>
</div>

<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
<div className="text-xs uppercase tracking-[0.2em] text-slate-400">
Recently Learned
</div>
<div className="mt-2 text-4xl font-black text-white">
{Math.min(list.length,10)}
</div>
</div>

</div>

<div className="grid xl:grid-cols-2 gap-5">

{list.map(memory=>(

<Link

key={memory.memoryKey}

href={`/nexus/intelligence/evidence/memory/${encodeURIComponent(memory.memoryKey)}`}

className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30 hover:bg-cyan-500/[0.04]"

>

<div className="flex justify-between items-start">

<div>

<div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${categoryColor(memory.category)}`}>
{memory.category||"General"}
</div>

<div className="mt-3 text-xl font-black text-white">
{memory.title}
</div>

</div>

<div className="text-cyan-300">
→
</div>

</div>

<p className="mt-4 text-sm leading-6 text-slate-300">
{memory.summary}
</p>

<div className="mt-5 grid grid-cols-2 gap-3">

<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

<div className="text-xs uppercase tracking-[0.15em] text-slate-500">
Connections
</div>

<div className="mt-2 text-2xl font-black text-white">
{memory.relatedCount||0}
</div>

</div>

<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

<div className="text-xs uppercase tracking-[0.15em] text-slate-500">
Confidence
</div>

<div className="mt-2 text-2xl font-black text-white">
{memory.confidence||"High"}
</div>

</div>

</div>

<div className="mt-5 text-xs font-bold text-cyan-300">
Open Memory Intelligence →
</div>

</Link>

))}

</div>

</div>

);

}
