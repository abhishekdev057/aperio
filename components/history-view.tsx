"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, ChevronRight, Clock3, FileClock, History, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type HistoryItem = {
  id: string;
  roleTitle: string;
  roleSlug: string;
  experienceLevel: string;
  overallScore: number;
  technicalScore: number | null;
  softScore: number | null;
  matchedCount: number;
  developingCount: number;
  missingCount: number;
  createdAt: string;
};

function deltaLabel(value: number, noun: string) {
  if (value === 0) return `No change in ${noun}`;
  return `${Math.abs(value)} ${noun} ${value > 0 ? "added" : "fewer"}`;
}

export function HistoryView({ history }: { history: HistoryItem[] }) {
  const roleOptions = Array.from(new Map(history.map((item) => [item.roleSlug, item.roleTitle])).entries());
  const [role, setRole] = useState(history[0]?.roleSlug ?? "");
  const roleHistory = useMemo(() => history.filter((item) => item.roleSlug === role), [history, role]);
  const chartData = [...roleHistory].reverse();
  const latest = roleHistory[0];
  const previous = roleHistory[1];
  const scoreDelta = latest && previous ? latest.overallScore - previous.overallScore : 0;
  const maxPoints = Math.max(chartData.length - 1, 1);
  const points = chartData.map((item, index) => ({ x: 8 + (index / maxPoints) * 84, y: 86 - item.overallScore * .68, item }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  if (!history.length) return <section className="aperio-panel px-6 py-16 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]"><History size={21} /></span><h2 className="mt-5 text-lg font-semibold">No analysis history yet</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">Your completed analyses will stay available here without overwriting earlier reports.</p><Button asChild className="mt-6"><Link href="/analyze">Run your first analysis</Link></Button></section>;

  return <div>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl"><p className="aperio-eyebrow text-[var(--primary)]"><FileClock size={14} />Saved career intelligence</p><h1 className="aperio-page-title mt-3">Readiness over time</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Every report is preserved, so you can see how new evidence changes your readiness—not just today’s score.</p></div>
      <Button asChild><Link href="/analyze">New analysis <ArrowRight size={15} /></Link></Button>
    </div>

    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="relative min-h-[390px] overflow-hidden rounded-[22px] border border-[#29365e] bg-[#18245d] p-5 text-white shadow-[0_24px_64px_rgba(30,41,100,.22)] sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(99,102,241,.5),transparent_38%),linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:auto,auto_25%]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-indigo-200">Progress signal</p><h2 className="mt-2 text-xl font-semibold">{latest.roleTitle}</h2><p className="mt-1 text-xs capitalize text-indigo-200">{latest.experienceLevel} target · {roleHistory.length} saved {roleHistory.length === 1 ? "analysis" : "analyses"}</p></div><select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-[10px] border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white outline-none backdrop-blur"><option className="text-slate-900" disabled>Choose a role</option>{roleOptions.map(([slug, title]) => <option className="text-slate-900" key={slug} value={slug}>{title}</option>)}</select></div>
        {chartData.length >= 2 ? <div className="relative mt-7">
          <svg viewBox="0 0 100 100" className="h-52 w-full overflow-visible" role="img" aria-label={`${latest.roleTitle} readiness progression from ${chartData[0].overallScore}% to ${latest.overallScore}%`}>
            {[18, 35, 52, 69].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="rgba(255,255,255,.12)" strokeDasharray="1.5 2.4" vectorEffect="non-scaling-stroke" />)}
            <polyline points={polyline} fill="none" stroke="#a8b0ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {points.map(({ x, y, item }, index) => <g key={item.id}><circle cx={x} cy={y} r={index === points.length - 1 ? 4.2 : 3.1} fill="#6ee7b7" stroke="#fff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" /><text x={x} y={y - 8} textAnchor="middle" fill={index === points.length - 1 ? "#86efac" : "#c7d2fe"} fontSize="5" fontWeight="700">{item.overallScore}%</text><text x={x} y="97" textAnchor="middle" fill="#c7d2fe" fontSize="3.4">{new Date(item.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</text></g>)}
          </svg>
          <p className="mt-1 flex items-center gap-2 text-[10px] leading-5 text-indigo-200"><ShieldCheck size={13} />Guidance, not certainty—readiness changes as your profile gains stronger evidence.</p>
        </div> : <div className="relative mt-8 grid min-h-48 place-items-center rounded-[15px] border border-dashed border-white/20 bg-white/[.045] p-6 text-center"><div><ChartNoAxesCombined className="mx-auto text-indigo-200" /><h3 className="mt-4 text-sm font-semibold">One point starts the journey</h3><p className="mt-2 max-w-sm text-xs leading-5 text-indigo-200">Complete another {latest.roleTitle} analysis later to reveal a real readiness trend.</p></div></div>}
      </section>

      <aside className="aperio-panel overflow-hidden">
        <div className="border-b p-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Latest movement</p><h2 className="mt-2 text-lg font-semibold">What changed</h2><p className="mt-1 text-xs text-[var(--muted)]">{previous ? `Since ${formatDate(previous.createdAt)}` : "After your first saved report"}</p></div>
        <div className="p-5">
          {previous ? <><div className="flex items-start gap-3"><span className={cn("grid size-10 shrink-0 place-items-center rounded-[11px]", scoreDelta >= 0 ? "bg-[var(--positive-soft)] text-[var(--positive)]" : "bg-[var(--attention-soft)] text-[var(--attention)]")}>{scoreDelta >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}</span><div><p className="text-sm font-semibold">Readiness {scoreDelta >= 0 ? "moved forward" : "needs renewed evidence"}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{previous.overallScore}% → {latest.overallScore}% ({scoreDelta > 0 ? "+" : ""}{scoreDelta} points)</p></div></div><div className="mt-5 space-y-2"><div className="flex items-center justify-between rounded-[11px] bg-[var(--surface-elevated)] px-3 py-3 text-xs"><span className="text-[var(--muted)]">Strong matches</span><strong>{deltaLabel(latest.matchedCount - previous.matchedCount, "skills")}</strong></div><div className="flex items-center justify-between rounded-[11px] bg-[var(--surface-elevated)] px-3 py-3 text-xs"><span className="text-[var(--muted)]">Not demonstrated</span><strong>{Math.abs(latest.missingCount - previous.missingCount)} skill change</strong></div></div></> : <div className="rounded-[13px] bg-[var(--primary-soft)] p-4"><p className="text-sm font-semibold text-[var(--primary)]">Baseline saved</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">This analysis becomes the comparison point for your next report on the same role.</p></div>}
          <Button asChild variant="secondary" className="mt-5 w-full"><Link href={`/history/${latest.id}`}>Open latest report <ArrowRight size={14} /></Link></Button>
        </div>
      </aside>
    </div>

    <section className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <div className="aperio-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Selected role</p><h2 className="mt-2 text-lg font-semibold">Analysis timeline</h2></div><Clock3 size={18} className="text-[var(--primary)]" /></div><div className="relative mt-5 space-y-1 before:absolute before:bottom-5 before:left-[14px] before:top-5 before:w-px before:bg-[var(--border-strong)]">{roleHistory.slice(0, 6).map((item, index) => <Link key={item.id} href={`/history/${item.id}`} className="group relative grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-[12px] p-2.5 transition hover:bg-[var(--surface-elevated)]"><span className={cn("relative z-10 grid size-7 place-items-center rounded-full border text-[9px] font-bold", index === 0 ? "border-[var(--positive)] bg-[var(--positive-soft)] text-[var(--positive)]" : "bg-[var(--surface)] text-[var(--muted)]")}>{roleHistory.length - index}</span><span><span className="block text-xs font-semibold">{formatDate(item.createdAt)}</span><span className="mt-0.5 block text-[10px] capitalize text-[var(--muted)]">{item.experienceLevel} target · {item.matchedCount} matched</span></span><span className="flex items-center gap-2"><strong className="text-lg">{item.overallScore}%</strong><ChevronRight size={14} className="text-[var(--muted)] transition group-hover:translate-x-0.5" /></span></Link>)}</div></div>
      <div className="aperio-panel overflow-hidden"><div className="flex items-center justify-between border-b p-5 sm:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Report archive</p><h2 className="mt-2 text-lg font-semibold">All saved analyses</h2></div><CalendarDays size={18} className="text-[var(--primary)]" /></div><div>{history.map((item) => <Link key={item.id} href={`/history/${item.id}`} className="group grid gap-3 border-b px-5 py-4 transition last:border-0 hover:bg-[var(--surface-elevated)] sm:grid-cols-[1fr_100px_76px_26px] sm:items-center sm:px-6"><span><span className="block text-sm font-semibold">{item.roleTitle}</span><span className="mt-1 block text-[10px] capitalize text-[var(--muted)]">{item.experienceLevel} · {item.matchedCount} matched · {item.missingCount} gaps</span></span><span className="text-xs text-[var(--muted)]">{formatDate(item.createdAt)}</span><strong className="text-lg">{item.overallScore}%</strong><ArrowRight size={14} className="text-[var(--muted)] transition group-hover:translate-x-0.5" /></Link>)}</div></div>
    </section>
  </div>;
}
