"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Braces, Check, CloudCog, Code2, Database, Palette, Search, ShieldCheck, Smartphone, Sparkles, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelative, scoreLabel } from "@/lib/utils";

type Role = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  estimatedMatch: number | null;
  lastAnalyzedAt: string | null;
  skillFamilies: string[];
  requirementCount: number;
};

const categoryStyle: Record<string, { icon: typeof Code2; accent: string; soft: string }> = {
  Engineering: { icon: Code2, accent: "#6d5dfc", soft: "color-mix(in srgb, #6d5dfc 12%, transparent)" },
  Data: { icon: Database, accent: "#2f86eb", soft: "color-mix(in srgb, #2f86eb 12%, transparent)" },
  Infrastructure: { icon: CloudCog, accent: "#0ea5b7", soft: "color-mix(in srgb, #0ea5b7 12%, transparent)" },
  Security: { icon: ShieldCheck, accent: "#f59e0b", soft: "color-mix(in srgb, #f59e0b 12%, transparent)" },
  Design: { icon: Palette, accent: "#ec4899", soft: "color-mix(in srgb, #ec4899 12%, transparent)" },
  Mobile: { icon: Smartphone, accent: "#8b5cf6", soft: "color-mix(in srgb, #8b5cf6 12%, transparent)" },
};

function scoreTone(score: number) {
  if (score >= 75) return "var(--positive)";
  if (score >= 55) return "var(--primary)";
  return "var(--attention)";
}

