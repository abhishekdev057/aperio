"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Fingerprint,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn, formatRelative, scoreLabel } from "@/lib/utils";
import { skillLevelLabel, type AnalysisReport, type AnalysisSkill } from "@/lib/types";

type RoadmapItem = {
  id: string;
  skillName: string;
  status: "not_started" | "in_progress" | "completed";
  effort: string;
  priority: string;
};

type HistoryItem = {
  id: string;
  overallScore: number;
  roleTitle: string;
  createdAt: string;
};

const importance = {
  critical: "Must learn",
  high: "High impact",
  medium: "Should improve",
  optional: "Nice to have",
} as const;

const skillState = {
  strong: { label: "Strong match", color: "var(--positive)", soft: "var(--positive-soft)", icon: Check },
  developing: { label: "Developing", color: "var(--primary)", soft: "var(--primary-soft)", icon: Sparkles },
  missing: { label: "Not demonstrated", color: "var(--attention)", soft: "var(--attention-soft)", icon: CircleAlert },
};

function getCategoryCoverage(skills: AnalysisSkill[]) {
  const grouped = new Map<string, { score: number; count: number }>();
  for (const skill of skills) {
    const current = grouped.get(skill.category) ?? { score: 0, count: 0 };
    const ratio = Math.min(1, skill.currentLevel / Math.max(skill.targetLevel, 1));
    grouped.set(skill.category, { score: current.score + ratio * 100, count: current.count + 1 });
  }
  return [...grouped.entries()]
    .map(([category, value]) => ({ category, score: Math.round(value.score / value.count) }))
    .sort((a, b) => b.score - a.score);
}

function tone(score: number) {
  if (score >= 75) return "var(--positive)";
  if (score >= 55) return "#7c75ff";
  return "var(--attention)";
}

