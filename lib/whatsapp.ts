import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getIntegrationRuntime } from "@/lib/settings";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret: string;
  businessNumber: string;
  configured: boolean;
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  try {
    const rt = await getIntegrationRuntime("whatsapp.cloud");
    const phoneNumberId = String(rt.config.phoneNumberId ?? "").trim();
    const accessToken = rt.secret("accessToken") ?? "";
    return {
      phoneNumberId,
      accessToken,
      verifyToken: rt.secret("verifyToken") ?? "",
      appSecret: rt.secret("appSecret") ?? "",
      businessNumber: String(rt.config.businessNumber ?? "").replace(/[^\d]/g, ""),
      configured: Boolean(phoneNumberId && accessToken),
    };
  } catch {
    return { phoneNumberId: "", accessToken: "", verifyToken: "", appSecret: "", businessNumber: "", configured: false };
  }
}

/** X-Hub-Signature-256 check. Skipped (returns true) when no app secret is stored. */
export function verifyWhatsAppSignature(appSecret: string, rawBody: string, header: string | null) {
  if (!appSecret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header.slice(7), "hex"));
  } catch {
    return false;
  }
}

/** Telegram-style <b> tags -> WhatsApp *bold*. */
export function toWhatsAppText(text: string) {
  return text.replace(/<\/?b>/g, "*").replace(/<[^>]+>/g, "");
}

export async function sendWhatsAppText(to: string, body: string) {
  const cfg = await getWhatsAppConfig();
  if (!cfg.configured) throw new Error("WHATSAPP_NOT_CONFIGURED");
  const res = await fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^\d]/g, ""),
      type: "text",
      text: { preview_url: false, body: toWhatsAppText(body).slice(0, 4000) },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) throw new Error(`WHATSAPP_SEND_FAILED: ${json?.error?.message || res.status}`);
  return json;
}
