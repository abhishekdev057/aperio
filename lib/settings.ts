import "server-only";

import { one, query } from "@/lib/db";
import { decryptSecret, encryptSecret, isEncryptionConfigured, maskSecret } from "@/lib/crypto";

export type IntegrationKey =
  | "telegram.bot"
  | "telegram.userbot"
  | "whatsapp.cloud"
  | "whatsapp.twilio"
  | "jobs.jsearch"
  | "jobs.adzuna"
  | "jobs.generic";

interface FieldDef {
  name: string;
  label: string;
  secret: boolean;
  placeholder?: string;
  help?: string;
  optional?: boolean;
}

export interface IntegrationSchema {
  key: IntegrationKey;
  title: string;
  description: string;
  fields: FieldDef[];
}

export const INTEGRATION_SCHEMAS: IntegrationSchema[] = [
  {
    key: "telegram.bot",
    title: "Telegram bot",
    description: "Automated messages to users who link Telegram. Create a bot with @BotFather.",
    fields: [
      { name: "token", label: "Bot token", secret: true, placeholder: "1234567890:AA...", help: "From @BotFather" },
      { name: "botUsername", label: "Bot @username", secret: false, placeholder: "AperioBot", help: "Without the @" },
      { name: "webhookSecret", label: "Webhook secret token", secret: true, help: "Any random string; used to verify Telegram webhook calls." },
    ],
  },
  {
    key: "telegram.userbot",
    title: "Telegram user bot (MTProto)",
    description: "Credentials for a user-account bot run by an external worker. Aperio stores the config; it does not run an MTProto client itself.",
    fields: [
      { name: "apiId", label: "API ID", secret: false, placeholder: "1234567", help: "my.telegram.org" },
      { name: "apiHash", label: "API hash", secret: true },
      { name: "phone", label: "Phone number", secret: false, placeholder: "+91...", optional: true },
      { name: "stringSession", label: "String session", secret: true, optional: true, help: "Generated once by your worker after login." },
    ],
  },
  {
    key: "whatsapp.cloud",
    title: "WhatsApp — Meta Cloud API",
    description: "Meta's official WhatsApp Business Cloud API. Requires a Meta app and a WhatsApp business number. Webhook callback URL: /api/v1/integrations/whatsapp/webhook",
    fields: [
      { name: "phoneNumberId", label: "Phone number ID", secret: false, help: "WhatsApp → API Setup" },
      { name: "businessNumber", label: "Business phone (digits)", secret: false, optional: true, placeholder: "15551234567", help: "Country code + number, digits only. Builds the wa.me link users message." },
      { name: "wabaId", label: "WhatsApp Business Account ID", secret: false, optional: true },
      { name: "accessToken", label: "Access token", secret: true, help: "System-user token, long-lived." },
      { name: "verifyToken", label: "Webhook verify token", secret: true, help: "Any random string. Paste the SAME value into the Meta webhook config." },
      { name: "appSecret", label: "Meta app secret", secret: true, optional: true, help: "App → Settings → Basic. Enables X-Hub-Signature-256 verification." },
    ],
  },
  {
    key: "whatsapp.twilio",
    title: "WhatsApp — Twilio",
    description: "Twilio's WhatsApp sender. Alternative to the Meta Cloud API.",
    fields: [
      { name: "accountSid", label: "Account SID", secret: false, placeholder: "AC..." },
      { name: "authToken", label: "Auth token", secret: true },
      { name: "fromNumber", label: "From (WhatsApp) number", secret: false, placeholder: "whatsapp:+14155238886" },
    ],
  },
  {
    key: "jobs.jsearch",
    title: "Job postings — JSearch (RapidAPI)",
    description: "Live job-posting counts for the market outlook. Subscribe to JSearch on RapidAPI.",
    fields: [
      { name: "rapidApiKey", label: "RapidAPI key", secret: true },
      { name: "rapidApiHost", label: "RapidAPI host", secret: false, placeholder: "jsearch.p.rapidapi.com" },
    ],
  },
  {
    key: "jobs.adzuna",
    title: "Job postings — Adzuna",
    description: "Adzuna's jobs API. Free tier available at developer.adzuna.com.",
    fields: [
      { name: "appId", label: "App ID", secret: false },
      { name: "appKey", label: "App key", secret: true },
      { name: "country", label: "Country code", secret: false, placeholder: "in", help: "gb, us, in, …" },
    ],
  },
  {
    key: "jobs.generic",
    title: "Job postings — custom endpoint",
    description: "Any HTTP endpoint your ingestion worker calls. Aperio just stores the credentials.",
    fields: [
      { name: "baseUrl", label: "Base URL", secret: false, placeholder: "https://api.example.com" },
      { name: "apiKey", label: "API key", secret: true, optional: true },
      { name: "authHeader", label: "Auth header name", secret: false, optional: true, placeholder: "Authorization" },
    ],
  },
];

