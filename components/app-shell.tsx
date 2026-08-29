"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  FileSearch,
  GraduationCap,
  History,
  LogOut,
  Map,
  Settings,
  Shield,
  Target,
  UserRound,
} from "lucide-react";
import { AperioBrand } from "@/components/aperio-brand";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/overview", label: "Overview", icon: ChartNoAxesCombined },
  { href: "/analyze", label: "Analyze", icon: FileSearch },
  { href: "/skills", label: "Skill Profile", mobileLabel: "Skills", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/learning", label: "Course Plan", mobileLabel: "Course", icon: GraduationCap },
  { href: "/roles", label: "Roles", icon: Compass },
  { href: "/history", label: "History", icon: History },
] as const;

const account = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const mobile = [nav[0], nav[1], nav[2], nav[3], account[0]];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Target; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors", active ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]")}>
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-[var(--primary)]" />}
    </Link>
  );
}

export function AppShell({ children, user }: { children: React.ReactNode; user: { fullName: string; email: string; role?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const accountItems = user.role === "admin" ? [...account, { href: "/admin", label: "Admin", icon: Shield }] : account;
  const allItems = [...nav, ...accountItems];
  const current = allItems.find((item) => pathname.startsWith(item.href));

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] flex-col border-r bg-[color-mix(in_srgb,var(--surface)_94%,var(--background))] px-4 pb-4 pt-5 lg:flex">
        <div className="px-2"><AperioBrand href="/overview" /></div>
        <nav className="mt-8 space-y-1" aria-label="Primary navigation">
          {nav.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />)}
        </nav>
        <div className="mx-2 my-5 border-t" />
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Account</p>
        <nav className="mt-2 space-y-1" aria-label="Account navigation">
          {accountItems.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />)}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-[13px] border bg-[var(--primary-faint)] p-3.5">
            <p className="text-xs font-semibold">Evidence-first guidance</p>
            <p className="mt-1.5 text-[11px] leading-5 text-[var(--muted)]">Aperio explains every inference and keeps your corrections in control.</p>
            <Link href="/skills" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]">Review your skills <ChevronRight size={12} /></Link>
          </div>
          <ThemeToggle showLabel />
          <button onClick={logout} className="flex h-9 w-full items-center gap-2.5 rounded-[9px] px-3 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--critical-soft)] hover:text-[var(--critical)]"><LogOut size={15} />Sign out</button>
        </div>
      </aside>

      <section className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-[65px] items-center justify-between border-b bg-[var(--surface-glass)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden"><AperioBrand href="/overview" /></div>
            <div className="hidden h-5 w-px bg-[var(--border)] sm:block lg:hidden" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[15px] font-semibold">{current?.label ?? "Career workspace"}</p>
              <p className="mt-0.5 hidden text-[10px] text-[var(--muted)] lg:block">Career readiness intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="lg:hidden" />
            <Link href="/profile" className="flex h-10 items-center gap-2.5 rounded-[10px] px-1.5 transition hover:bg-[var(--surface-muted)] sm:px-2" aria-label={`Open profile for ${user.fullName}`}>
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[#2f6fea] text-[11px] font-bold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
              <span className="hidden max-w-36 truncate text-xs font-semibold sm:block">{user.fullName}</span>
              <ChevronRight size={13} className="hidden text-[var(--muted)] sm:block" />
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-[var(--surface-glass)] px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        {mobile.map(({ href, label, icon: Icon, ...item }) => {
          const active = pathname.startsWith(href);
          const mobileLabel = "mobileLabel" in item ? item.mobileLabel : label;
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative flex min-w-0 flex-col items-center gap-1 rounded-[9px] py-1.5 text-[10px] font-medium transition", active ? "text-[var(--primary)]" : "text-[var(--muted)]")}><span className={cn("grid size-7 place-items-center rounded-[8px]", active && "bg-[var(--primary-soft)]")}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /></span><span className="truncate">{mobileLabel}</span></Link>;
        })}
      </nav>
    </div>
  );
}
