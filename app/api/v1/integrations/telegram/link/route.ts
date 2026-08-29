import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { newLinkCode } from "@/lib/notifications";
import { getTelegramConfig } from "@/lib/telegram";

export const runtime = "nodejs";

const CODE_TTL_MINUTES = 30;

export async function POST() {
  try {
    const user = await requireUser();
    const telegram = await getTelegramConfig();
    if (!telegram.configured) {
      return fail("PROVIDER_NOT_CONFIGURED", "Telegram is not configured yet. An admin can add the bot token in the admin area.", 503);
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
    return ok({
      code,
      expiresAt,
      botUsername: telegram.botUsername,
      deepLink: telegram.botUsername ? `https://t.me/${telegram.botUsername}?start=${code}` : null,
      instructions: telegram.botUsername
        ? `Open the link, press Start, or send "/start ${code}" to @${telegram.botUsername}.`
        : `Send "/start ${code}" to the Aperio bot on Telegram.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
