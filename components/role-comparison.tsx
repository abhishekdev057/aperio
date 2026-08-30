"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Check, CircleAlert, GitCompareArrows, LoaderCircle, Sparkles, Star, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, scoreLabel } from "@/lib/utils";
import { skillLevelLabel, type AnalysisReport, type AnalysisSkill } from "@/lib/types";

export type RoleHistoryItem = { id: string; roleSlug: string; roleTitle: string; experienceLevel: string; overallScore: number; createdAt: string };
export type ComparisonData = { left: AnalysisReport; right: AnalysisReport; sharedSkills: string[]; leftGaps: string[]; rightGaps: string[] };

function ScoreArc({ score, side }: { score: number; side: "left" | "right" }) {
  const color = side === "left" ? "#8b7bff" : "#34d399";
  return <div className="relative grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(148,163,184,.14) 0)` }}>
    <div className="absolute inset-[10px] rounded-full bg-[#091421]" />
    <div className="relative text-center"><strong className="text-4xl tracking-[-.06em] text-white">{score}<span className="text-xl">%</span></strong><p className="mt-0.5 text-[11px] font-semibold" style={{ color }}>match</p></div>
  </div>;
}

function GapCard({ skill, side }: { skill: AnalysisSkill; side: "left" | "right" }) {
  const accent = side === "left" ? "#8b7bff" : "#34d399";
  return <div className="rounded-[13px] border border-white/10 bg-white/[.035] p-3.5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{skill.name}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{skillLevelLabel[skill.currentLevel]} → {skillLevelLabel[skill.targetLevel]}</p></div><span className="rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[.08em]" style={{ color: accent, background: `${accent}18` }}>{skill.importance}</span></div>
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.max(12, (skill.currentLevel / Math.max(skill.targetLevel, 1)) * 100)}%`, background: accent }} /></div>
  </div>;
}

function findSkills(report: AnalysisReport, names: string[]) {
  const set = new Set(names);
  return report.skills.filter((skill) => set.has(skill.name));
}

export function RoleComparison({ history, initialData }: { history: RoleHistoryItem[]; initialData: ComparisonData }) {
  const [left, setLeft] = useState(initialData.left.id);
  const [right, setRight] = useState(initialData.right.id);
  const [data, setData] = useState<ComparisonData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/role-comparison?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`);
      const json = await response.json();
      if (response.ok) setData(json.data);
      else setError(json.error?.message || "Comparison failed.");
    } catch {
      setError("Comparison is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const shared = findSkills(data.left, data.sharedSkills).slice(0, 6);
  const leftGaps = findSkills(data.left, data.leftGaps).slice(0, 5);
  const rightGaps = findSkills(data.right, data.rightGaps).slice(0, 5);
  const closer = data.left.overallScore === data.right.overallScore ? null : data.left.overallScore > data.right.overallScore ? data.left : data.right;
  const scoreDelta = Math.abs(data.left.overallScore - data.right.overallScore);

  return <div>
    <section className="rounded-[18px] border bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
        <label><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Path A</span><select value={left} onChange={(event) => setLeft(event.target.value)} className="h-11 w-full rounded-[11px] border bg-[var(--surface-elevated)] px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]">{history.map((item) => <option key={item.id} value={item.id}>{item.roleTitle} · {item.experienceLevel}</option>)}</select></label>
        <span className="mt-4 hidden size-9 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] lg:grid"><ArrowRightLeft size={16} /></span>
        <label><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Path B</span><select value={right} onChange={(event) => setRight(event.target.value)} className="h-11 w-full rounded-[11px] border bg-[var(--surface-elevated)] px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]">{history.map((item) => <option key={item.id} value={item.id}>{item.roleTitle} · {item.experienceLevel}</option>)}</select></label>
        <Button onClick={compare} disabled={loading || left === right} className="mt-4 w-full lg:w-auto">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <GitCompareArrows size={16} />}Update comparison</Button>
      </div>
      {error && <p className="mt-3 text-sm text-[var(--critical)]" role="alert">{error}</p>}
    </section>

    <section className="relative mt-5 overflow-hidden rounded-[22px] border border-slate-700/80 bg-[#07121f] text-slate-100 shadow-[0_24px_80px_rgba(2,8,23,.25)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(109,93,252,.15),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(16,185,129,.12),transparent_32%),linear-gradient(rgba(148,163,184,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.035)_1px,transparent_1px)] bg-[size:auto,auto,40px_40px,40px_40px]" />
      <div className="relative border-b border-white/10 px-5 py-6 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-300">Evidence-based role decision</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-.035em] text-white sm:text-2xl">{data.left.roleTitle} <span className="font-normal text-slate-500">vs</span> {data.right.roleTitle}</h2>
        <p className="mt-2 text-xs text-slate-400">Compared from your saved {data.left.experienceLevel} and {data.right.experienceLevel} readiness analyses</p>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[1fr_.76fr_1fr]">
        <article className="border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-col items-center text-center"><ScoreArc score={data.left.overallScore} side="left" /><h3 className="mt-4 text-lg font-semibold text-white">{data.left.roleTitle}</h3><p className="mt-1 text-xs font-medium text-indigo-300">{scoreLabel(data.left.overallScore)}</p><p className="mt-3 max-w-xs text-xs leading-5 text-slate-400">{data.left.matchedCount} strong · {data.left.developingCount} developing · {data.left.missingCount} not demonstrated</p></div>
          <div className="mt-7 flex items-center gap-2"><CircleAlert size={15} className="text-indigo-300" /><h4 className="text-xs font-semibold uppercase tracking-[.12em] text-indigo-200">Unique focus areas</h4></div>
          <div className="mt-3 space-y-2.5">{leftGaps.length ? leftGaps.map((skill) => <GapCard key={skill.id} skill={skill} side="left" />) : <p className="rounded-[13px] border border-white/10 p-4 text-xs text-slate-400">No role-specific gaps identified.</p>}</div>
          <Button asChild variant="secondary" className="mt-5 w-full border-indigo-400/30 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/15"><Link href={`/analyze?role=${data.left.roleId}`}>Analyze this path <ArrowRight size={14} /></Link></Button>
        </article>

        <div className="border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="text-center"><span className="mx-auto grid size-10 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Sparkles size={17} /></span><h3 className="mt-3 text-sm font-semibold text-white">Shared strengths</h3><p className="mt-1 text-[11px] leading-5 text-slate-400">Evidence that supports both directions</p></div>
          <div className="relative mt-5 space-y-2.5 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-gradient-to-b before:from-indigo-400 before:via-sky-400 before:to-emerald-400">{shared.length ? shared.map((skill) => <div key={skill.id} className="relative flex items-center gap-3 rounded-[13px] border border-white/10 bg-[#0d1a29] p-3"><span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-[10px] bg-emerald-400/10 text-emerald-300"><Check size={15} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{skill.name}</span><span className="mt-0.5 block text-[10px] text-slate-400">{skillLevelLabel[skill.currentLevel]} evidence</span></span></div>) : <p className="rounded-[13px] border border-white/10 p-4 text-center text-xs leading-5 text-slate-400">No shared strong skills were identified in these saved analyses.</p>}</div>
        </div>

        <article className="p-5 sm:p-7">
          <div className="flex flex-col items-center text-center"><ScoreArc score={data.right.overallScore} side="right" /><h3 className="mt-4 text-lg font-semibold text-white">{data.right.roleTitle}</h3><p className="mt-1 text-xs font-medium text-emerald-300">{scoreLabel(data.right.overallScore)}</p><p className="mt-3 max-w-xs text-xs leading-5 text-slate-400">{data.right.matchedCount} strong · {data.right.developingCount} developing · {data.right.missingCount} not demonstrated</p></div>
          <div className="mt-7 flex items-center gap-2"><CircleAlert size={15} className="text-emerald-300" /><h4 className="text-xs font-semibold uppercase tracking-[.12em] text-emerald-200">Unique focus areas</h4></div>
          <div className="mt-3 space-y-2.5">{rightGaps.length ? rightGaps.map((skill) => <GapCard key={skill.id} skill={skill} side="right" />) : <p className="rounded-[13px] border border-white/10 p-4 text-xs text-slate-400">No role-specific gaps identified.</p>}</div>
          <Button asChild className="mt-5 w-full bg-emerald-500 text-white hover:bg-emerald-400"><Link href={`/analyze?role=${data.right.roleId}`}>Analyze this path <ArrowRight size={14} /></Link></Button>
        </article>
      </div>

      <div className="relative border-t border-white/10 p-5 sm:p-7">
        <div className="grid gap-5 rounded-[16px] border border-white/10 bg-white/[.035] p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="grid size-11 place-items-center rounded-[13px] border border-amber-300/20 bg-amber-300/10 text-amber-300"><Star size={19} /></span>
          <div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">Current evidence signal</p>{closer ? <h3 className="mt-1.5 text-lg font-semibold text-white"><span className="text-emerald-300">{closer.roleTitle}</span> is the closer current fit.</h3> : <h3 className="mt-1.5 text-lg font-semibold text-white">Both paths currently have the same readiness score.</h3>}<p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{closer ? `The saved analyses differ by ${scoreDelta} points. Treat this as guidance from the evidence in your profile today, not a permanent career verdict.` : "Use the gap lists and work preferences—not the score alone—to choose your next direction."}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col"><Button asChild className={cn("min-w-48", closer?.id === data.right.id && "bg-emerald-500 hover:bg-emerald-400")}><Link href={closer ? `/analyze?role=${closer.roleId}` : "/roles"}><Target size={15} />{closer ? `Explore ${closer.roleTitle}` : "Explore roles"}</Link></Button><Link href="/skills" className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-white">Review your evidence <ArrowRight size={13} /></Link></div>
        </div>
      </div>
    </section>
  </div>;
}
