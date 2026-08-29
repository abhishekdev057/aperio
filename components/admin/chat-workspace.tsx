"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, LoaderCircle, MessageCircle, Paperclip, Search, Send, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  channel: "telegram_userbot" | "whatsapp";
  peerId: string;
  peerName: string | null;
  peerUsername: string | null;
  userName: string | null;
  userEmail: string | null;
  lastMessageAt: string | null;
  lastPreview: string | null;
  lastDirection: string | null;
  unreadCount: number;
};
type Message = {
  id: string;
  direction: "in" | "out";
  kind: string;
  text: string | null;
  mediaId: string | null;
  mediaMime: string | null;
  mediaName: string | null;
  mediaSize: number | null;
  senderName: string | null;
  status: string;
  createdAt: string;
  pending?: boolean;
};

const channelDot = { telegram_userbot: "#229ED9", whatsapp: "#25D366" };

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function MediaBubble({ message }: { message: Message }) {
  const src = `/api/v1/admin/chat/media/${message.id}`;
  if (message.kind === "image" || message.kind === "sticker") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={message.mediaName ?? "image"} className="mt-1 max-h-72 max-w-full rounded-[10px]" loading="lazy" />;
  }
  if (message.kind === "video") {
    return <video src={src} controls className="mt-1 max-h-72 max-w-full rounded-[10px]" preload="metadata" />;
  }
  if (message.kind === "audio" || message.kind === "voice") {
    return <audio src={src} controls className="mt-1 w-56" preload="none" />;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 rounded-[10px] border bg-[var(--surface)] px-3 py-2 text-xs font-medium">
      <Paperclip size={13} />
      {message.mediaName || "file"}
      {message.mediaSize ? <span className="text-[var(--muted)]">· {Math.round(message.mediaSize / 1024)} KB</span> : null}
    </a>
  );
}

