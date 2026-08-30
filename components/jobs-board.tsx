"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, ExternalLink, LoaderCircle, MapPin, Radar, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatRelative } from "@/lib/utils";

type Job = { id: string; title: string; company: string | null; location: string | null; remote: boolean; url: string | null; sourceName: string; descriptionPreview: string | null; matchedSkills: string[]; totalSkills: number; capturedAt: string; postedAt: string | null };
const scopes = [{ key: "all", label: "All my skills" }, { key: "have", label: "Proven skills" }, { key: "target", label: "Target role" }] as const;

export function JobsBoard({ initial }: { initial: { jobs: Job[]; total: number; matchedAgainst: number } }) {
  const [scope, setScope] = useState<"all" | "have" | "target">("all");
  const [remote, setRemote] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const load = useCallback(async () => { setLoading(true); try { const response = await fetch(`/api/v1/jobs?scope=${scope}${remote ? "&remote=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`); const json = await response.json(); if (response.ok) setData(json.data); } finally { setLoading(false); } }, [scope, remote, q]);
  useEffect(() => { if (first.current) { first.current = false; return; } const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  return <div>
    <section className="relative overflow-hidden rounded-[22px] border border-[#2b3d72] bg-[#101b41] p-5 text-white shadow-[0_24px_70px_rgba(25,36,84,.22)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(109,93,252,.5),transparent_36%),radial-gradient(circle_at_8%_100%,rgba(16,185,129,.2),transparent_32%),linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:auto,auto,38px_38px,38px_38px]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-indigo-200"><Radar size={14} />Live opportunity radar</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Jobs aligned with your evidence</h1><p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80">Real public job postings ranked by the skills your profile currently demonstrates. Job fit is a search signal, not a promise of selection.</p></div><div className="grid grid-cols-2 gap-3 sm:min-w-64"><div className="rounded-[13px] border border-white/10 bg-white/[.055] p-3.5"><strong className="block text-2xl">{data.total}</strong><span className="text-[10px] text-indigo-200">Matching openings</span></div><div className="rounded-[13px] border border-white/10 bg-white/[.055] p-3.5"><strong className="block text-2xl">{data.matchedAgainst}</strong><span className="text-[10px] text-indigo-200">Profile skills used</span></div></div></div>
    </section>

    <section className="sticky top-[68px] z-20 mt-5 rounded-[16px] border bg-[var(--surface-glass)] p-3 shadow-[var(--shadow-xs)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="no-scrollbar flex gap-1 overflow-x-auto rounded-[10px] bg-[var(--surface-muted)] p-1 text-xs font-medium">{scopes.map((item) => <button key={item.key} onClick={() => setScope(item.key)} className={cn("shrink-0 rounded-[8px] px-3 py-2 transition", scope === item.key ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm" : "text-[var(--muted)]")}>{item.label}</button>)}</div><label className="flex h-10 shrink-0 items-center gap-2 rounded-[10px] border bg-[var(--surface)] px-3 text-xs font-medium"><input type="checkbox" className="size-3.5 accent-[var(--primary)]" checked={remote} onChange={(event) => setRemote(event.target.checked)} />Remote only</label><div className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />{loading && <LoaderCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--muted)]" />}<Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search title, company, or location" className="h-10 pl-9 pr-9 text-xs" /></div></div>
    </section>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.jobs.map((job) => { const coverage = job.totalSkills ? Math.round((job.matchedSkills.length / job.totalSkills) * 100) : 0; return <article key={job.id} className="aperio-panel group flex min-h-64 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[var(--primary-soft)] text-[var(--primary)]"><Building2 size={19} /></span><span className="rounded-[8px] bg-[var(--positive-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--positive)]">{job.matchedSkills.length}/{job.totalSkills} skill match</span></div>
      <h2 className="mt-4 text-lg font-semibold tracking-[-.025em]">{job.title}</h2><p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">{job.company && <span className="inline-flex items-center gap-1"><Building2 size={12} />{job.company}</span>}{(job.location || job.remote) && <span className="inline-flex items-center gap-1"><MapPin size={12} />{job.remote ? "Remote" : job.location}</span>}<span>{formatRelative(job.postedAt || job.capturedAt)} · {job.sourceName}</span></p>
      {job.descriptionPreview && <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{job.descriptionPreview}…</p>}
      <div className="mt-4"><div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-[var(--positive)]">Evidence overlap</span><span className="text-[var(--muted)]">{coverage}% of listed skills</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--positive)]" style={{ width: `${coverage}%` }} /></div>{job.matchedSkills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{job.matchedSkills.slice(0, 6).map((skill) => <span key={skill} className="rounded-[6px] bg-[var(--positive-soft)] px-2 py-1 text-[9px] font-semibold text-[var(--positive)]">{skill}</span>)}</div>}</div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5"><p className="flex items-start gap-1.5 text-[9px] leading-4 text-[var(--muted)]"><ShieldCheck size={11} className="mt-0.5 shrink-0" />Verify role details on the source</p>{job.url ? <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110">View job <ExternalLink size={12} /></a> : <span className="text-[10px] text-[var(--muted)]">Source link unavailable</span>}</div>
    </article>; })}</div>

    {!data.jobs.length && <section className="aperio-panel mt-5 px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]"><Briefcase size={21} /></span><h2 className="mt-5 text-lg font-semibold">No matching openings right now</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{data.matchedAgainst === 0 ? "Run an analysis or complete your skill profile so Aperio has evidence to match." : "Try a broader filter or check again after the next public-job ingestion run."}</p>{data.matchedAgainst === 0 && <Link href="/analyze" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">Analyze your profile <ArrowRight size={14} /></Link>}</section>}

    <p className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-[var(--muted)]"><Sparkles size={13} className="mt-0.5 shrink-0 text-[var(--primary)]" />Aperio ranks public listings by profile-skill overlap. Always review responsibilities, eligibility, company details, and application terms on the original source.</p>
  </div>;
}
