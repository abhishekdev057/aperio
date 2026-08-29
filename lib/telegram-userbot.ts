import "server-only";

import { Api, TelegramClient, password as tgPassword, sessions as tgSessions } from "teleproto";
import { getIntegrationRuntime, setRawSecrets, type IntegrationKey } from "@/lib/settings";
import { query } from "@/lib/db";
import {
  MAX_MEDIA_BYTES,
  getThreadForSend,
  maxExternalId,
  recordMessage,
  storeMedia,
  upsertThread,
  type MessageKind,
} from "@/lib/chat";

const { StringSession } = tgSessions;
const { computeCheck } = tgPassword;

const KEY: IntegrationKey = "telegram.userbot";
const CONNECT_RETRIES = 3;

function makeClient(apiId: number, apiHash: string, session: string) {
  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: CONNECT_RETRIES,
    deviceModel: "Aperio",
    systemVersion: "1.0",
    appVersion: "1.0",
  });
}

async function creds() {
  const rt = await getIntegrationRuntime(KEY);
  const apiId = Number(rt.config.apiId ?? 0);
  const apiHash = rt.secret("apiHash") ?? "";
  const phone = String(rt.config.phone ?? "").trim();
  return { apiId, apiHash, phone, rt };
}

/** Step 1: send the login code to the configured phone. */
export async function sendUserbotLoginCode() {
  const { apiId, apiHash, phone } = await creds();
  if (!apiId || !apiHash || !phone) throw new Error("USERBOT_CREDS_MISSING");

  const client = makeClient(apiId, apiHash, "");
  try {
    await client.connect();
    const result = await client.sendCode({ apiId, apiHash }, phone);
    const pendingSession = (client.session as { save: () => string }).save();
    await setRawSecrets(KEY, {
      _pendingCodeHash: result.phoneCodeHash,
      _pendingSession: pendingSession,
    });
    return { sent: true, viaApp: Boolean(result.isCodeViaApp) };
  } finally {
    await client.disconnect().catch(() => {});
  }
}

