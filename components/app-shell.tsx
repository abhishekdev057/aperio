"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  FileSearch,
  GraduationCap,
  History,
  LibraryBig,
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

const coreNav = [
  { href: "/overview", label: "Overview", icon: ChartNoAxesCombined },
  { href: "/analyze", label: "Analyze", icon: FileSearch },
  { href: "/skills", label: "Skill Profile", mobileLabel: "Skills", icon: Target },
  { href: "/roadmap", label: "Roadmap", icon: Map },
] as const;

const growthNav = [
  { href: "/learning", label: "Course Plan", mobileLabel: "Plan", icon: GraduationCap },
  { href: "/courses", label: "Learn", icon: LibraryBig },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/roles", label: "Roles", icon: Compass },
  { href: "/history", label: "History", icon: History },
] as const;

const nav = [...coreNav, ...growthNav] as const;

const account = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const mobile = [coreNav[0], coreNav[1], coreNav[2], coreNav[3], account[0]];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Target; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("group relative flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200", active ? "bg-[var(--primary-soft)] text-[var(--primary-strong)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_5%,transparent)]" : "text-[var(--muted-strong)] hover:translate-x-0.5 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]")}>
      {active && <span className="absolute -left-4 h-5 w-[3px] rounded-r-full bg-[var(--primary)]" />}
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
      <span>{label}</span>
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
    <div className="min-h-screen lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r bg-[var(--sidebar)] px-4 pb-4 pt-5 lg:flex">
        <div className="px-2"><AperioBrand href="/overview" /></div>
        <div className="no-scrollbar mt-8 min-h-0 flex-1 overflow-y-auto pr-0.5">
          <nav className="space-y-1" aria-label="Primary navigation">{coreNav.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />)}</nav>
          <p className="mb-2 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--muted)]">Grow</p>
          <nav className="space-y-1" aria-label="Growth navigation">{growthNav.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />)}</nav>
          <div className="mx-2 my-5 border-t" />
          <p className="px-3 text-[9px] font-semibold uppercase tracking-[.16em] text-[var(--muted)]">Account</p>
          <nav className="mt-2 space-y-1" aria-label="Account navigation">{accountItems.map(({ href, label, icon }) => <NavLink key={href} href={href} label={label} icon={icon} active={pathname.startsWith(href)} />)}</nav>
        </div>

        <div className="mt-auto space-y-3 border-t pt-4">
          <ThemeToggle showLabel />
          <Link href="/profile" className="flex items-center gap-2.5 rounded-[11px] p-2 transition hover:bg-[var(--surface-muted)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[#2f6fea] text-[11px] font-bold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{user.fullName}</span><span className="mt-0.5 block truncate text-[9px] text-[var(--muted)]">{user.email}</span></span>
            <ChevronRight size={13} className="text-[var(--muted)]" />
          </Link>
          <button onClick={logout} className="flex h-9 w-full items-center gap-2.5 rounded-[9px] px-3 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--critical-soft)] hover:text-[var(--critical)]"><LogOut size={15} />Sign out</button>
        </div>
      </aside>

      <section className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b bg-[var(--surface-glass)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden"><AperioBrand href="/overview" /></div>
            <div className="hidden h-5 w-px bg-[var(--border)] sm:block lg:hidden" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[15px] font-semibold">{current?.label ?? "Career workspace"}</p>
              <p className="mt-0.5 hidden text-[10px] text-[var(--muted)] lg:block">Evidence-backed career intelligence</p>
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