export function RoleExplorer({ roles, historyCount }: { roles: Role[]; historyCount: number }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All paths");
  const [selectedId, setSelectedId] = useState(roles.find((role) => role.estimatedMatch !== null)?.id ?? roles[0]?.id ?? "");
  const categories = ["All paths", ...Array.from(new Set(roles.map((role) => role.category)))];
  const filtered = useMemo(() => roles.filter((role) => {
    const matchesCategory = category === "All paths" || role.category === category;
    const haystack = `${role.title} ${role.description} ${role.category} ${role.skillFamilies.join(" ")}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [category, query, roles]);
  const selected = roles.find((role) => role.id === selectedId) ?? filtered[0] ?? roles[0];

  if (!roles.length) return <div className="aperio-panel px-6 py-16 text-center"><h2 className="text-lg font-semibold">Role data is unavailable</h2><p className="mt-2 text-sm text-[var(--muted)]">Please try again when the career catalog is available.</p></div>;

  return (
    <div>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="aperio-eyebrow text-[var(--primary)]"><Sparkles size={14} />Career landscape</p>
          <h1 className="aperio-page-title mt-3">Explore career paths</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">See how your existing evidence carries across roles, then choose the path worth analyzing next.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-[12px] border bg-[var(--surface)] px-3.5 shadow-[var(--shadow-xs)] sm:w-80">
            <Search size={17} className="shrink-0 text-[var(--muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles or skill families" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" aria-label="Search career roles" />
            {query && <button onClick={() => setQuery("")} className="text-[var(--muted)]" aria-label="Clear search"><X size={15} /></button>}
          </label>
          {historyCount >= 2 && <Button asChild variant="secondary" className="h-11"><Link href="/roles/compare"><BarChart3 size={16} />Compare roles</Link></Button>}
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter roles by category">
        {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={cn("shrink-0 rounded-[10px] border px-3.5 py-2 text-xs font-semibold transition", category === item ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-[var(--surface)] text-[var(--muted-strong)] hover:border-[var(--border-strong)]")}>{item}</button>)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="aperio-panel relative min-h-[630px] overflow-hidden p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_58%),linear-gradient(color-mix(in_srgb,var(--border)_55%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--border)_55%,transparent)_1px,transparent_1px)] [background-size:auto,34px_34px,34px_34px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color-mix(in_srgb,var(--primary)_24%,transparent)] lg:block" />
          <div className="relative flex items-center justify-between border-b pb-4">
            <div><p className="text-sm font-semibold">Role constellation</p><p className="mt-1 text-xs text-[var(--muted)]">Select a node to inspect its current fit</p></div>
            <span className="rounded-[9px] bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)]">{filtered.length} roles</span>
          </div>
          {filtered.length ? <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((role, index) => {
              const style = categoryStyle[role.category] ?? { icon: Braces, accent: "var(--primary)", soft: "var(--primary-soft)" };
              const Icon = style.icon;
              const active = selected?.id === role.id;
              return <button key={role.id} onClick={() => setSelectedId(role.id)} className={cn("group relative min-h-40 overflow-hidden rounded-[16px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow)]", active ? "border-[var(--primary)] bg-[var(--surface)] shadow-[0_16px_44px_color-mix(in_srgb,var(--primary)_12%,transparent)]" : "bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] hover:border-[var(--border-strong)]")} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                <span className="absolute -right-7 -top-7 size-24 rounded-full opacity-70 blur-2xl" style={{ background: style.soft }} />
                <span className="relative flex items-start justify-between gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[11px]" style={{ color: style.accent, background: style.soft }}><Icon size={17} /></span>{role.estimatedMatch !== null ? <span className="text-right"><strong className="block text-xl leading-none" style={{ color: scoreTone(role.estimatedMatch) }}>{role.estimatedMatch}%</strong><span className="text-[9px] text-[var(--muted)]">estimated match</span></span> : <span className="rounded-md bg-[var(--surface-muted)] px-2 py-1 text-[9px] font-medium text-[var(--muted)]">Not assessed</span>}</span>
                <span className="relative mt-4 block text-[14px] font-semibold">{role.title}</span>
                <span className="relative mt-1.5 line-clamp-2 block text-[11px] leading-5 text-[var(--muted)]">{role.description}</span>
                <span className="relative mt-3 flex items-center gap-1.5 text-[10px] font-medium" style={{ color: style.accent }}><span className="size-1.5 rounded-full" style={{ background: style.accent }} />{role.category}</span>
              </button>;
            })}
          </div> : <div className="relative grid min-h-[440px] place-items-center text-center"><div><Search className="mx-auto text-[var(--muted)]" /><h2 className="mt-4 font-semibold">No matching role</h2><p className="mt-2 text-sm text-[var(--muted)]">Try a broader search or another category.</p></div></div>}
        </section>

        {selected && <aside className="aperio-panel h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="relative border-b p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_70%)]" />
            <div className="relative flex items-start gap-3">
              {(() => { const style = categoryStyle[selected.category] ?? { icon: Braces, accent: "var(--primary)", soft: "var(--primary-soft)" }; const Icon = style.icon; return <span className="grid size-11 shrink-0 place-items-center rounded-[13px]" style={{ color: style.accent, background: style.soft }}><Icon size={20} /></span>; })()}
              <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Selected path</p><h2 className="mt-1 text-xl font-semibold tracking-[-.025em]">{selected.title}</h2></div>
            </div>
            {selected.estimatedMatch !== null ? <div className="relative mt-6 flex items-end justify-between"><div><strong className="text-5xl tracking-[-.06em]" style={{ color: scoreTone(selected.estimatedMatch) }}>{selected.estimatedMatch}<span className="text-2xl">%</span></strong><p className="mt-1 text-xs font-medium" style={{ color: scoreTone(selected.estimatedMatch) }}>{scoreLabel(selected.estimatedMatch)}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-[.1em] text-[var(--muted)]">Last analyzed</p><p className="mt-1 text-xs font-semibold">{selected.lastAnalyzedAt ? formatRelative(selected.lastAnalyzedAt) : "—"}</p></div></div> : <div className="relative mt-6 rounded-[12px] bg-[var(--primary-soft)] p-4"><p className="text-sm font-semibold text-[var(--primary)]">No readiness estimate yet</p><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Analyze this role to map your current profile evidence to its requirements.</p></div>}
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-[var(--muted-strong)]">{selected.description}</p>
            <div className="mt-6"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Core skill families</p><span className="text-[10px] text-[var(--muted)]">{selected.requirementCount} requirements</span></div><div className="mt-3 flex flex-wrap gap-2">{selected.skillFamilies.map((family) => <span key={family} className="inline-flex items-center gap-1.5 rounded-[8px] border bg-[var(--surface-elevated)] px-2.5 py-1.5 text-[11px] font-medium"><Check size={11} className="text-[var(--positive)]" />{family}</span>)}</div></div>
            <div className="mt-6 rounded-[13px] border bg-[var(--surface-elevated)] p-4"><div className="flex items-start gap-3"><Target size={16} className="mt-0.5 shrink-0 text-[var(--primary)]" /><div><p className="text-xs font-semibold">Guidance based on your evidence</p><p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">Readiness appears only after a real analysis. Aperio never invents a score for unexplored roles.</p></div></div></div>
            <Button asChild className="mt-5 w-full"><Link href={`/analyze?role=${selected.id}`}>{selected.estimatedMatch !== null ? "Re-analyze this role" : "Analyze this role"}<ArrowRight size={15} /></Link></Button>
          </div>
        </aside>}
      </div>

      <section className="mt-5 flex flex-col gap-4 rounded-[17px] border bg-[linear-gradient(110deg,var(--primary-faint),var(--surface))] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-xs)]"><BarChart3 size={18} /></span><div><h2 className="text-sm font-semibold">Compare paths using saved analyses</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Shared strengths and role-specific gaps use your persisted reports—not generic role assumptions.</p></div></div>
        {historyCount >= 2 ? <Button asChild variant="secondary"><Link href="/roles/compare">Open comparison <ArrowRight size={15} /></Link></Button> : <p className="shrink-0 text-xs font-medium text-[var(--muted)]">Analyze {Math.max(0, 2 - historyCount)} more {2 - historyCount === 1 ? "role" : "roles"} to unlock</p>}
      </section>
    </div>
  );
}