export function schemaFor(key: string): IntegrationSchema | undefined {
  return INTEGRATION_SCHEMAS.find((s) => s.key === key);
}

interface SettingsRow extends Record<string, unknown> {
  key: string;
  config: Record<string, string>;
  secrets: Record<string, string>;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

async function readRow(key: IntegrationKey) {
  return one<SettingsRow>(
    `SELECT key, config, secrets, enabled, updated_by AS "updatedBy", updated_at AS "updatedAt"
     FROM integration_settings WHERE key=$1`,
    [key],
  );
}

/** Admin-facing view: config in the clear, secrets only as presence + mask. */
export async function getIntegrationForAdmin(key: IntegrationKey) {
  const schema = schemaFor(key)!;
  const row = await readRow(key);
  const secretFields: Record<string, { set: boolean; masked: string | null }> = {};
  for (const field of schema.fields.filter((f) => f.secret)) {
    const stored = row?.secrets?.[field.name];
    let masked: string | null = null;
    if (stored && isEncryptionConfigured()) {
      try {
        masked = maskSecret(decryptSecret(stored));
      } catch {
        masked = "•••• (unreadable — key changed?)";
      }
    }
    secretFields[field.name] = { set: Boolean(stored), masked };
  }
  return {
    key,
    schema,
    enabled: row?.enabled ?? false,
    config: row?.config ?? {},
    secrets: secretFields,
    updatedBy: row?.updatedBy ?? null,
    updatedAt: row?.updatedAt ?? null,
  };
}

export async function saveIntegration(
  key: IntegrationKey,
  input: { config?: Record<string, string>; secrets?: Record<string, string>; enabled?: boolean },
  updatedBy: string,
) {
  const schema = schemaFor(key);
  if (!schema) throw new Error("UNKNOWN_INTEGRATION");
  const existing = await readRow(key);

  const config = { ...(existing?.config ?? {}) };
  for (const field of schema.fields.filter((f) => !f.secret)) {
    if (input.config && field.name in input.config) config[field.name] = String(input.config[field.name] ?? "").slice(0, 500);
  }

  const secrets = { ...(existing?.secrets ?? {}) };
  for (const field of schema.fields.filter((f) => f.secret)) {
    if (!input.secrets || !(field.name in input.secrets)) continue;
    const value = String(input.secrets[field.name] ?? "");
    if (value === "") delete secrets[field.name];
    else secrets[field.name] = encryptSecret(value.slice(0, 4000));
  }

  const enabled = typeof input.enabled === "boolean" ? input.enabled : existing?.enabled ?? false;

  await query(
    `INSERT INTO integration_settings (key, config, secrets, enabled, updated_by, updated_at)
     VALUES ($1,$2::jsonb,$3::jsonb,$4,$5, now())
     ON CONFLICT (key) DO UPDATE SET config=EXCLUDED.config, secrets=EXCLUDED.secrets,
       enabled=EXCLUDED.enabled, updated_by=EXCLUDED.updated_by, updated_at=now()`,
    [key, JSON.stringify(config), JSON.stringify(secrets), enabled, updatedBy],
  );
  return getIntegrationForAdmin(key);
}

/** Runtime accessor — returns decrypted values. Server-only, never send to a client. */
export async function getIntegrationRuntime(key: IntegrationKey) {
  const row = await readRow(key);
  if (!row) return { enabled: false, config: {} as Record<string, string>, secret: () => null as string | null };
  return {
    enabled: row.enabled,
    config: row.config ?? {},
    secret(field: string): string | null {
      const stored = row.secrets?.[field];
      if (!stored || !isEncryptionConfigured()) return null;
      try {
        return decryptSecret(stored);
      } catch {
        return null;
      }
    },
  };
}
