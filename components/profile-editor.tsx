"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, CircleUserRound, Compass, Fingerprint, LocateFixed, Save, ShieldCheck, Sparkles, Target, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RoleSummary } from "@/lib/types";

const statuses = [
  { value: "student", label: "Student", hint: "Building foundations" },
  { value: "fresher", label: "Fresher", hint: "Entering the market" },
  { value: "professional", label: "Professional", hint: "Growing in-role" },
  { value: "career_switcher", label: "Career switcher", hint: "Changing direction" },
];

export function ProfileEditor({ profile, roles }: { profile: Record<string, unknown>; roles: RoleSummary[] }) {
  const [state, setState] = useState(profile);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  function field(name: string, value: unknown) { setState((previous) => ({ ...previous, [name]: value })); setSaved(false); }
  const complete = useMemo(() => {
    const keys = ["fullName", "headline", "currentStatus", "bio", "location", "yearsExperience", "targetRoleId", "targetLevel"];
    const count = keys.filter((key) => state[key] !== null && state[key] !== undefined && String(state[key]).trim() !== "").length;
    return Math.round((count / keys.length) * 100);
  }, [state]);
  const targetRole = roles.find((role) => role.id === state.targetRoleId);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage(""); setSaved(false);
    try {
      const response = await fetch("/api/v1/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: state.fullName, headline: state.headline || null, currentStatus: state.currentStatus || null, bio: state.bio || null, location: state.location || null, yearsExperience: Number(state.yearsExperience) || 0, targetRoleId: state.targetRoleId || null, targetLevel: state.targetLevel || null }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not save profile.");
      setSaved(true); setMessage("Profile saved. Future analyses will use this context.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally { setSaving(false); }
  }

  return <form onSubmit={save}>
    <section className="relative overflow-hidden rounded-[22px] border border-[#2d3d74] bg-[#111c43] p-5 text-white shadow-[0_24px_70px_rgba(24,35,85,.2)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,.38),transparent_34%),linear-gradient(120deg,transparent_30%,rgba(255,255,255,.045)_50%,transparent_70%)]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4"><span className="grid size-16 shrink-0 place-items-center rounded-[18px] border border-white/15 bg-gradient-to-br from-[#6d5dfc] to-[#2f6fea] text-2xl font-bold shadow-lg">{String(state.fullName || "A").charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-200">Professional identity</p><h2 className="mt-1 truncate text-2xl font-semibold tracking-[-.035em]">{String(state.fullName || "Your profile")}</h2><p className="mt-1 truncate text-xs text-indigo-200">{String(state.headline || state.email || "Add a headline that explains your value")}</p></div></div>
        <div className="flex items-center gap-4 rounded-[14px] border border-white/10 bg-white/[.055] p-3 pr-4 backdrop-blur"><span className="relative grid size-14 place-items-center rounded-full" style={{ background: `conic-gradient(#6ee7b7 ${complete * 3.6}deg, rgba(255,255,255,.12) 0)` }}><span className="absolute inset-[5px] rounded-full bg-[#16224d]" /><strong className="relative text-xs">{complete}%</strong></span><div><p className="text-xs font-semibold">Profile completeness</p><p className="mt-1 text-[10px] text-indigo-200">Better context, clearer guidance</p></div></div>
      </div>
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="space-y-5">
        <section className="aperio-panel p-5 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary)]"><CircleUserRound size={18} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Profile basics</p><h2 className="mt-1 text-lg font-semibold">The context behind your resume</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Add information that may not be obvious from uploaded documents.</p></div></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label><span className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><UserRound size={13} className="text-[var(--muted)]" />Full name</span><Input value={String(state.fullName || "")} onChange={(event) => field("fullName", event.target.value)} /></label>
            <label><span className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><LocateFixed size={13} className="text-[var(--muted)]" />Location</span><Input value={String(state.location || "")} onChange={(event) => field("location", event.target.value)} placeholder="City, country" /></label>
            <label className="sm:col-span-2"><span className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><BriefcaseBusiness size={13} className="text-[var(--muted)]" />Professional headline</span><Input value={String(state.headline || "")} onChange={(event) => field("headline", event.target.value)} placeholder="What you do and where you create value" /></label>
            <label><span className="mb-2 block text-xs font-semibold">Years of experience</span><Input type="number" min="0" max="60" step="0.5" value={String(state.yearsExperience ?? 0)} onChange={(event) => field("yearsExperience", event.target.value)} /></label>
            <div><span className="mb-2 block text-xs font-semibold">Account email</span><div className="flex h-11 items-center rounded-[10px] border bg-[var(--surface-muted)] px-3 text-sm text-[var(--muted)]">{String(state.email || "")}</div></div>
            <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold">Professional summary</span><Textarea value={String(state.bio || "")} onChange={(event) => field("bio", event.target.value)} placeholder="Summarize your experience, strengths, and the kind of problems you solve." className="min-h-32" /></label>
          </div>
        </section>

        <section className="aperio-panel p-5 sm:p-7">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[11px] bg-[var(--positive-soft)] text-[var(--positive)]"><Fingerprint size={18} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Current context</p><h2 className="mt-1 text-lg font-semibold">Where you are today</h2></div></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{statuses.map((item) => { const active = state.currentStatus === item.value; return <button type="button" key={item.value} onClick={() => field("currentStatus", item.value)} className={cn("flex items-center gap-3 rounded-[13px] border p-3.5 text-left transition", active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]")}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", active && "border-[var(--primary)] bg-[var(--primary)] text-white")}>{active && <Check size={13} />}</span><span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-0.5 block text-[10px] text-[var(--muted)]">{item.hint}</span></span></button>; })}</div>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
        <section className="aperio-panel overflow-hidden"><div className="border-b bg-[linear-gradient(120deg,var(--primary-faint),var(--surface))] p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[11px] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-xs)]"><Compass size={18} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Career target</p><h2 className="mt-1 text-lg font-semibold">Where you are heading</h2></div></div></div><div className="p-5"><label className="block"><span className="mb-2 block text-xs font-semibold">Target role</span><select value={String(state.targetRoleId || "")} onChange={(event) => field("targetRoleId", event.target.value)} className="h-11 w-full rounded-[10px] border bg-[var(--surface-elevated)] px-3 text-sm font-medium"><option value="">Select a role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}</select></label><fieldset className="mt-4"><legend className="mb-2 text-xs font-semibold">Target level</legend><div className="grid grid-cols-3 rounded-[11px] bg-[var(--surface-muted)] p-1">{["junior", "mid", "senior"].map((level) => <button type="button" key={level} onClick={() => field("targetLevel", level)} className={cn("h-9 rounded-[8px] text-xs font-semibold capitalize transition", state.targetLevel === level ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}>{level}</button>)}</div></fieldset>{targetRole && <div className="mt-4 rounded-[12px] border bg-[var(--surface-elevated)] p-3"><p className="text-xs font-semibold">{targetRole.title}</p><p className="mt-1.5 text-[10px] leading-4 text-[var(--muted)]">{targetRole.description}</p></div>}</div></section>
        <section className="rounded-[17px] border border-[color-mix(in_srgb,var(--primary)_20%,var(--border))] bg-[var(--primary-soft)] p-5"><Sparkles size={17} className="text-[var(--primary)]" /><p className="mt-3 text-sm font-semibold">AI inference stays editable</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Correct inferred levels in Skill Profile. Your verified input is preserved and used in later analyses.</p><Link href="/skills" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">Review inferred skills <ArrowRight size={13} /></Link></section>
        <Button className="w-full" size="lg" disabled={saving}><Save size={16} />{saving ? "Saving…" : "Save profile"}</Button>
        {message && <p role="status" className={cn("flex items-start gap-2 rounded-[11px] border p-3 text-xs leading-5", saved ? "border-[color-mix(in_srgb,var(--positive)_28%,var(--border))] bg-[var(--positive-soft)] text-[var(--positive)]" : "border-[color-mix(in_srgb,var(--critical)_28%,var(--border))] bg-[var(--critical-soft)] text-[var(--critical)]")}><span className="mt-0.5 shrink-0">{saved ? <ShieldCheck size={14} /> : <Target size={14} />}</span>{message}</p>}
      </aside>
    </div>
  </form>;
}
