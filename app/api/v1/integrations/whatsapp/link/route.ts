import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { newLinkCode } from "@/lib/notifications";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const runtime = "nodejs";

const CODE_TTL_MINUTES = 30;

export async function POST() {
  try {
    const user = await requireUser();
    const cfg = await getWhatsAppConfig();
    if (!cfg.configured) {
      return fail("PROVIDER_NOT_CONFIGURED", "WhatsApp is not configured yet. An admin can add the Cloud API credentials in the admin area.", 503);
    }
    const code = newLinkCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();
    await query(
      `INSERT INTO messaging_channels (id, user_id, platform, status, link_code, link_code_expires_at, updated_at)
       VALUES ($1,$2,'whatsapp','pending',$3,$4, now())
       ON CONFLICT (user_id, platform)
       DO UPDATE SET status='pending', link_code=EXCLUDED.link_code, link_code_expires_at=EXCLUDED.link_code_expires_at,
         address=NULL, verified_at=NULL, updated_at=now()`,
      [randomUUID(), user.id, code, expiresAt],
    );
    const deepLink = cfg.businessNumber ? `https://wa.me/${cfg.businessNumber}?text=${encodeURIComponent(code)}` : null;
    return ok({
      code,
      expiresAt,
      deepLink,
      instructions: cfg.businessNumber
        ? `Open the link and send the code to +${cfg.businessNumber}, or message that number with "${code}".`
        : `Message the Aperio WhatsApp number with the code "${code}".`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
