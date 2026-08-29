import "server-only";

import { Api, TelegramClient, password as tgPassword, sessions as tgSessions } from "teleproto";
import { getIntegrationRuntime, setRawSecrets, type IntegrationKey } from "@/lib/settings";

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