/** Step 2: complete the login with the OTP (and 2FA password if the account has one). */
export async function signInUserbot(code: string, password?: string) {
  const { apiId, apiHash, phone, rt } = await creds();
  if (!apiId || !apiHash || !phone) throw new Error("USERBOT_CREDS_MISSING");
  const phoneCodeHash = rt.secret("_pendingCodeHash");
  const pendingSession = rt.secret("_pendingSession");
  if (!phoneCodeHash || !pendingSession) throw new Error("NO_PENDING_LOGIN");

  const client = makeClient(apiId, apiHash, pendingSession);
  try {
    await client.connect();
    try {
      await client.invoke(new Api.auth.SignIn({ phoneNumber: phone, phoneCodeHash, phoneCode: code }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("SESSION_PASSWORD_NEEDED")) {
        if (!password) throw new Error("PASSWORD_REQUIRED");
        const pwd = await client.invoke(new Api.account.GetPassword());
        const check = await computeCheck(pwd, password);
        await client.invoke(new Api.auth.CheckPassword({ password: check }));
      } else if (message.includes("PHONE_CODE_INVALID") || message.includes("PHONE_CODE_EXPIRED")) {
        throw new Error("PHONE_CODE_INVALID");
      } else {
        throw error;
      }
    }

    const me = await client.getMe();
    const stringSession = (client.session as { save: () => string }).save();
    await setRawSecrets(KEY, {
      stringSession,
      _pendingCodeHash: null,
      _pendingSession: null,
    });
    return {
      linked: true,
      me: {
        id: String((me as { id?: unknown })?.id ?? ""),
        username: (me as { username?: string })?.username ?? null,
        firstName: (me as { firstName?: string })?.firstName ?? null,
        phone: (me as { phone?: string })?.phone ?? null,
      },
    };
  } finally {
    await client.disconnect().catch(() => {});
  }
}

/** Connection test using the stored session. */
export async function testUserbot() {
  const { apiId, apiHash, rt } = await creds();
  const session = rt.secret("stringSession");
  if (!apiId || !apiHash) return { ok: false, detail: "Add the API ID and API hash first." };
  if (!session) return { ok: false, detail: "Not logged in yet — send an OTP and sign in below." };

  const client = makeClient(apiId, apiHash, session);
  try {
    await client.connect();
    const me = await client.getMe();
    const username = (me as { username?: string })?.username;
    const firstName = (me as { firstName?: string })?.firstName;
    return { ok: true, detail: `Logged in as ${username ? `@${username}` : firstName ?? "user"}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Connection failed." };
  } finally {
    await client.disconnect().catch(() => {});
  }
}

export async function userbotStatus() {
  const rt = await getIntegrationRuntime(KEY);
  return {
    hasCreds: Boolean(rt.config.apiId && rt.secret("apiHash") && rt.config.phone),
    loggedIn: Boolean(rt.secret("stringSession")),
    pending: Boolean(rt.secret("_pendingCodeHash")),
    phone: String(rt.config.phone ?? ""),
  };
}

// --- chat workspace: sync + send -----------------------------------------

async function connectedClient() {
  const { apiId, apiHash, rt } = await creds();
  const session = rt.secret("stringSession");
  if (!apiId || !apiHash || !session) return null;
  const client = makeClient(apiId, apiHash, session);
  await client.connect();
  return client;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mediaKind(msg: any): { kind: MessageKind; mime: string; name: string | null } | null {
  if (msg.photo) return { kind: "image", mime: "image/jpeg", name: null };
  if (msg.sticker) return { kind: "sticker", mime: "image/webp", name: null };
  if (msg.voice) return { kind: "voice", mime: "audio/ogg", name: null };
  if (msg.video || msg.videoNote || msg.gif) return { kind: "video", mime: "video/mp4", name: null };
  if (msg.audio) return { kind: "audio", mime: msg.audio.mimeType || "audio/mpeg", name: msg.audio.attributes?.find?.((a: any) => a.fileName)?.fileName ?? null };
  if (msg.document) {
    const mime = msg.document.mimeType || "application/octet-stream";
    const name = msg.document.attributes?.find?.((a: any) => a.fileName)?.fileName ?? null;
    const kind: MessageKind = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "file";
    return { kind, mime, name };
  }
  return null;
}

function peerTypeOf(entity: any): "user" | "chat" | "channel" {
  if (entity?.className === "Channel") return "channel";
  if (entity?.className === "Chat") return "chat";
  return "user";
}

export async function syncUserbotMessages(perDialog = 25, maxDialogs = 40) {
  const lock = await query<{ ok: boolean }>(
    `INSERT INTO chat_sync_state (channel, running, synced_at) VALUES ('telegram_userbot', true, now())
     ON CONFLICT (channel) DO UPDATE SET running = true, synced_at = now()
     WHERE chat_sync_state.running = false OR chat_sync_state.synced_at < now() - interval '90 seconds'
     RETURNING true AS ok`,
  );
  if (!lock[0]) return { skipped: true };

  const client = await connectedClient();
  if (!client) {
    await query(`UPDATE chat_sync_state SET running=false, detail='not logged in' WHERE channel='telegram_userbot'`);
    return { skipped: true, reason: "not_logged_in" };
  }

  let stored = 0;
  try {
    const dialogs = await client.getDialogs({ limit: maxDialogs });
    for (const dialog of dialogs) {
      const entity: any = dialog.entity;
      if (!entity || peerTypeOf(entity) === "channel") continue; // skip broadcast channels
      const peerId = String(dialog.id);
      const name = (dialog as any).name || [entity.firstName, entity.lastName].filter(Boolean).join(" ") || entity.title || peerId;
      const threadId = await upsertThread({
        channel: "telegram_userbot",
        peerId,
        peerName: name,
        peerUsername: entity.username ?? null,
        peerAccessHash: entity.accessHash != null ? String(entity.accessHash) : null,
        peerType: peerTypeOf(entity),
      });

      const minId = await maxExternalId(threadId);
      const messages = await client.getMessages(entity, { limit: perDialog, minId });
      for (const msg of [...messages].reverse()) {
        if (!msg?.id) continue;
        const media = mediaKind(msg);
        let mediaId: string | null = null;
        let mediaSize: number | null = null;
        if (media) {
          try {
            const buf = (await client.downloadMedia(msg, {})) as Buffer | undefined;
            if (buf && buf.length && buf.length <= MAX_MEDIA_BYTES) {
              mediaId = await storeMedia({ mime: media.mime, name: media.name, data: buf });
              mediaSize = buf.length;
            } else if (buf) {
              mediaSize = buf.length;
            }
          } catch {
            /* leave media undownloaded */
          }
        }
        const saved = await recordMessage({
          threadId,
          direction: msg.out ? "out" : "in",
          externalId: String(msg.id),
          kind: media ? media.kind : "text",
          text: msg.message || null,
          mediaId,
          mediaMime: media?.mime ?? null,
          mediaName: media?.name ?? null,
          mediaSize,
          senderName: msg.out ? "You" : name,
          status: msg.out ? "sent" : "delivered",
          at: msg.date ? new Date(msg.date * 1000) : new Date(),
        });
        if (saved) stored += 1;
      }
    }
    await query(`UPDATE chat_sync_state SET running=false, detail=$1, synced_at=now() WHERE channel='telegram_userbot'`, [`ok, ${stored} new`]);
    return { stored };
  } catch (error) {
    await query(`UPDATE chat_sync_state SET running=false, detail=$1 WHERE channel='telegram_userbot'`, [error instanceof Error ? error.message.slice(0, 200) : "error"]);
    throw error;
  } finally {
    await client.disconnect().catch(() => {});
  }
}

function inputPeerFor(t: { peerId: string; peerUsername: string | null; peerAccessHash: string | null; peerType: string | null }) {
  const id = BigInt(t.peerId.replace("-100", "").replace("-", ""));
  const hash = t.peerAccessHash ? BigInt(t.peerAccessHash) : 0n;
  if (t.peerType === "channel") return new Api.InputPeerChannel({ channelId: id as any, accessHash: hash as any });
  if (t.peerType === "chat") return new Api.InputPeerChat({ chatId: id as any });
  return new Api.InputPeerUser({ userId: id as any, accessHash: hash as any });
}

export async function sendUserbotMessage(threadId: string, input: { text?: string; file?: { data: Buffer; mime: string; name: string } }) {
  const thread = await getThreadForSend(threadId);
  if (!thread || thread.channel !== "telegram_userbot") throw new Error("THREAD_NOT_FOUND");
  const client = await connectedClient();
  if (!client) throw new Error("USERBOT_NOT_LOGGED_IN");
  try {
    const peer = thread.peerUsername ? `@${thread.peerUsername.replace(/^@/, "")}` : inputPeerFor(thread);
    let sent: any;
    if (input.file) {
      sent = await client.sendFile(peer as any, {
        file: input.file.data,
        caption: input.text || undefined,
        forceDocument: !/^(image|video|audio)\//.test(input.file.mime),
        attributes: [new Api.DocumentAttributeFilename({ fileName: input.file.name || "file" })],
      });
    } else {
      sent = await client.sendMessage(peer as any, { message: input.text || "" });
    }
    const msg = Array.isArray(sent) ? sent[0] : sent;
    return { externalId: msg?.id != null ? String(msg.id) : null };
  } finally {
    await client.disconnect().catch(() => {});
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
