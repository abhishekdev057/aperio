"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, BrainCircuit, Dumbbell, GraduationCap, LibraryBig, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoursesView } from "@/components/courses-view";
import { PracticeBoard } from "@/components/practice-board";
import { QuizSets } from "@/components/quiz-sets";

export function LearnHub({ courses, practice, quizSets, initialTab }: { courses: { recommended: never[]; enrolled: never[] }; practice: { sessions: never[]; suggestions: never[] }; quizSets: never[]; initialTab?: string }) {
  const [tab, setTab] = useState<"courses" | "practice">(initialTab === "practice" ? "practice" : "courses");
  return <div className="aperio-page mx-auto max-w-[1180px]">
    <section className="relative overflow-hidden rounded-[22px] border border-[#2c3d72] bg-[#101b41] p-5 text-white shadow-[0_24px_70px_rgba(25,36,84,.22)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(109,93,252,.5),transparent_36%),radial-gradient(circle_at_12%_100%,rgba(16,185,129,.18),transparent_34%),linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:auto,auto,36px_36px,36px_36px]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-200"><BrainCircuit size={14} />Evidence-to-action learning</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Your learning studio</h1><p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80">Use courses for structured depth and practice for focused repetition. Recommendations map back to the gaps in your real analyses.</p></div><Link href="/learning" className="inline-flex w-fit items-center gap-2 rounded-[11px] border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/15"><GraduationCap size={15} />Open course plan <ArrowRight size={14} /></Link></div>
      <div className="relative mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-[13px] border border-white/10 bg-white/[.055] p-3.5"><BookMarked size={16} className="text-indigo-200" /><strong className="mt-2 block text-xl">{courses.enrolled.length}</strong><span className="text-[10px] text-indigo-200">Enrolled courses</span></div><div className="rounded-[13px] border border-white/10 bg-white/[.055] p-3.5"><Sparkles size={16} className="text-emerald-300" /><strong className="mt-2 block text-xl">{courses.recommended.length}</strong><span className="text-[10px] text-indigo-200">Gap-matched courses</span></div><div className="rounded-[13px] border border-white/10 bg-white/[.055] p-3.5"><Dumbbell size={16} className="text-amber-300" /><strong className="mt-2 block text-xl">{practice.sessions.length}</strong><span className="text-[10px] text-indigo-200">Practice sessions</span></div></div>
    </section>

    <div className="mt-5 flex border-b" role="tablist" aria-label="Learning workspace">
      {([ ["courses", "Courses", LibraryBig, "Structured learning"], ["practice", "Practice", Dumbbell, "Focused repetition"] ] as const).map(([key, label, Icon, hint]) => <button key={key} onClick={() => setTab(key)} role="tab" aria-selected={tab === key} className={cn("relative flex min-w-0 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-4 text-left transition sm:flex-none sm:justify-start sm:px-5", tab === key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", tab === key ? "bg-[var(--primary-soft)]" : "bg-[var(--surface-muted)]")}><Icon size={16} /></span><span><span className="block text-sm font-semibold">{label}</span><span className="hidden text-[10px] text-[var(--muted)] sm:block">{hint}</span></span></button>)}
    </div>

    <div className="mt-7">{tab === "courses" ? <CoursesView initial={courses} /> : <><PracticeBoard initial={practice} /><QuizSets initial={quizSets} /></>}</div>
  </div>;
}
