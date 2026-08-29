import { requireAdmin } from "@/lib/admin";
import { fail, handleApiError, ok } from "@/lib/api";
import { getIntegrationRuntime, schemaFor } from "@/lib/settings";
import { telegramGetMe } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(_: Request, context: { params: Promise<{ key: string }> }) {
  try {
    await requireAdmin();
    const key = (await context.params).key;
    if (!schemaFor(key)) return fail("NOT_FOUND", "Unknown integration.", 404);

    if (key === "telegram.bot") {
      try {
        const me = await telegramGetMe();
        return ok({ ok: true, detail: me.username ? `Connected as @${me.username}` : "Bot token accepted." });
      } catch (error) {
        return ok({ ok: false, detail: error instanceof Error ? error.message : "Telegram rejected the token." });
      }
    }

    if (key === "whatsapp.cloud") {
      const runtime = await getIntegrationRuntime("whatsapp.cloud");
      const phoneNumberId = runtime.config.phoneNumberId;
      const token = runtime.secret("accessToken");
      if (!phoneNumberId || !token) return ok({ ok: false, detail: "Add the phone number ID and access token first." });
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}?fields=verified_name,display_phone_number`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { verified_name?: string; display_phone_number?: string; error?: { message?: string } };
        if (!res.ok) return ok({ ok: false, detail: json.error?.message || `HTTP ${res.status}` });
        return ok({ ok: true, detail: `${json.verified_name ?? "Number"} · ${json.display_phone_number ?? phoneNumberId}` });
      } catch (error) {
        return ok({ ok: false, detail: error instanceof Error ? error.message : "Request failed." });
      }
    }

    if (key === "whatsapp.twilio") {
      const runtime = await getIntegrationRuntime("whatsapp.twilio");
      const sid = runtime.config.accountSid;
      const authToken = runtime.secret("authToken");
      if (!sid || !authToken) return ok({ ok: false, detail: "Add the Account SID and auth token first." });
      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
          headers: { authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}` },
        });
        const json = (await res.json()) as { friendly_name?: string; status?: string; message?: string };
        if (!res.ok) return ok({ ok: false, detail: json.message || `HTTP ${res.status}` });
        return ok({ ok: true, detail: `${json.friendly_name ?? sid} · ${json.status ?? "ok"}` });
      } catch (error) {
        return ok({ ok: false, detail: error instanceof Error ? error.message : "Request failed." });
      }
    }

    return ok({ ok: false, detail: "No connection test available for this integration yet. Credentials are stored." });
  } catch (error) {
    return handleApiError(error);
  }
}
