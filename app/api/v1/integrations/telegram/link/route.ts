import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { newLinkCode } from "@/lib/notifications";
import { getTelegramConfig } from "@/lib/telegram";
import { userbotStatus } from "@/lib/telegram-userbot";

export const runtime = "nodejs";

const CODE_TTL_MINUTES = 30;

export async function POST() {
  try {
    const user = await requireUser();
    const [telegram, userbot] = await Promise.all([getTelegramConfig(), userbotStatus()]);

    // Prefer the user bot: linking to it lets that account send messages, tests and polls.
    const useUserbot = userbot.loggedIn && Boolean(userbot.username);
    if (!useUserbot && !telegram.configured) {
      return fail("PROVIDER_NOT_CONFIGURED", "Telegram is not set up yet. An admin can configure it in the admin area.", 503);
    }

    const code = newLinkCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();
    await query(
      `INSERT INTO messaging_channels (id, user_id, platform, status, via, link_code, link_code_expires_at, updated_at)
       VALUES ($1,$2,'telegram','pending',$3,$4,$5, now())
       ON CONFLICT (user_id, platform)
       DO UPDATE SET status='pending', via=EXCLUDED.via, link_code=EXCLUDED.link_code,
         link_code_expires_at=EXCLUDED.link_code_expires_at, address=NULL, peer_access_hash=NULL, verified_at=NULL, updated_at=now()`,
      [randomUUID(), user.id, useUserbot ? "userbot" : "bot", code, expiresAt],
    );

    const handle = useUserbot ? userbot.username : telegram.botUsername;
    return ok({
      code,
      expiresAt,
      via: useUserbot ? "userbot" : "bot",
      botUsername: handle,
      deepLink: handle ? `https://t.me/${handle}?${useUserbot ? "text" : "start"}=${code}` : null,
      instructions: handle
        ? `Open the link, or send "${code}" to @${handle} on Telegram.${useUserbot ? " Linking can take a few seconds." : ""}`
        : `Send "${code}" to the Aperio Telegram account.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
