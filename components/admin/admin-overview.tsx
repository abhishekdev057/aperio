"use client";

import Link from "next/link";
import { Activity, ArrowRight, BrainCircuit, FileText, GraduationCap, MessageSquareMore, Radar, Sparkles, UserRound, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRelative } from "@/lib/utils";
import { ActionLabel } from "@/components/admin/action-label";

type Overview = { totals: Record<string, number>; daily: Array<{ label: string; signups: number; analyses: number; events: number }>; topActions: Array<{ action: string; count: number }>; recentUsers: Array<Record<string, unknown>>; recentActivity: Array<Record<string, unknown>> };

const primary = [
  { key: "users", label: "Total users", icon: Users, accent: "#a5b4fc" },
  { key: "active7d", label: "Active this week", icon: Radar, accent: "#6ee7b7" },
  { key: "analyses7d", label: "Analyses this week", icon: BrainCircuit, accent: "#c4b5fd" },
  { key: "events24h", label: "Events today", icon: Activity, accent: "#fcd34d" },
];
const secondary = [
  { key: "newUsers7d", label: "New users", icon: UserRound },
  { key: "analyses", label: "All analyses", icon: Sparkles },
  { key: "resumes", label: "Resumes", icon: FileText },
  { key: "learningPaths", label: "Course plans", icon: GraduationCap },
  { key: "linkedChannels", label: "Linked channels", icon: MessageSquareMore },
  { key: "notificationsSent", label: "Messages sent", icon: Activity },
];

export function AdminOverview({ data }: { data: Overview }) {
  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="aperio-eyebrow text-[var(--primary)]"><Activity size={14} />Operations intelligence</p><h1 className="aperio-page-title mt-3">Control room overview</h1><p className="mt-2 text-sm text-[var(--muted)]">Live product health, user movement, and operational activity across Aperio.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-[9px] border bg-[var(--surface)] px-3 py-2 text-[10px] font-semibold text-[var(--muted)]"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--positive)] opacity-50" /><span className="relative size-2 rounded-full bg-[var(--positive)]" /></span>Live product data</span></div>

    <section className="relative overflow-hidden rounded-[20px] border border-[#2a3a68] bg-[#0a1625] p-5 text-white shadow-[0_22px_60px_rgba(2,8,23,.2)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(99,102,241,.34),transparent_36%),linear-gradient(rgba(148,163,184,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.035)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px]" />
      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{primary.map(({ key, label, icon: Icon, accent }) => <div key={key} className="rounded-[14px] border border-white/10 bg-white/[.045] p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-[10px]" style={{ color: accent, background: `${accent}16` }}><Icon size={17} /></span><span className="text-[9px] uppercase tracking-[.12em] text-slate-500">Live</span></div><strong className="mt-5 block text-3xl tracking-[-.045em]">{Number(data.totals?.[key] ?? 0).toLocaleString()}</strong><span className="mt-1 block text-[11px] text-slate-400">{label}</span></div>)}</div>
      <div className="relative mt-4 flex flex-wrap divide-x divide-white/10 rounded-[13px] border border-white/10 bg-white/[.025]">{secondary.map(({ key, label, icon: Icon }) => <div key={key} className="flex min-w-36 flex-1 items-center gap-2.5 px-3 py-3"><Icon size={14} className="text-indigo-300" /><span><strong className="block text-sm">{Number(data.totals?.[key] ?? 0).toLocaleString()}</strong><span className="block text-[9px] text-slate-500">{label}</span></span></div>)}</div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
      <section className="aperio-panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Product pulse</p><h2 className="mt-1 text-base font-semibold">Last 14 days</h2></div><span className="text-[10px] text-[var(--muted)]">Signups · analyses · events</span></div><div className="mt-5 h-[240px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily} margin={{ left: -18, right: 6, top: 6 }}><defs><linearGradient id="admin-signups" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} tickLine={false} axisLine={false} interval={1} /><YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} tickLine={false} axisLine={false} allowDecimals={false} width={34} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} /><Area type="monotone" dataKey="events" stroke="var(--muted)" fill="none" strokeWidth={1} /><Area type="monotone" dataKey="analyses" stroke="var(--positive)" fill="none" strokeWidth={1.8} /><Area type="monotone" dataKey="signups" stroke="var(--primary)" fill="url(#admin-signups)" strokeWidth={2.2} /></AreaChart></ResponsiveContainer></div></section>
      <section className="aperio-panel p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Behavior mix</p><h2 className="mt-1 text-base font-semibold">Top actions · 7 days</h2><div className="mt-5 h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.topActions} layout="vertical" margin={{ left: 38, right: 8 }}><XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="action" width={110} tick={{ fontSize: 9, fill: "var(--muted)" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} /><Bar dataKey="count" fill="var(--primary)" radius={[0, 5, 5, 0]} barSize={11} /></BarChart></ResponsiveContainer></div></section>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="aperio-panel overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Accounts</p><h2 className="mt-1 text-base font-semibold">Newest users</h2></div><Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">View all <ArrowRight size={13} /></Link></div><div>{data.recentUsers.map((user) => <Link key={String(user.id)} href={`/admin/users/${user.id}`} className="group flex items-center justify-between gap-3 border-b px-5 py-3.5 last:border-0 hover:bg-[var(--surface-elevated)]"><span className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary)]">{String(user.fullName).charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{String(user.fullName)}</span><span className="block truncate text-[10px] text-[var(--muted)]">{String(user.email)}</span></span></span><span className="shrink-0 text-[10px] text-[var(--muted)]">{formatRelative(String(user.createdAt))}</span></Link>)}</div></section>
      <section className="aperio-panel overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Audit stream</p><h2 className="mt-1 text-base font-semibold">Recent activity</h2></div><Link href="/admin/activity" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">View all <ArrowRight size={13} /></Link></div><div>{data.recentActivity.map((event) => <div key={String(event.id)} className="flex items-center justify-between gap-3 border-b px-5 py-3.5 last:border-0"><span className="min-w-0"><ActionLabel action={String(event.action)} /><span className="ml-2 text-[10px] text-[var(--muted)]">{event.actor ? String(event.actor) : "System"}</span></span><span className="shrink-0 text-[10px] text-[var(--muted)]">{formatRelative(String(event.createdAt))}</span></div>)}</div></section>
    </div>
  </div>;
}
