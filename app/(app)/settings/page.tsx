import { BellRing, Eye, LockKeyhole, MessageCircleMore, Palette, Settings2, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationSettings } from "@/components/notification-settings";
import { requirePageUser } from "@/lib/auth";
import { getIntegrationsState } from "@/lib/integrations";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const integrations = await getIntegrationsState(user.id);
  return <div className="aperio-page mx-auto max-w-[1120px]">
    <div className="max-w-2xl"><p className="aperio-eyebrow text-[var(--primary)]"><Settings2 size={14} />Workspace preferences</p><h1 className="aperio-page-title mt-3">Settings</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Control your appearance, delivery channels, and how Aperio handles your private career data.</p></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <section className="aperio-panel p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary)]"><Palette size={18} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Appearance</p><h2 className="mt-1 text-base font-semibold">Light and dark mode</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Both themes preserve the same semantic match, gap, and priority signals.</p></div></div><ThemeToggle showLabel /></div></section>
        <div className="mb-4 mt-7 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-[10px] bg-[var(--positive-soft)] text-[var(--positive)]"><MessageCircleMore size={16} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Connected messaging</p><h2 className="mt-0.5 text-base font-semibold">Notification delivery</h2></div></div>
        <NotificationSettings initial={integrations} />
      </div>
      <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
        <section className="aperio-panel overflow-hidden"><div className="border-b bg-[linear-gradient(120deg,var(--primary-faint),var(--surface))] p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[11px] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-xs)]"><LockKeyhole size={18} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">Data controls</p><h2 className="mt-1 text-base font-semibold">Privacy and analysis</h2></div></div></div><div className="space-y-4 p-5"><div className="flex items-start gap-3"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[var(--positive)]" /><div><p className="text-xs font-semibold">Private resume processing</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Uploads are not exposed through a public resume URL.</p></div></div><div className="flex items-start gap-3"><Eye size={15} className="mt-0.5 shrink-0 text-[var(--primary)]" /><div><p className="text-xs font-semibold">Evidence you can inspect</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Analysis records retain the evidence behind each inference.</p></div></div><div className="flex items-start gap-3"><BellRing size={15} className="mt-0.5 shrink-0 text-[var(--attention)]" /><div><p className="text-xs font-semibold">Only enabled messages</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Messaging addresses are used only for the updates you turn on.</p></div></div></div></section>
        <section className="rounded-[17px] border bg-[var(--surface-elevated)] p-5"><p className="text-xs font-semibold">Career guidance, not certainty</p><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">Aperio interprets the evidence available in your profile. You stay in control of corrections and career decisions.</p></section>
      </aside>
    </div>
  </div>;
}
