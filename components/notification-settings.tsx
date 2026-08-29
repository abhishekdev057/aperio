"use client";

import { useState } from "react";
import { Bell, Check, Copy, LoaderCircle, MessageCircle, Send, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntegrationsState } from "@/lib/integrations";

type Prefs = IntegrationsState["preferences"];

const prefLabels: Record<keyof Prefs, { title: string; hint: string }> = {
  notifyRoadmap: { title: "Roadmap reminders", hint: "A nudge with your next open roadmap step." },
  notifyWeeklyDigest: { title: "Weekly digest", hint: "Once a week: match score and what to finish next." },
  notifyAnalysis: { title: "Analysis updates", hint: "When a new analysis is ready or your score changes." },
  notifyInactivity: { title: "Inactivity nudge", hint: "A reminder if a week passes with no progress." },
};

export function NotificationSettings({ initial }: { initial: IntegrationsState }) {
  const [data, setData] = useState<IntegrationsState>(initial);
  const [busy, setBusy] = useState("");
  const [link, setLink] = useState<{ code: string; deepLink: string | null; instructions: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const telegram = data.channels.find((c) => c.platform === "telegram");
  const telegramLinked = telegram?.status === "linked" && telegram.hasAddress;

  async function refresh() {
    try {
      const res = await fetch("/api/v1/integrations");
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch {
      /* keep current state */
    }
  }

  async function startTelegram() {
    setBusy("telegram-link");
    setError("");
    try {
      const res = await fetch("/api/v1/integrations/telegram/link", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Could not start linking.");
      setLink({ code: json.data.code, deepLink: json.data.deepLink, instructions: json.data.instructions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start linking.");
    } finally {
      setBusy("");
    }
  }

  async function unlinkTelegram() {
    setBusy("telegram-unlink");
    try {
      await fetch("/api/v1/integrations/telegram", { method: "DELETE" });
      setLink(null);
      await refresh();
    } finally {
      setBusy("");
    }
  }

  async function togglePref(key: keyof Prefs, value: boolean) {
    setData({ ...data, preferences: { ...data.preferences, [key]: value } });
    await fetch("/api/v1/notifications/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => refresh());
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[16px] border bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary)]"><Send size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Telegram</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Link your Telegram to get automated messages. Aperio only sends what you enable below.</p>

            {telegramLinked ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--positive-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--positive)]"><Check size={12} />Linked{telegram?.handle ? ` · ${telegram.handle}` : ""}</span>
                <button onClick={unlinkTelegram} disabled={busy === "telegram-unlink"} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--critical)]">
                  {busy === "telegram-unlink" ? <LoaderCircle size={13} className="animate-spin" /> : <Unlink size={13} />}Unlink
                </button>
              </div>
            ) : !data.providers.telegram.configured ? (
              <p className="mt-3 rounded-[10px] bg-[var(--attention-soft)] px-3 py-2 text-xs text-[var(--muted-strong)]">Telegram is not configured on the server yet (TELEGRAM_BOT_TOKEN).</p>
            ) : link ? (
              <div className="mt-3 rounded-[12px] border bg-[var(--surface-elevated)] p-4">
                <p className="text-xs text-[var(--muted)]">Your one-time link code</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded-md bg-[var(--surface)] px-2 py-1 text-base font-bold tracking-[.2em]">{link.code}</code>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(link.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{link.instructions}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {link.deepLink && <Button asChild size="sm"><a href={link.deepLink} target="_blank" rel="noreferrer"><Send size={14} />Open Telegram</a></Button>}
                  <Button size="sm" variant="secondary" onClick={refresh}>Sent it &mdash; refresh</Button>
                </div>
              </div>
            ) : (
              <Button className="mt-3" size="sm" onClick={startTelegram} disabled={busy === "telegram-link"}>
                {busy === "telegram-link" ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}Link Telegram
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border bg-[var(--surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-[11px] bg-[var(--surface-muted)] text-[var(--muted)]"><MessageCircle size={18} /></span>
          <div>
            <h2 className="text-sm font-semibold">WhatsApp</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Coming next. The notification engine already routes by channel &mdash; WhatsApp needs a provider (Meta Cloud API or Twilio) wired in.</p>
            <span className="mt-2 inline-flex rounded-md bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Not available yet</span>
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border bg-[var(--surface)] p-5">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-[var(--primary)]" />
          <h2 className="text-sm font-semibold">What to send</h2>
        </div>
        <div className="mt-3 divide-y">
          {(Object.keys(prefLabels) as Array<keyof Prefs>).map((key) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-medium">{prefLabels[key].title}</span>
                <span className="block text-xs text-[var(--muted)]">{prefLabels[key].hint}</span>
              </span>
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={Boolean(data.preferences[key])}
                onChange={(e) => togglePref(key, e.target.checked)}
              />
            </label>
          ))}
        </div>
        {!telegramLinked && <p className="mt-3 text-xs text-[var(--muted)]">Link a channel above to start receiving these.</p>}
      </section>

      {error && <p role="alert" className="text-sm text-[var(--critical)]">{error}</p>}
    </div>
  );
}
