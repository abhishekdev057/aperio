import "server-only";

const API_BASE = "https://api.telegram.org";

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
}

export function isTelegramConfigured() {
  return Boolean(botToken());
}

export function telegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || "";
}

/** Bot @username, used to build the t.me deep link shown in the UI. */
export function telegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || "";
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(chatId: string, text: string, opts: { preformatted?: boolean } = {}) {
  const token = botToken();
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
