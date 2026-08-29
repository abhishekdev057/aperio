import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { parseLinkCode } from "@/lib/telegram";
import { getWhatsAppConfig, sendWhatsAppText, verifyWhatsAppSignature } from "@/lib/whatsapp";

export const runtime = "nodejs";

interface WaMessage {
  from?: string;
  type?: string;
  text?: { body?: string };
}
interface WaPayload {
  entry?: Array<{ changes?: Array<{ value?: { messages?: WaMessage[] } }> }>;
}

// Meta verification handshake.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const cfg = await getWhatsAppConfig();
  if (mode === "subscribe" && cfg.verifyToken && token === cfg.verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const cfg = await getWhatsAppConfig();
  if (!verifyWhatsAppSignature(cfg.appSecret, raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: WaPayload;
  try {
    payload = JSON.parse(raw) as WaPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const messages: WaMessage[] = (payload.entry ?? []).flatMap((entry) =>
    (entry.changes ?? []).flatMap((change) => change.value?.messages ?? []),
  );

  for (const msg of messages) {
    if (msg.type !== "text") continue;
    const from = String(msg.from || "").replace(/[^\d]/g, "");
    if (!from) continue;
    const code = parseLinkCode(msg.text?.body);

    if (!code) {
      await sendWhatsAppText(from, "Send the link code from Aperio → Settings → Connected messaging.").catch(() => {});
      continue;
    }

    const rows = await query<{ id: string; userId: string } & Record<string, unknown>>(
      `UPDATE messaging_channels
       SET status='linked', address=$1, handle=$2, link_code=NULL, link_code_expires_at=NULL, verified_at=now(), updated_at=now()
       WHERE platform='whatsapp' AND link_code=$3 AND (link_code_expires_at IS NULL OR link_code_expires_at > now())
       RETURNING id, user_id AS "userId"`,
      [from, `+${from}`, code],
    );

    if (!rows[0]) {
      await sendWhatsAppText(from, "That code is invalid or expired. Generate a new one in Aperio settings.").catch(() => {});
      continue;
    }

    await query(
      `UPDATE messaging_channels SET status='disabled', address=NULL, updated_at=now()
       WHERE platform='whatsapp' AND address=$1 AND id <> $2`,
      [from, rows[0].id],
    );
    await logActivity({ action: "channel.link", userId: rows[0].userId, entityType: "channel", entityId: rows[0].id, metadata: { platform: "whatsapp" }, request });
    await sendWhatsAppText(
      from,
      "*Aperio linked.* You'll get roadmap reminders, a weekly digest, and analysis updates here. Manage them in Settings.",
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
