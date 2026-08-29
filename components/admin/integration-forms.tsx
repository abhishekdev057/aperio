"use client";

import { useState } from "react";
import { Check, KeyRound, LoaderCircle, Plug, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FieldDef {
  name: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
  optional?: boolean;
}
interface Integration {
  key: string;
  schema: { key: string; title: string; description: string; fields: FieldDef[] };
  enabled: boolean;
  config: Record<string, string>;
  secrets: Record<string, { set: boolean; masked: string | null }>;
  updatedBy: string | null;
  updatedAt: string | null;
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const [enabled, setEnabled] = useState(integration.enabled);
  const [config, setConfig] = useState<Record<string, string>>({ ...integration.config });
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [state, setState] = useState(integration);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/integrations/${integration.key}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config, secrets, enabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Save failed.");
      setState(json.data);
      setSecrets({});
      setMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/integrations/${integration.key}/test`, { method: "POST" });
      const json = await res.json();
      const result = json.data ?? {};
      setMessage({ ok: Boolean(result.ok), text: result.detail || (result.ok ? "OK" : "Failed") });
    } catch {
      setMessage({ ok: false, text: "Test request failed." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-[16px] border bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Plug size={15} className="text-[var(--primary)]" />{integration.schema.title}</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">{integration.schema.description}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {integration.schema.fields.map((field) => {
          const stored = state.secrets[field.name];
          return (
            <label key={field.name} className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                {field.secret && <KeyRound size={11} className="text-[var(--muted)]" />}
                {field.label}
                {field.optional && <span className="text-[var(--muted)]">(optional)</span>}
                {field.secret && stored?.set && <span className="ml-auto rounded bg-[var(--positive-soft)] px-1.5 text-[10px] font-semibold text-[var(--positive)]">stored {stored.masked}</span>}
              </span>
              {field.secret ? (
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={stored?.set ? "•••••••• (leave blank to keep)" : field.placeholder || "Enter value"}
                  value={secrets[field.name] ?? ""}
                  onChange={(e) => setSecrets((s) => ({ ...s, [field.name]: e.target.value }))}
                />
              ) : (
                <Input
                  placeholder={field.placeholder}
                  value={config[field.name] ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.name]: e.target.value }))}
                />
              )}
              {field.help && <span className="mt-1 block text-[10px] text-[var(--muted)]">{field.help}</span>}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}Save</Button>
        <Button size="sm" variant="secondary" onClick={test} disabled={testing}>{testing ? <LoaderCircle size={14} className="animate-spin" /> : <Plug size={14} />}Test connection</Button>
        {state.updatedAt && <span className="text-[11px] text-[var(--muted)]">Updated by {state.updatedBy ?? "—"}</span>}
        {message && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${message.ok ? "text-[var(--positive)]" : "text-[var(--critical)]"}`}>
            {message.ok ? <Check size={13} /> : <X size={13} />}{message.text}
          </span>
        )}
      </div>
    </section>
  );
}

export function IntegrationForms({ integrations, encryptionReady }: { integrations: Integration[]; encryptionReady: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Credentials are encrypted with APP_ENCRYPTION_KEY and stored in the database — not in environment files.</p>
      </div>
      {!encryptionReady && (
        <div className="rounded-[12px] border border-[color-mix(in_srgb,var(--critical)_35%,var(--border))] bg-[var(--critical-soft)] p-4 text-sm text-[var(--critical)]">
          <b>APP_ENCRYPTION_KEY is not set.</b> Add it to the server environment before saving any credentials.
        </div>
      )}
      {integrations.map((integration) => (
        <IntegrationCard key={integration.key} integration={integration} />
      ))}
    </div>
  );
}
