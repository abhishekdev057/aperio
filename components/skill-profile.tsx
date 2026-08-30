"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CircleHelp,
  Fingerprint,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { skillLevelLabel } from "@/lib/types";

type SkillRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  level: number | null;
  source: string | null;
  userVerified: boolean | null;
};

const levelSlug = ["aware", "beginner", "working", "proficient", "advanced"] as const;

export function SkillProfile({ skills }: { skills: SkillRow[] }) {
  const categories = useMemo(() => [...new Set(skills.map((item) => item.category))], [skills]);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(skills);
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const [selected, setSelected] = useState<SkillRow | null>(null);
  const [saving, setSaving] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesQuery = !normalized || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(normalized);
      return matchesQuery && (normalized ? true : item.category === activeCategory);
    });
  }, [query, rows, activeCategory]);

  async function update(skill: SkillRow, level: number) {
    setSaving(skill.id);
    const response = await fetch(`/api/v1/profile/skills/${skill.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ level: levelSlug[level], userVerified: true }),
    });
    if (response.ok) {
      const updated = { ...skill, level, userVerified: true, source: "manual" };
      setRows((items) => items.map((item) => item.id === skill.id ? updated : item));
      setSelected(updated);
    }
    setSaving("");
  }

  const assessed = rows.filter((item) => item.level !== null).length;
  const verified = rows.filter((item) => item.userVerified).length;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="aperio-panel h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="border-b p-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Skill families</p></div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto p-3 xl:block xl:space-y-1 xl:overflow-visible">
            {categories.map((category) => {
              const count = rows.filter((item) => item.category === category).length;
              const active = activeCategory === category && !query;
              return <button key={category} onClick={() => { setActiveCategory(category); setQuery(""); }} className={cn("flex shrink-0 items-center gap-2 rounded-[9px] px-3 py-2.5 text-left text-xs transition xl:w-full", active ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]")}><span className="size-1.5 rounded-full bg-current opacity-70" /><span className="min-w-0 flex-1 truncate">{category}</span><span className="text-[9px] opacity-60">{count}</span></button>;
            })}
          </div>
          <div className="grid grid-cols-2 gap-px border-t bg-[var(--border)]"><ProfileStat value={assessed} label="Assessed" /><ProfileStat value={verified} label="Verified" /></div>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--primary)]">Capability map</p><h2 className="mt-1 text-xl font-semibold tracking-[-.03em]">{query ? "Search results" : activeCategory}</h2></div>
            <div className="relative w-full sm:max-w-sm"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your skill profile" className="pl-10" /></div>
          </div>

          {filtered.length ? <div className="relative mt-5 overflow-hidden rounded-[20px] border bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_34%),radial-gradient(circle_at_center,transparent_0_32%,color-mix(in_srgb,var(--border)_65%,transparent)_33%_33.4%,transparent_34%_47%,color-mix(in_srgb,var(--border)_50%,transparent)_48%_48.4%,transparent_49%)]" />
            <div className="relative grid min-h-[430px] grid-cols-2 place-content-center gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((skill, index) => {
                const level = skill.level ?? -1;
                const strong = level >= 3;
                const developing = level >= 0 && level < 3;
                return <button key={skill.id} onClick={() => setSelected(skill)} className={cn("group relative mx-auto flex aspect-square w-full max-w-[132px] flex-col items-center justify-center rounded-full border bg-[var(--surface-glass)] p-3 text-center shadow-[var(--shadow)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[var(--shadow-raised)]", strong && "border-[color-mix(in_srgb,var(--positive)_35%,var(--border))]", developing && "border-[color-mix(in_srgb,var(--attention)_25%,var(--border))]", index % 3 === 1 && "sm:translate-y-5 sm:hover:translate-y-4")}>
                  <span className={cn("grid size-8 place-items-center rounded-full", strong ? "bg-[var(--positive-soft)] text-[var(--positive)]" : developing ? "bg-[var(--attention-soft)] text-[var(--attention)]" : "bg-[var(--surface-muted)] text-[var(--muted)]")}><Target size={14} /></span>
                  <span className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4">{skill.name}</span>
                  <span className="mt-1 text-[9px] text-[var(--muted)]">{level >= 0 ? skillLevelLabel[level] : "Not assessed"}</span>
                  {skill.userVerified && <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[var(--positive)] text-white"><Check size={11} /></span>}
                </button>;
              })}
            </div>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-5 border-t pt-4 text-[9px] text-[var(--muted)]"><Legend color="var(--positive)" label="Proficient or advanced" /><Legend color="var(--attention)" label="Aware to working" /><Legend color="var(--border-strong)" label="Not assessed" /></div>
          </div> : <div className="mt-5 rounded-[18px] border bg-[var(--surface)] py-16 text-center"><CircleHelp className="mx-auto text-[var(--muted)]" size={22} /><p className="mt-3 text-sm text-[var(--muted)]">No skills match your search.</p></div>}
        </section>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><SheetContent title={selected?.name}>{selected && <SkillEditor skill={selected} saving={saving === selected.id} onUpdate={(level) => update(selected, level)} />}</SheetContent></Sheet>
    </>
  );
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return <div className="bg-[var(--surface-elevated)] p-3 text-center"><p className="text-sm font-semibold">{value}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{label}</p></div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><i className="size-2 rounded-full border" style={{ background: color }} />{label}</span>;
}

function SkillEditor({ skill, saving, onUpdate }: { skill: SkillRow; saving: boolean; onUpdate: (level: number) => void }) {
  const current = skill.level ?? 0;
  return <div className="pt-5"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-[13px] bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles size={20} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">{skill.category}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.035em]">{skill.name}</h2></div></div><p className="mt-5 text-sm leading-6 text-[var(--muted-strong)]">{skill.description}</p>
    <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-[12px] border bg-[var(--surface-elevated)] p-4"><p className="text-[10px] text-[var(--muted)]">Current level</p><p className="mt-1 text-sm font-semibold">{skill.level !== null ? skillLevelLabel[skill.level] : "Not assessed"}</p></div><div className="rounded-[12px] border bg-[var(--surface-elevated)] p-4"><p className="text-[10px] text-[var(--muted)]">Source</p><p className="mt-1 truncate text-sm font-semibold capitalize">{skill.source || "No evidence yet"}</p></div></div>
    <div className="mt-7"><h3 className="flex items-center gap-2 text-sm font-semibold"><Fingerprint size={15} className="text-[var(--primary)]" />Correct this inference</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Your correction takes priority in future analyses. Select the level that best reflects your current experience.</p><div className="mt-4 space-y-2">{[0, 1, 2, 3, 4].map((level) => <button key={level} disabled={saving} onClick={() => onUpdate(level)} className={cn("flex w-full items-center gap-3 rounded-[11px] border p-3 text-left transition", current === level && skill.level !== null ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "bg-[var(--surface)] hover:bg-[var(--surface-muted)]")}><span className={cn("grid size-7 place-items-center rounded-full border text-[10px] font-semibold", current === level && skill.level !== null && "border-[var(--primary)] bg-[var(--primary)] text-white")}>{saving && current === level ? <LoaderCircle size={12} className="animate-spin" /> : level + 1}</span><span><span className="block text-xs font-semibold">{skillLevelLabel[level]}</span><span className="mt-0.5 block text-[9px] text-[var(--muted)]">{level === 0 ? "Familiar with the basics" : level === 1 ? "Learning with guidance" : level === 2 ? "Can contribute independently" : level === 3 ? "Can solve complex problems" : "Can guide others and shape practice"}</span></span>{current === level && skill.level !== null && <ShieldCheck size={15} className="ml-auto text-[var(--positive)]" />}</button>)}</div></div>
    {skill.userVerified && <div className="mt-6 flex items-start gap-2 rounded-[11px] bg-[var(--positive-soft)] p-4 text-xs leading-5 text-[var(--positive)]"><ShieldCheck size={15} className="mt-0.5 shrink-0" />This level has been verified by you.</div>}
  </div>;
}
