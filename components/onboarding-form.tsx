"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, ChevronRight, Compass, FileText, Layers3, LoaderCircle, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RoleSummary } from "@/lib/types";

const statuses = [
  { value: "student", label: "Student", description: "I’m building my foundation and exploring paths." },
  { value: "fresher", label: "Fresher", description: "I’m preparing for my first professional role." },
  { value: "professional", label: "Working professional", description: "I’m growing in my current field or aiming higher." },
  { value: "career_switcher", label: "Career switcher", description: "I’m moving into a different role or industry." },
];

const levels = [
  { value: "junior", title: "Junior", description: "Build reliable foundations and contribute with guidance." },
  { value: "mid", title: "Mid", description: "Own features end-to-end and make sound trade-offs." },
  { value: "senior", title: "Senior", description: "Lead systems, decisions, and broader team outcomes." },
];

const steps = [
  { label: "Your context", icon: UserRound },
  { label: "Target role", icon: Compass },
  { label: "Target level", icon: Layers3 },
  { label: "Starting point", icon: FileText },
];

export function OnboardingForm({ roles }: { roles: RoleSummary[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("professional");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [level, setLevel] = useState("mid");
  const [method, setMethod] = useState<"resume" | "manual">("resume");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredRoles = useMemo(() => roles.filter((role) => `${role.title} ${role.category}`.toLowerCase().includes(query.toLowerCase())), [query, roles]);
  const selectedRole = roles.find((role) => role.id === roleId);

  async function finish() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/v1/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentStatus: status, targetRoleId: roleId, targetLevel: level, onboardingCompleted: true }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not save your profile.");
      router.push(method === "resume" ? `/analyze?role=${roleId}` : "/profile");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile."); setSaving(false);
    }
  }

  function next() { if (step < steps.length - 1) setStep((current) => current + 1); else void finish(); }

  return <div className="overflow-hidden rounded-[22px] border bg-[var(--surface)] shadow-[var(--shadow)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="relative overflow-hidden border-b bg-[#111b42] p-5 text-white sm:p-7 lg:min-h-[620px] lg:border-b-0 lg:border-r">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(109,93,252,.42),transparent_32%),linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:auto,auto_34px]" />
      <div className="relative"><span className="grid size-11 place-items-center rounded-[13px] border border-white/10 bg-white/10 text-indigo-200"><Sparkles size={19} /></span><p className="mt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-200">A focused start</p><h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">Set your direction in four short steps.</h2><p className="mt-3 text-xs leading-5 text-indigo-200">Every choice stays editable. Aperio uses it as context—not a permanent label.</p></div>
      <div className="relative mt-7 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2">{steps.map((item, index) => { const Icon = item.icon; const complete = index < step; const active = index === step; return <button key={item.label} onClick={() => index <= step && setStep(index)} disabled={index > step} className={cn("flex min-w-36 items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition lg:w-full", active ? "border-indigo-300/30 bg-white/10" : "border-transparent", index <= step ? "text-white" : "text-slate-500")}><span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px] border", complete ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-300" : active ? "border-indigo-300/30 bg-indigo-300/15 text-indigo-200" : "border-white/10")} >{complete ? <Check size={15} /> : <Icon size={15} />}</span><span><span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-indigo-200">0{index + 1}</span><span className="mt-0.5 block text-xs font-semibold">{item.label}</span></span></button>; })}</div>
      <p className="relative mt-7 hidden items-start gap-2 text-[10px] leading-5 text-indigo-200 lg:flex"><ShieldCheck size={14} className="mt-0.5 shrink-0" />Guidance is grounded in the resume and profile evidence you choose to provide.</p>
    </aside>

    <section className="flex min-h-[520px] flex-col p-5 sm:p-8 lg:p-10">
      <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Step {step + 1} of {steps.length}</p><div className="flex gap-1.5">{steps.map((item, index) => <span key={item.label} className={cn("h-1.5 w-6 rounded-full transition", index <= step ? "bg-[var(--primary)]" : "bg-[var(--surface-muted)]")} />)}</div></div>

      <div className="my-auto py-8">
        {step === 0 && <div><span className="grid size-11 place-items-center rounded-[13px] bg-[var(--primary-soft)] text-[var(--primary)]"><UserRound size={20} /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">Where are you today?</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">This helps Aperio frame recommendations at the right starting point.</p><div className="mt-6 grid gap-2 sm:grid-cols-2">{statuses.map((item) => { const active = status === item.value; return <button key={item.value} onClick={() => setStatus(item.value)} className={cn("flex min-h-24 items-start gap-3 rounded-[14px] border p-4 text-left transition hover:-translate-y-0.5", active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[0_12px_28px_color-mix(in_srgb,var(--primary)_10%,transparent)]" : "bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]")}><span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border", active && "border-[var(--primary)] bg-[var(--primary)] text-white")}>{active && <Check size={13} />}</span><span><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1.5 block text-xs leading-5 text-[var(--muted)]">{item.description}</span></span></button>; })}</div></div>}

        {step === 1 && <div><span className="grid size-11 place-items-center rounded-[13px] bg-[var(--positive-soft)] text-[var(--positive)]"><Compass size={20} /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">Which role are you aiming for?</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">Choose one direction now. You can explore and compare more roles later.</p><label className="relative mt-6 block"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search career roles" className="pl-10" /></label><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{filteredRoles.map((role) => { const active = roleId === role.id; return <button key={role.id} onClick={() => setRoleId(role.id)} className={cn("group rounded-[13px] border p-3.5 text-left transition", active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]")}><span className="flex items-center justify-between"><span className="text-sm font-semibold">{role.title}</span>{active ? <Check size={15} className="text-[var(--primary)]" /> : <ChevronRight size={14} className="text-[var(--muted)] transition group-hover:translate-x-0.5" />}</span><span className="mt-1.5 block text-[10px] font-medium text-[var(--muted)]">{role.category}</span></button>; })}</div>{!filteredRoles.length && <p className="mt-5 text-sm text-[var(--muted)]">No role matches that search.</p>}</div>}

        {step === 2 && <div><span className="grid size-11 place-items-center rounded-[13px] bg-[var(--attention-soft)] text-[var(--attention)]"><Layers3 size={20} /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">What level are you targeting?</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">Requirements change by seniority. Pick the level that reflects the role you want next.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{levels.map((item) => { const active = level === item.value; return <button key={item.value} onClick={() => setLevel(item.value)} className={cn("relative min-h-40 overflow-hidden rounded-[15px] border p-4 text-left transition hover:-translate-y-0.5", active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_12%,transparent)]" : "bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]")}><span className={cn("grid size-7 place-items-center rounded-full border", active && "border-[var(--primary)] bg-[var(--primary)] text-white")}>{active && <Check size={14} />}</span><span className="mt-6 block text-lg font-semibold">{item.title}</span><span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{item.description}</span></button>; })}</div></div>}

        {step === 3 && <div><span className="grid size-11 place-items-center rounded-[13px] bg-[var(--primary-soft)] text-[var(--primary)]"><FileText size={20} /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">How would you like to begin?</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">Your target is <strong className="text-[var(--foreground)]">{selectedRole?.title}</strong> at a <strong className="capitalize text-[var(--foreground)]">{level}</strong> level. Add evidence now or build your profile first.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setMethod("resume")} className={cn("min-h-44 rounded-[16px] border p-5 text-left transition hover:-translate-y-0.5", method === "resume" ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "bg-[var(--surface-elevated)]")}><span className="grid size-10 place-items-center rounded-[12px] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-xs)]"><FileText size={18} /></span><span className="mt-5 block text-base font-semibold">Upload a resume</span><span className="mt-2 block text-xs leading-5 text-[var(--muted)]">Use PDF, DOCX, or an image-based resume. Aperio verifies the document before analysis.</span></button><button onClick={() => setMethod("manual")} className={cn("min-h-44 rounded-[16px] border p-5 text-left transition hover:-translate-y-0.5", method === "manual" ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "bg-[var(--surface-elevated)]")}><span className="grid size-10 place-items-center rounded-[12px] bg-[var(--surface)] text-[var(--positive)] shadow-[var(--shadow-xs)]"><BriefcaseBusiness size={18} /></span><span className="mt-5 block text-base font-semibold">Build profile manually</span><span className="mt-2 block text-xs leading-5 text-[var(--muted)]">Add your professional context first, then run an evidence-based analysis when ready.</span></button></div></div>}
      </div>

      {error && <p role="alert" className="mb-4 rounded-[11px] bg-[var(--critical-soft)] p-3 text-sm text-[var(--critical)]">{error}</p>}
      <div className="flex items-center justify-between border-t pt-5"><Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving}><ArrowLeft size={15} />Back</Button><Button onClick={next} disabled={saving || (step === 1 && !roleId)}>{saving ? <LoaderCircle size={15} className="animate-spin" /> : step === steps.length - 1 ? <Check size={15} /> : null}{saving ? "Saving your direction…" : step === steps.length - 1 ? "Finish setup" : "Continue"}{!saving && step < steps.length - 1 && <ArrowRight size={15} />}</Button></div>
    </section>
  </div>;
}
