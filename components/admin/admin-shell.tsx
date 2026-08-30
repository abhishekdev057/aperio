"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowLeft, ChevronRight, GraduationCap, LayoutDashboard, LineChart, MessagesSquare, Plug, ShieldCheck, Users } from "lucide-react";
import { AperioBrand } from "@/components/aperio-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/chat", label: "Chat", icon: MessagesSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/lms", label: "Learning studio", icon: GraduationCap },
  { href: "/admin/market", label: "Job market", icon: LineChart },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
];

export function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();
  const current = nav.find(({ href, exact }) => exact ? pathname === href : pathname.startsWith(href));
  return <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-slate-800 bg-[#07121f] px-4 py-5 text-slate-100 lg:flex">
      <div className="px-2"><AperioBrand href="/admin" inverse /><div className="mt-4 flex items-center gap-2 rounded-[9px] border border-indigo-400/15 bg-indigo-400/10 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-indigo-200"><ShieldCheck size={13} />Control room</div></div>
      <nav className="mt-7 space-y-1" aria-label="Admin navigation">{nav.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[12px] font-medium transition", active ? "bg-indigo-500/16 text-white" : "text-slate-400 hover:bg-white/[.055] hover:text-slate-100")} >{active && <span className="absolute -left-4 h-5 w-[3px] rounded-r-full bg-indigo-400" />}<Icon size={16} strokeWidth={active ? 2.2 : 1.8} /><span>{label}</span>{active && <ChevronRight size={12} className="ml-auto text-indigo-300" />}</Link>; })}</nav>
      <div className="mt-auto space-y-3 border-t border-slate-800 pt-4"><div className="flex items-center gap-2.5 rounded-[11px] border border-white/5 bg-white/[.035] p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-indigo-500 text-[11px] font-bold text-white">{adminName.charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block text-[10px] font-semibold text-slate-200">Administrator</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{adminName}</span></span></div><ThemeToggle showLabel className="border-slate-700 bg-white/[.035] text-slate-300 hover:bg-white/[.06]" /><Link href="/overview" className="flex items-center gap-2 rounded-[9px] px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:bg-white/[.055] hover:text-slate-100"><ArrowLeft size={14} />Back to user app</Link></div>
    </aside>

    <section className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-30 border-b bg-[var(--surface-glass)] backdrop-blur-xl"><div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><div className="lg:hidden"><AperioBrand href="/admin" /></div><div className="hidden h-5 w-px bg-[var(--border)] sm:block lg:hidden" /><div className="hidden sm:block"><p className="text-sm font-semibold">{current?.label ?? "Admin console"}</p><p className="mt-0.5 text-[9px] text-[var(--muted)]">APERIO operations</p></div></div><div className="flex items-center gap-2"><ThemeToggle className="lg:hidden" /><span className="grid size-8 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary)]">{adminName.charAt(0).toUpperCase()}</span></div></div><nav className="no-scrollbar flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden" aria-label="Mobile admin navigation">{nav.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[10px] font-semibold", active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted)]")}><Icon size={13} />{label}</Link>; })}</nav></header>
      <main className="mx-auto min-w-0 max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </section>
  </div>;
}
