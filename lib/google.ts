import "server-only";

import { z } from "zod";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_STATE_COOKIE = "aperio_oauth_state";

function clientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || "";
}

function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

export function isGoogleOAuthConfigured() {
  return Boolean(clientId() && clientSecret());
}

/**
 * The single origin the whole OAuth round-trip must run on. Google redirects
 * back to APP_ORIGIN, so the state cookie has to be set on that same host —
 * otherwise the first attempt fails with `google_state` and only the retry
 * (which now starts on APP_ORIGIN) succeeds. Locally APP_ORIGIN is unset and we
 * fall back to the incoming request origin (http://localhost:3000).
 */
export function canonicalOrigin(requestOrigin: string) {
  return (process.env.APP_ORIGIN?.trim() || requestOrigin).replace(/\/+$/, "");
}

/**
 * The redirect URI must exactly match one registered in the Google Cloud console.
 */
export function googleRedirectUri(requestOrigin: string) {
  return `${canonicalOrigin(requestOrigin)}/api/v1/auth/google/callback`;
}

export function buildGoogleAuthUrl(input: { state: string; redirectUri: string }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

const tokenSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().optional(),
  expires_in: z.number().optional(),
});

const profileSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
});

export type GoogleProfile = z.infer<typeof profileSchema>;

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    console.error("Google token exchange failed", response.status, await response.text().catch(() => ""));
    throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  }
  return tokenSchema.parse(await response.json());
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error("Google userinfo request failed", response.status);
    throw new Error("GOOGLE_USERINFO_FAILED");
  }
  return profileSchema.parse(await response.json());
}

export function isGoogleEmailVerified(profile: GoogleProfile) {
  return profile.email_verified === true || profile.email_verified === "true";
}