export function ChatWorkspace({ initialThreads, telegramReady, whatsappReady }: { initialThreads: Thread[]; telegramReady: boolean; whatsappReady: boolean }) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [channel, setChannel] = useState<"all" | "telegram_userbot" | "whatsapp">("all");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const activeRef = useRef<string | null>(activeId);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/admin/chat?channel=${channel}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      const json = await res.json();
      if (res.ok) setThreads(json.data.threads);
    } catch {
      /* keep */
    }
  }, [channel, q]);

  const loadMessages = useCallback(async (threadId: string, initial: boolean) => {
    try {
      const since = !initial && lastIdRef.current ? `&sinceId=${lastIdRef.current}` : "";
      const res = await fetch(`/api/v1/admin/chat/${threadId}?markRead=1${since}`);
      const json = await res.json();
      if (!res.ok) return;
      const incoming: Message[] = json.data.messages;
      if (initial) {
        setMessages(incoming);
      } else if (incoming.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev.filter((m) => !m.pending), ...incoming.filter((m) => !ids.has(m.id))];
        });
      }
      if (incoming.length) lastIdRef.current = incoming[incoming.length - 1].id;
    } catch {
      /* keep */
    }
  }, []);

  // thread list polling
  useEffect(() => {
    const tick = () => void loadThreads();
    tick();
    const t = setInterval(tick, 6000);
    return () => clearInterval(t);
  }, [loadThreads]);

  // active conversation: load + poll
  useEffect(() => {
    if (!activeId) return;
    lastIdRef.current = null;
    const reset = () => {
      setMessages([]);
      void loadMessages(activeId, true);
    };
    reset();
    const t = setInterval(() => {
      if (activeRef.current) void loadMessages(activeRef.current, false);
    }, 3000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  // autoscroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(fileFromInput?: File) {
    if (!activeId || sending) return;
    const file = fileFromInput ?? null;
    if (!draft.trim() && !file) return;
    setSending(true);
    setError("");
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      direction: "out",
      kind: file ? (file.type.split("/")[0] === "image" ? "image" : file.type.split("/")[0] === "video" ? "video" : file.type.split("/")[0] === "audio" ? "audio" : "file") : "text",
      text: draft.trim() || null,
      mediaId: null,
      mediaMime: file?.type ?? null,
      mediaName: file?.name ?? null,
      mediaSize: file?.size ?? null,
      senderName: "You",
      status: "pending",
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const text = draft;
    setDraft("");
    try {
      const body = new FormData();
      if (text.trim()) body.set("text", text.trim());
      if (file) body.set("file", file);
      const res = await fetch(`/api/v1/admin/chat/${activeId}`, { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Send failed.");
      await loadMessages(activeId, false);
      void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m)));
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Chat workspace</h1>
        <div className="flex gap-1 rounded-[10px] border bg-[var(--surface)] p-1 text-xs font-medium">
          {(["all", "telegram_userbot", "whatsapp"] as const).map((c) => (
            <button key={c} onClick={() => setChannel(c)} className={cn("rounded-[7px] px-2.5 py-1", channel === c ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "text-[var(--muted)]")}>
              {c === "all" ? "All" : c === "telegram_userbot" ? "Telegram" : "WhatsApp"}
            </button>
          ))}
        </div>
      </div>

      {(!telegramReady || !whatsappReady) && (
        <p className="mb-2 text-[11px] text-[var(--muted)]">
          {!telegramReady && "Telegram user bot not logged in. "}
          {!whatsappReady && "WhatsApp Cloud API not configured. "}
          Set up under Admin → Integrations.
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] overflow-hidden rounded-[16px] border bg-[var(--surface)]">
        {/* thread list */}
        <div className="flex min-h-0 flex-col border-r">
          <div className="relative border-b p-2">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="h-9 pl-9 text-xs" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn("flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left", activeId === t.id ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--surface-elevated)]")}
              >
                <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: channelDot[t.channel] }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{t.peerName || t.userName || t.peerId}</span>
                    <span className="shrink-0 text-[10px] text-[var(--muted)]">{timeLabel(t.lastMessageAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-[var(--muted)]">{t.lastDirection === "out" ? "You: " : ""}{t.lastPreview}</span>
                    {t.unreadCount > 0 && <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">{t.unreadCount}</span>}
                  </span>
                  {t.userEmail && <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">{t.userEmail}</span>}
                </span>
              </button>
            ))}
            {!threads.length && <p className="p-6 text-center text-xs text-[var(--muted)]">No conversations yet. They appear when someone messages your Telegram or WhatsApp.</p>}
          </div>
        </div>

        {/* conversation */}
        <div className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <span className="size-2 rounded-full" style={{ background: channelDot[active.channel] }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{active.peerName || active.userName || active.peerId}</p>
                  <p className="truncate text-[11px] text-[var(--muted)]">
                    {active.peerUsername ? `@${active.peerUsername} · ` : ""}{active.channel === "whatsapp" ? `+${active.peerId}` : active.peerId}
                    {active.userEmail ? ` · linked: ${active.userEmail}` : ""}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[var(--surface-elevated)] px-4 py-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-[12px] px-3 py-2 text-sm", m.direction === "out" ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] border")}>
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      {m.kind !== "text" && <MediaBubble message={m} />}
                      <span className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", m.direction === "out" ? "text-white/70" : "text-[var(--muted)]")}>
                        {timeLabel(m.createdAt)}
                        {m.direction === "out" && (m.status === "failed" ? <AlertCircle size={11} /> : m.status === "pending" ? <LoaderCircle size={10} className="animate-spin" /> : m.status === "read" || m.status === "delivered" ? <CheckCheck size={11} /> : <Check size={11} />)}
                      </span>
                    </div>
                  </div>
                ))}
                {!messages.length && <p className="py-10 text-center text-xs text-[var(--muted)]">No messages loaded.</p>}
              </div>

              <div className="border-t p-3">
                {error && <p className="mb-2 text-xs text-[var(--critical)]">{error}</p>}
                <div className="flex items-end gap-2">
                  <button onClick={() => fileRef.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-[10px] border text-[var(--muted)] hover:text-[var(--foreground)]" title="Attach">
                    <Paperclip size={16} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                    onChange={(e) => e.target.files?.[0] && send(e.target.files[0])}
                  />
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="max-h-32 min-h-10 flex-1 resize-none rounded-[10px] border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                  />
                  <button onClick={() => send()} disabled={sending || (!draft.trim())} className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary)] text-white disabled:opacity-50">
                    {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-[var(--muted)]">
              <div className="text-center">
                <MessageCircle size={28} className="mx-auto text-[var(--muted)]" />
                <p className="mt-2">Pick a conversation.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
