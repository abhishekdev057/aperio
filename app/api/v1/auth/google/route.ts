import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  canonicalOrigin,
  googleRedirectUri,
  isGoogleOAuthConfigured,
} from "@/lib/google";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const canonical = canonicalOrigin(url.origin);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", canonical));
  }

  // Google always redirects back to `canonical` (APP_ORIGIN). The OAuth state
  // cookie must therefore be set on that exact host. If the user started the
  // flow on any other host (a preview URL, a bare deployment URL, www vs apex,
  // a custom domain), bounce to the canonical host first and set the cookie
  // there — otherwise the callback can't see the cookie and the first attempt
  // always fails with `google_state`, "fixing itself" only on the retry.
  if (url.origin !== canonical && url.searchParams.get("canonical") !== "1") {
    const bounce = new URL("/api/v1/auth/google", canonical);
    bounce.searchParams.set("canonical", "1");
    return NextResponse.redirect(bounce);
  }

  const state = randomBytes(16).toString("base64url");
  const response = NextResponse.redirect(
    buildGoogleAuthUrl({ state, redirectUri: googleRedirectUri(canonical) }),
  );
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
