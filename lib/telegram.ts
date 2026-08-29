import "server-only";

import { getIntegrationRuntime } from "@/lib/settings";

const API_BASE = "https://api.telegram.org";

export interface TelegramConfig {
  token: string;
  botUsername: string;
  webhookSecret: string;
  configured: boolean;
}

/**
 * Credentials come from the admin UI (encrypted in `integration_settings`) and
 * fall back to environment variables so an env-only setup keeps working.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  let token = "";
  let botUsername = "";
  let webhookSecret = "";
  try {
    const runtime = await getIntegrationRuntime("telegram.bot");
    token = runtime.secret("token") ?? "";
    botUsername = (runtime.config.botUsername ?? "").replace(/^@/, "");
    webhookSecret = runtime.secret("webhookSecret") ?? "";
  } catch {
    /* fall through to env */
  }
  token ||= process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  botUsername ||= (process.env.TELEGRAM_BOT_USERNAME?.trim() || "").replace(/^@/, "");
  webhookSecret ||= process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || "";
  return { token, botUsername, webhookSecret, configured: Boolean(token) };
}

export async function isTelegramConfigured() {
  return (await getTelegramConfig()).configured;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(chatId: string, text: string, opts: { preformatted?: boolean } = {}) {
  const { token } = await getTelegramConfig();
  if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED");
  const body = opts.preformatted ? text : escapeHtml(text);
  const response = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      link_preview_options: { is_disabled: true },
    }),
  });
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!response.ok || !json.ok) {
    throw new Error(`TELEGRAM_SEND_FAILED: ${json.description || response.status}`);
  }
  return json;
}

export async function sendTelegramPoll(chatId: string, question: string, options: string[]) {
  const { token } = await getTelegramConfig();
  if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED");
  const response = await fetch(`${API_BASE}/bot${token}/sendPoll`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      question: question.slice(0, 300),
      options: options.slice(0, 10).map((o) => o.slice(0, 100)),
      is_anonymous: false,
      allows_multiple_answers: false,
    }),
  });
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string; result?: { poll?: { id?: string } } };
  if (!response.ok || !json.ok) throw new Error(`TELEGRAM_POLL_FAILED: ${json.description || response.status}`);
  return json.result?.poll?.id ?? null;
}

export async function telegramGetMe() {
  const { token } = await getTelegramConfig();
  if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED");
  const response = await fetch(`${API_BASE}/bot${token}/getMe`);
  const json = (await response.json().catch(() => ({}))) as { ok?: boolean; result?: { username?: string }; description?: string };
  if (!response.ok || !json.ok) throw new Error(json.description || `HTTP ${response.status}`);
  return json.result ?? {};
}

export interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number | string; type?: string; username?: string; first_name?: string };
    from?: { username?: string; first_name?: string };
  };
}

/** Pull a link code out of "/start CODE", "/start=CODE", or a bare code message. */
export function parseLinkCode(text: string | undefined) {
  if (!text) return null;
  const trimmed = text.trim();
  const startMatch = trimmed.match(/^\/start(?:[=\s]+(.+))?$/i);
  const candidate = startMatch ? (startMatch[1] ?? "").trim() : trimmed;
  const code = candidate.replace(/[^A-Za-z0-9]/g, "");
  return code.length >= 6 && code.length <= 24 ? code.toUpperCase() : null;
}
