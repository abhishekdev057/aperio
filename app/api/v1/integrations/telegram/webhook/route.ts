import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  type TelegramUpdate,
  isTelegramConfigured,
  parseLinkCode,
  sendTelegramMessage,
  telegramWebhookSecret,
} from "@/lib/telegram";

export const runtime = "nodejs";

// Telegram expects a fast 200 for every update; we always return ok:true.
export async function POST(request: Request) {
  const ok = () => NextResponse.json({ ok: true });

  const secret = telegramWebhookSecret();
  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isTelegramConfigured()) return ok();

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return ok();
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  if (!message || chatId === undefined) return ok();
  const chatIdStr = String(chatId);
  const handle = message.from?.username ? `@${message.from.username}` : message.chat?.first_name ?? null;

  const code = parseLinkCode(message.text);
  if (!code) {
    await sendTelegramMessage(
      chatIdStr,
      "Send the link code from Aperio → Settings → Connected messaging, or use the button there.",
    ).catch(() => {});
    return ok();
  }

  const rows = await query<{ id: string; userId: string } & Record<string, unknown>>(
    `UPDATE messaging_channels
     SET status='linked', address=$1, handle=$2, link_code=NULL, link_code_expires_at=NULL, verified_at=now(), updated_at=now()
     WHERE platform='telegram' AND link_code=$3
       AND (link_code_expires_at IS NULL OR link_code_expires_at > now())
     RETURNING id, user_id AS "userId"`,
    [chatIdStr, handle, code],
  );

  if (!rows[0]) {
    await sendTelegramMessage(chatIdStr, "That code is invalid or expired. Generate a new one in Aperio settings.").catch(() => {});
    return ok();
  }

  // One chat should only drive one account: disable the same chat elsewhere.
  await query(
    `UPDATE messaging_channels SET status='disabled', address=NULL, updated_at=now()
     WHERE platform='telegram' AND address=$1 AND id <> $2`,
    [chatIdStr, rows[0].id],
  );

  await sendTelegramMessage(
    chatIdStr,
    "<b>Aperio linked.</b>\nYou'll get roadmap reminders, a weekly digest, and analysis updates here. Manage them in Settings.",
    { preformatted: true },
  ).catch(() => {});
  return ok();
}
