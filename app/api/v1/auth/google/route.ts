import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, buildGoogleAuthUrl, googleRedirectUri, isGoogleOAuthConfigured } from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", origin));
  }

  const state = randomBytes(16).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildGoogleAuthUrl({ state, redirectUri: googleRedirectUri(origin) }));
}
