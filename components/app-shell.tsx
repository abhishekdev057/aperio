"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChartNoAxesCombined, Compass, FileSearch, History, LogOut, Map, Search, Settings, Sparkles, Target, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/overview", label: "Overview", icon: ChartNoAxesCombined },
  { href: "/analyze", label: "Analyze", icon: FileSearch },
  { href: "/skills", label: "Skill Profile", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/roles", label: "Roles", icon: Compass },
  { href: "/history", label: "History", icon: History },
];
const mobile = nav.slice(0, 4).concat({ href: "/profile", label: "Profile", icon: UserRound });

export function AppShell({ children, user }: { children: React.ReactNode; user: { fullName: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = nav.find((item) => pathname.startsWith(item.href));
  async function logout() { await fetch("/api/v1/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  return <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
    <aside className="hidden border-r bg-[var(--surface)] px-4 py-5 lg:flex lg:flex-col">
      <Link href="/overview" className="flex items-center gap-3 px-2">
        <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--primary)] text-white"><Sparkles size={17} /></span>
        <span><span className="block text-[15px] font-bold tracking-[.12em]">APERIO</span><span className="block text-[11px] text-[var(--muted)]">Career Intelligence</span></span>
      </Link>
      <nav className="mt-10 space-y-1" aria-label="Primary navigation">{nav.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition", active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]")}><Icon size={17} />{label}</Link>;
      })}</nav>
      <div className="mt-auto space-y-1 border-t pt-4">
        <Link href="/profile" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]"><UserRound size={17} />Profile</Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]"><Settings size={17} />Settings</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]"><LogOut size={17} />Sign out</button>
      </div>
    </aside>
    <section className="min-w-0 pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] px-5 backdrop-blur-xl lg:px-8">
        <div><p className="m-0 text-[11px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">{current?.label ?? "Aperio"}</p><p className="m-0 text-sm font-semibold">{pathname === "/overview" ? "Career readiness" : "Your career workspace"}</p></div>
        <div className="flex items-center gap-2">
          <button className="hidden h-9 items-center gap-2 rounded-[9px] border bg-[var(--surface)] px-3 text-xs text-[var(--muted)] sm:flex" aria-label="Search Aperio"><Search size={14} />Search <kbd className="ml-2 text-[10px]">⌘K</kbd></button>
          <button className="grid size-9 place-items-center rounded-[9px] border bg-[var(--surface)] text-[var(--muted-strong)]" aria-label="Notifications"><Bell size={16} /></button>
          <ThemeToggle />
          <Link href="/profile" className="ml-1 grid size-9 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]" aria-label={`Profile for ${user.fullName}`}>{user.fullName.charAt(0).toUpperCase()}</Link>
        </div>
      </header>
      {children}
    </section>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
      {mobile.map(({ href, label, icon: Icon }) => { const active = pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium", active ? "text-[var(--primary)]" : "text-[var(--muted)]")}><Icon size={18} /><span>{label === "Skill Profile" ? "Skills" : label}</span></Link>; })}
    </nav>
  </div>;
}