function CareerOrbit({ report, categories }: { report: AnalysisReport; categories: Array<{ category: string; score: number }> }) {
  const nodes = categories.slice(0, 4);
  const positions = ["left-[2%] top-[32%]", "right-[1%] top-[24%]", "bottom-[9%] left-[13%]", "bottom-[5%] right-[9%]"];

  return (
    <div className="relative mx-auto size-[286px] sm:size-[350px]" role="img" aria-label={`${report.overallScore}% match with category coverage around it`}>
      <div className="aperio-orbit absolute inset-[11%] rounded-full border border-dashed border-white/20" />
      <div className="aperio-orbit-reverse absolute inset-[22%] rounded-full border border-dotted border-white/25" />
      <div className="absolute inset-[29%] rounded-full bg-[conic-gradient(var(--positive)_calc(var(--score)*1%),rgb(255_255_255/10%)_0)] p-[10px] shadow-[0_0_55px_rgb(79_70_229/30%)]" style={{ "--score": report.overallScore } as React.CSSProperties}>
        <div className="grid size-full place-items-center rounded-full border border-white/10 bg-[#15194b]/95 text-center shadow-[inset_0_0_28px_rgb(255_255_255/4%)]">
          <div><p className="text-4xl font-semibold tracking-[-.06em] text-white sm:text-5xl">{report.overallScore}<span className="text-2xl">%</span></p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white/55">Career match</p></div>
        </div>
      </div>
      {nodes.map((item, index) => (
        <div key={item.category} className={cn("absolute z-10", positions[index])}>
          <div className="flex items-center gap-2 rounded-[9px] border border-white/10 bg-[#11163d]/90 px-2.5 py-2 text-white shadow-lg backdrop-blur-md">
            <span className="aperio-node size-2.5 rounded-full" style={{ background: tone(item.score), boxShadow: `0 0 12px ${tone(item.score)}` }} />
            <span><span className="block max-w-24 truncate text-[10px] font-semibold">{item.category}</span><span className="mt-0.5 block text-[9px] text-white/55">{item.score}% coverage</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewDashboard({ report, roadmapItems, history }: { report: AnalysisReport; roadmapItems: RoadmapItem[]; history: HistoryItem[] }) {
  const [selected, setSelected] = useState<AnalysisSkill | null>(null);
  const categories = getCategoryCoverage(report.skills);
  const strongSkills = report.skills.filter((skill) => skill.classification === "strong").slice(0, 5);
  const topGaps = report.skills.filter((skill) => skill.classification !== "strong").slice(0, 3);
  const total = Math.max(report.skills.length, 1);
  const coverage = {
    strong: Math.round((report.matchedCount / total) * 100),
    developing: Math.round((report.developingCount / total) * 100),
    missing: Math.round((report.missingCount / total) * 100),
  };
  const roleHistory = history.filter((item) => item.roleTitle === report.roleTitle).slice(0, 4).reverse();

  return (
    <>
      <section className="aperio-hero aperio-reveal relative overflow-hidden rounded-[22px] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/2%)_1px,transparent_1px),linear-gradient(rgb(255_255_255/2%)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:linear-gradient(to_right,black,transparent_78%)]" />
        <div className="relative grid min-h-[420px] items-center gap-6 px-6 py-8 sm:px-9 lg:grid-cols-[.9fr_1.1fr] lg:px-11 lg:py-10">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/55">Career intelligence</p>
            <p className="mt-6 text-xl font-light text-white/75 sm:text-2xl">Your path to</p>
            <div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-[40px]">{report.roleTitle}</h2><span className="rounded-[7px] border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold capitalize text-white/80">{report.experienceLevel}</span></div>
            <div className="mt-7 flex items-end gap-3"><p className="text-4xl font-semibold tracking-[-.055em] text-[#56d98f] sm:text-5xl">{report.overallScore}%</p><p className="pb-1.5 text-base font-semibold text-[#56d98f]">{scoreLabel(report.overallScore)}</p></div>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65">Based on your current profile, {report.matchedCount} of {report.skills.length} evaluated skills are strongly demonstrated for this role.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="bg-[#5b50f2] shadow-[0_12px_28px_rgb(30_20_120/32%)] hover:bg-[#6c62ff]"><Link href="/roadmap">Continue roadmap <ArrowRight size={15} /></Link></Button><Button asChild variant="secondary" className="border-white/15 bg-white/7 text-white hover:bg-white/12"><Link href={`/history/${report.id}`}>Why this result?</Link></Button></div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-[10px] text-white/55"><span className="flex items-center gap-1.5"><FileCheck2 size={12} className="text-[#56d98f]" />{report.resumeFilename ? "Verified resume evidence" : "Profile evidence"}</span><span>{formatRelative(report.createdAt)}</span></div>
          </div>
          <CareerOrbit report={report} categories={categories} />
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.92fr_.86fr]">
        <section className="aperio-panel overflow-hidden">
          <SectionHeader icon={CircleAlert} title="Top gaps to close" action="View all" href={`/history/${report.id}`} tone="attention" />
          <div className="px-5 pb-2">
            {topGaps.length ? topGaps.map((skill, index) => (
              <button key={skill.id} onClick={() => setSelected(skill)} className="group flex w-full gap-3 border-b py-4 text-left last:border-0">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-[11px] font-semibold text-[var(--muted-strong)]">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold">{skill.name}</span><span className="rounded-[5px] bg-[var(--attention-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--attention)]">{importance[skill.importance]}</span></span><span className="mt-1.5 block text-[11px] leading-4 text-[var(--muted)]">{skill.whyItMatters}</span><span className="mt-2 flex items-center gap-2 text-[9px] font-semibold text-[var(--muted)]"><span>{skillLevelLabel[skill.currentLevel]}</span><ArrowRight size={10} /><span>{skillLevelLabel[skill.targetLevel]}</span></span></span>
                <ChevronRight size={14} className="mt-1 text-[var(--muted)] transition group-hover:translate-x-0.5" />
              </button>
            )) : <div className="py-10 text-center"><ShieldCheck className="mx-auto text-[var(--positive)]" size={22} /><p className="mt-3 text-xs text-[var(--muted)]">No priority gaps in this analysis.</p></div>}
          </div>
        </section>

        <section className="aperio-panel overflow-hidden">
          <SectionHeader icon={Sparkles} title="Why this result?" />
          <div className="p-5"><p className="text-xs leading-5 text-[var(--muted-strong)]">{report.summary}</p>{strongSkills.length > 0 && <div className="mt-5 border-t pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-[var(--muted)]">Strong evidence in</p><div className="mt-3 flex flex-wrap gap-2">{strongSkills.map((skill) => <button key={skill.id} onClick={() => setSelected(skill)} className="rounded-[7px] bg-[var(--positive-soft)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--positive)] transition hover:-translate-y-0.5">{skill.name}</button>)}</div></div>}<Link href={`/history/${report.id}`} className="mt-5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]">How Aperio calculated this <ArrowRight size={12} /></Link></div>
        </section>

        <section className="aperio-panel overflow-hidden">
          <SectionHeader icon={Target} title="Skill coverage" action="View skills" href="/skills" />
          <div className="space-y-4 p-5">{categories.slice(0, 6).map((item) => <div key={item.category}><div className="flex items-center justify-between gap-3 text-[10px]"><span className="truncate font-semibold">{item.category}</span><span className="font-semibold text-[var(--muted-strong)]">{item.score}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${item.score}%`, background: tone(item.score) }} /></div></div>)}<div className="grid grid-cols-3 gap-2 border-t pt-4 text-center"><CoverageStat value={coverage.strong} label="Strong" color="var(--positive)" /><CoverageStat value={coverage.developing} label="Developing" color="var(--primary)" /><CoverageStat value={coverage.missing} label="Gaps" color="var(--attention)" /></div></div>
        </section>
      </div>

      <section className="aperio-panel mt-5 overflow-hidden">
        <SectionHeader icon={Route} title="Your personalized next steps" action="Open roadmap" href="/roadmap" />
        {roadmapItems.length ? <div className="grid gap-0 divide-y p-5 lg:grid-cols-4 lg:divide-x lg:divide-y-0">{roadmapItems.slice(0, 4).map((item, index) => <div key={item.id} className="relative flex gap-3 py-4 first:pt-0 last:pb-0 lg:px-5 lg:py-0 lg:first:pl-0 lg:last:pr-0"><span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold", item.status === "completed" ? "bg-[var(--positive)] text-white" : item.status === "in_progress" ? "bg-[var(--primary)] text-white" : "border bg-[var(--surface)] text-[var(--muted-strong)]")}>{item.status === "completed" ? <Check size={14} /> : index + 1}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{item.skillName}</p><p className="mt-1 text-[10px] capitalize text-[var(--muted)]">{item.status.replace("_", " ")} · {item.effort}</p><span className="mt-2 inline-block rounded-[5px] bg-[var(--primary-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--primary)]">{item.priority}</span></div></div>)}</div> : <p className="p-8 text-center text-xs text-[var(--muted)]">No roadmap steps are available for this analysis.</p>}
      </section>

      {roleHistory.length > 1 && <section className="mt-5 flex flex-col gap-3 rounded-[16px] border bg-[var(--surface-elevated)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold">Readiness progression for {report.roleTitle}</p><p className="mt-1 text-[10px] text-[var(--muted)]">Only saved analyses are included.</p></div><div className="flex items-center gap-2">{roleHistory.map((item, index) => <span key={item.id} className="flex items-center gap-2 text-xs font-semibold"><span>{item.overallScore}%</span>{index < roleHistory.length - 1 && <ArrowRight size={12} className="text-[var(--muted)]" />}</span>)}<Link href="/history" className="ml-2 text-[10px] font-semibold text-[var(--primary)]">History</Link></div></section>}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><SheetContent title={selected?.name}>{selected && <SkillDetail skill={selected} reportId={report.id} />}</SheetContent></Sheet>
    </>
  );
}

function CoverageStat({ value, label, color }: { value: number; label: string; color: string }) {
  return <div><p className="text-sm font-semibold" style={{ color }}>{value}%</p><p className="mt-1 text-[9px] text-[var(--muted)]">{label}</p></div>;
}

function SectionHeader({ icon: Icon, title, action, href, tone = "primary" }: { icon: typeof Target; title: string; action?: string; href?: string; tone?: "primary" | "attention" }) {
  return <div className="flex items-center justify-between gap-3 border-b px-5 py-4"><h2 className="flex items-center gap-2 text-xs font-semibold"><Icon size={15} className={tone === "attention" ? "text-[var(--attention)]" : "text-[var(--primary)]"} />{title}</h2>{action && href && <Link href={href} className="flex items-center gap-1 text-[10px] font-semibold text-[var(--primary)]">{action}<ArrowRight size={11} /></Link>}</div>;
}

function SkillDetail({ skill, reportId }: { skill: AnalysisSkill; reportId: string }) {
  const state = skillState[skill.classification];
  const Icon = state.icon;
  return <div className="pt-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-[12px]" style={{ color: state.color, background: state.soft }}><Icon size={19} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">{skill.category}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">{skill.name}</h2></div></div><Badge className="mt-4" style={{ color: state.color, background: state.soft, borderColor: "transparent" }}>{state.label}</Badge><div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border bg-[var(--border)]"><Metric label="Current level" value={skillLevelLabel[skill.currentLevel]} /><Metric label="Role target" value={skillLevelLabel[skill.targetLevel]} /><Metric label="Priority" value={importance[skill.importance]} /><Metric label="Confidence" value={`${Math.round(Number(skill.confidence) * 100)}%`} /></div><div className="mt-7"><h3 className="flex items-center gap-2 text-sm font-semibold"><Fingerprint size={15} className="text-[var(--primary)]" />Evidence</h3>{skill.evidence.length ? <div className="mt-3 space-y-3">{skill.evidence.map((item, index) => <blockquote key={index} className="rounded-[11px] border bg-[var(--surface-elevated)] p-4 text-xs leading-5 text-[var(--muted-strong)]">“{item.quote}”<footer className="mt-2 text-[10px] font-semibold text-[var(--muted)]">{item.source}</footer></blockquote>)}</div> : <p className="mt-3 rounded-[11px] bg-[var(--attention-soft)] p-4 text-xs leading-5 text-[var(--muted-strong)]">This skill was not clearly demonstrated in the current profile. That is not a claim that you do not know it.</p>}</div><div className="mt-7"><h3 className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={15} className="text-[var(--primary)]" />Recommended next step</h3><p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">{skill.recommendation}</p></div><Button asChild className="mt-7 w-full"><Link href={`/history/${reportId}`}>Open full evidence report</Link></Button></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--surface-elevated)] p-4"><p className="text-[10px] text-[var(--muted)]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
