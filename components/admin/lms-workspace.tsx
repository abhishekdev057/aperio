"use client";

import { useState } from "react";
import { BrainCircuit, GraduationCap, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseManager } from "@/components/admin/course-manager";
import { QuestionSetManager } from "@/components/admin/question-set-manager";

type SkillOption = { id: string; name: string; skillType: string };

export function LmsWorkspace({
  courses,
  skills,
  questionSets,
  initialTab,
}: {
  courses: Record<string, unknown>[];
  skills: SkillOption[];
  questionSets: Record<string, unknown>[];
  initialTab?: string;
}) {
  const [tab, setTab] = useState<"courses" | "practice">(initialTab === "practice" ? "practice" : "courses");

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[20px] border border-[#2a3a68] bg-[#0a1625] p-5 text-white sm:p-6"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(99,102,241,.4),transparent_40%),linear-gradient(rgba(148,163,184,.035)_1px,transparent_1px)] bg-[size:auto,auto_36px]" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-indigo-200"><BrainCircuit size={14} />AI content operations</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Learning studio</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Author courses and practice sets with Gemini, review every generated draft, then control what becomes visible to users.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-[9px] border border-white/10 bg-white/[.05] px-3 py-2 text-[10px] font-semibold text-indigo-200"><Sparkles size={13} />Human-reviewed publishing</span></div></section>

      <div className="inline-flex rounded-[11px] border bg-[var(--surface)] p-1 shadow-[var(--shadow-xs)]">
        {([
          ["courses", "Courses", GraduationCap],
          ["practice", "Practice sets", ListChecks],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition",
              tab === key ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "courses" ? (
        <CourseManager initialCourses={courses} skills={skills} embedded />
      ) : (
        <QuestionSetManager initial={questionSets} embedded />
      )}
    </div>
  );
}
