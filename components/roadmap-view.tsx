"use client";

import { useState } from "react";
import { Check, Circle, Clock3, LoaderCircle, PlayCircle, Route, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  phase: number;
  priority: string;
  effort: string;
  status: "not_started" | "in_progress" | "completed";
  recommendedAction: string;
  whyItMatters: string;
  skillName: string;
  category: string;
};

const phases = {
  1: ["Foundations", "Build the highest-leverage capabilities first."],
  2: ["Production engineering", "Apply the skills in realistic delivery contexts."],
  3: ["Systems thinking", "Connect the parts and deepen role-level judgment."],
} as const;

export function RoadmapView({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState("");
  const completed = items.filter((item) => item.status === "completed").length;
  const inProgress = items.filter((item) => item.status === "in_progress").length;
  const progress = Math.round((completed / Math.max(items.length, 1)) * 100);

  async function update(item: Item, status: Item["status"]) {
    setSaving(item.id);
    const response = await fetch(`/api/v1/roadmaps/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, status } : row));
    setSaving("");
  }

  return <div>
    <section className="aperio-hero overflow-hidden rounded-[20px] p-6 text-white sm:p-8"><div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/55">Learning journey</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Your next best moves, in the right order.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Progress records your learning state. Reanalysis still requires evidence before Aperio treats a skill as demonstrated.</p></div><div className="grid grid-cols-3 gap-5 text-center"><JourneyStat value={`${progress}%`} label="Completed" /><JourneyStat value={String(inProgress)} label="In progress" /><JourneyStat value={String(items.length)} label="Total actions" /></div></div><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-[#45d68b] to-[#7467f3] transition-[width] duration-700" style={{ width: `${progress}%` }} /></div></section>

    <div className="relative mt-6 grid gap-5 xl:grid-cols-3"><div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-[var(--border-strong)] xl:block" />{([1, 2, 3] as const).map((phase) => {
      const phaseItems = items.filter((item) => item.phase === phase);
      if (!phaseItems.length) return null;
      const phaseComplete = phaseItems.every((item) => item.status === "completed");
      return <section key={phase} className="relative overflow-hidden rounded-[18px] border bg-[var(--surface)] shadow-[var(--shadow)]"><div className="relative border-b bg-[var(--surface-elevated)] p-5"><span className={cn("relative z-10 grid size-8 place-items-center rounded-full text-xs font-semibold", phaseComplete ? "bg-[var(--positive)] text-white" : "bg-[var(--primary)] text-white")}>{phaseComplete ? <Check size={14} /> : phase}</span><p className="mt-4 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--primary)]">Phase {phase}</p><h2 className="mt-1 text-lg font-semibold tracking-[-.025em]">{phases[phase][0]}</h2><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{phases[phase][1]}</p></div><div>{phaseItems.map((item) => <RoadmapItem key={item.id} item={item} saving={saving === item.id} onUpdate={(status) => update(item, status)} />)}</div></section>;
    })}</div>

    <div className="mt-5 flex items-start gap-2 rounded-[14px] border bg-[var(--surface-elevated)] px-4 py-3 text-[10px] leading-5 text-[var(--muted)]"><Sparkles size={13} className="mt-0.5 shrink-0 text-[var(--primary)]" />Completed tasks help you track learning, but mastery is only updated when later profile or resume evidence supports it.</div>
  </div>;
}

function RoadmapItem({ item, saving, onUpdate }: { item: Item; saving: boolean; onUpdate: (status: Item["status"]) => void }) {
  const next = item.status === "not_started" ? "in_progress" : item.status === "in_progress" ? "completed" : "not_started";
  return <article className="border-b p-5 last:border-0"><div className="flex items-start gap-3"><button onClick={() => onUpdate(next)} className={cn("grid size-8 shrink-0 place-items-center rounded-full transition", item.status === "completed" ? "bg-[var(--positive)] text-white" : item.status === "in_progress" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "border text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]")} aria-label={`Change status for ${item.skillName}`}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : item.status === "completed" ? <Check size={15} /> : item.status === "in_progress" ? <PlayCircle size={15} /> : <Circle size={13} />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{item.skillName}</h3><span className="rounded-[5px] bg-[var(--attention-soft)] px-1.5 py-0.5 text-[9px] font-semibold capitalize text-[var(--attention)]">{item.priority}</span></div><p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{item.recommendedAction}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[var(--muted)]"><span className="flex items-center gap-1"><Clock3 size={11} />{item.effort}</span><span className="flex items-center gap-1"><Route size={11} />{item.category}</span></div><details className="mt-3"><summary className="cursor-pointer text-[10px] font-semibold text-[var(--primary)]">Why this matters</summary><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{item.whyItMatters}</p></details></div></div></article>;
}

function JourneyStat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1 text-[9px] text-white/50">{label}</p></div>;
}
