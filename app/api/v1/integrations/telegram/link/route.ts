import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { newLinkCode } from "@/lib/notifications";
import { isTelegramConfigured, telegramBotUsername } from "@/lib/telegram";

export const runtime = "nodejs";

const CODE_TTL_MINUTES = 30;

export async function POST() {
  try {
    const user = await requireUser();
    if (!isTelegramConfigured()) {
      return fail("PROVIDER_NOT_CONFIGURED", "Telegram is not configured on the server yet.", 503);
    }
    const code = newLinkCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();
    await query(
      `INSERT INTO messaging_channels (id, user_id, platform, status, link_code, link_code_expires_at, updated_at)
       VALUES ($1,$2,'telegram','pending',$3,$4, now())
       ON CONFLICT (user_id, platform)
       DO UPDATE SET status='pending', link_code=EXCLUDED.link_code, link_code_expires_at=EXCLUDED.link_code_expires_at,
         address=NULL, verified_at=NULL, updated_at=now()`,
      [randomUUID(), user.id, code, expiresAt],
    );
    const botUsername = telegramBotUsername();
    return ok({
      code,
      expiresAt,
      botUsername,
      deepLink: botUsername ? `https://t.me/${botUsername}?start=${code}` : null,
      instructions: botUsername
        ? `Open the link, press Start, or send "/start ${code}" to @${botUsername}.`
        : `Send "/start ${code}" to the Aperio bot on Telegram.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
