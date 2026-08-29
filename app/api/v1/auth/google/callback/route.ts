import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db, one, query } from "@/lib/db";
import {
  OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleRedirectUri,
  isGoogleEmailVerified,
  isGoogleOAuthConfigured,
} from "@/lib/google";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (path: string) => NextResponse.redirect(new URL(path, process.env.APP_ORIGIN?.trim() || url.origin));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });

  if (!isGoogleOAuthConfigured()) return back("/login?error=google_unavailable");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return back("/login?error=google_denied");
  if (!code || !state || !expectedState || state !== expectedState) return back("/login?error=google_state");

  try {
    const redirectUri = googleRedirectUri(url.origin);
    const token = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(token.access_token);
    if (!isGoogleEmailVerified(profile)) return back("/login?error=google_unverified");

    const email = profile.email.toLowerCase();
    const fullName = (profile.name?.trim() || email.split("@")[0]).slice(0, 80);
    const picture = profile.picture ?? null;

    let userId: string;
    let isNewUser = false;

    const byGoogleId = await one<{ id: string }>("SELECT id FROM users WHERE google_id=$1", [profile.sub]);
    if (byGoogleId) {
      userId = byGoogleId.id;
      await query("UPDATE users SET avatar_url=COALESCE($1,avatar_url), updated_at=now() WHERE id=$2", [picture, userId]);
    } else {
      const byEmail = await one<{ id: string }>("SELECT id FROM users WHERE email=$1", [email]);
      if (byEmail) {
        userId = byEmail.id;
        await query(
          "UPDATE users SET google_id=$1, avatar_url=COALESCE($2,avatar_url), updated_at=now() WHERE id=$3",
          [profile.sub, picture, userId],
        );
      } else {
        userId = randomUUID();
        isNewUser = true;
        const sql = db();
        await sql.transaction((tx) => [
          tx`INSERT INTO users (id,email,full_name,google_id,avatar_url,auth_provider)
             VALUES (${userId},${email},${fullName},${profile.sub},${picture},'google')`,
          tx`INSERT INTO profiles (user_id) VALUES (${userId})`,
          tx`INSERT INTO preferences (user_id) VALUES (${userId})`,
        ]);
      }
    }

    await createSession(userId);
    return back(isNewUser ? "/onboarding" : "/overview");
  } catch (error) {
    console.error("Google OAuth callback failed", error instanceof Error ? error.message : "unknown error");
    return back("/login?error=google_failed");
  }
}
