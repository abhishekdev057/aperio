"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Source = Record<string, unknown>;
type IntKey = { key: string; title: string };

const blank = { name: "", kind: "api", weight: 1, integrationKey: "", region: "global", enabled: true };

function SourceRow({
  row,
  isDraft,
  integrationKeys,
  saving,
  onChange,
  onSave,
  onRemove,
}: {
  row: Record<string, unknown>;
  isDraft?: boolean;
  integrationKeys: IntKey[];
  saving: boolean;
  onChange: (patch: Record<string, unknown>) => void;
  onSave: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="grid gap-2 border-b px-3 py-3 last:border-0 sm:grid-cols-[1.4fr_.8fr_.7fr_1fr_.6fr_auto] sm:items-center">
      <Input value={String(row.name ?? "")} onChange={(e) => onChange({ name: e.target.value })} placeholder="Source name" />
      <select value={String(row.kind ?? "api")} onChange={(e) => onChange({ kind: e.target.value })} className="h-10 rounded-[9px] border bg-[var(--surface-elevated)] px-2 text-xs">
        {["api", "agency", "manual"].map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <label className="flex items-center gap-1.5 text-xs">
        w
        <Input type="number" step="0.5" min="0" max="10" value={String(row.weight ?? 1)} onChange={(e) => onChange({ weight: e.target.value })} className="w-16" />
      </label>
      <select value={String(row.integrationKey ?? "")} onChange={(e) => onChange({ integrationKey: e.target.value })} className="h-10 rounded-[9px] border bg-[var(--surface-elevated)] px-2 text-xs">
        <option value="">no API creds</option>
        {integrationKeys.map((k) => <option key={k.key} value={k.key}>{k.title}</option>)}
      </select>
      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={Boolean(row.enabled)} onChange={(e) => onChange({ enabled: e.target.checked })} />on</label>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={onSave} disabled={saving || !String(row.name ?? "").trim()}>
          {saving ? <LoaderCircle size={13} className="animate-spin" /> : isDraft ? <Plus size={13} /> : <Check size={13} />}
        </Button>
        {!isDraft && onRemove && <button onClick={onRemove} className="grid size-8 place-items-center rounded-[8px] text-[var(--muted)] hover:text-[var(--critical)]"><Trash2 size={13} /></button>}
      </div>
    </div>
  );
}

export function MarketSources({ initial }: { initial: { sources: Source[]; integrationKeys: IntKey[] } }) {
  const [sources, setSources] = useState(initial.sources);
  const [draft, setDraft] = useState<Record<string, unknown>>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(row: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/market/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...row, weight: Number(row.weight), integrationKey: row.integrationKey || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Save failed.");
      setSources((s) => {
        const exists = s.some((x) => x.id === json.data.id);
        return exists ? s.map((x) => (x.id === json.data.id ? json.data : x)) : [...s, json.data];
      });
      if (!row.id) setDraft(blank);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/v1/admin/market/sources/${id}`, { method: "DELETE" });
    setSources((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job market</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Weighted job-posting sources feed the demand outlook and forecast. Add API credentials under{" "}
          <Link href="/admin/integrations" className="font-medium text-[var(--primary)]">Integrations</Link>, then link them here. Higher weight = more influence on the blended demand index.
        </p>
      </div>

      <div className="overflow-hidden rounded-[14px] border bg-[var(--surface)]">
        <div className="hidden grid-cols-[1.4fr_.8fr_.7fr_1fr_.6fr_auto] gap-2 border-b bg-[var(--surface-elevated)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:grid">
          <span>Name</span><span>Kind</span><span>Weight</span><span>API creds</span><span>On</span><span />
        </div>
        {sources.map((s) => (
          <SourceRow
            key={String(s.id)}
            row={s}
            integrationKeys={initial.integrationKeys}
            saving={saving}
            onChange={(patch) => setSources((list) => list.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))}
            onSave={() => save(s)}
            onRemove={() => remove(String(s.id))}
          />
        ))}
        <SourceRow
          row={draft}
          isDraft
          integrationKeys={initial.integrationKeys}
          saving={saving}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onSave={() => save(draft)}
        />
      </div>
      {error && <p className="text-sm text-[var(--critical)]">{error}</p>}

      <p className="text-xs text-[var(--muted)]">
        Sources only shape the outlook once observations are ingested (<code>npm run market:ingest</code> reads enabled sources + their linked credentials). No source produces fabricated numbers.
      </p>
    </div>
  );
}
