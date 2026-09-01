import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  canonicalOrigin,
  googleRedirectUri,
  isGoogleOAuthConfigured,
  issueOAuthState,
} from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const canonical = canonicalOrigin(url.origin);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", canonical));
  }

  // Google always redirects back to `canonical` (APP_ORIGIN), so build the whole
  // flow on that host. If the user started somewhere else (a preview URL, a bare
  // deployment URL, www vs apex), bounce to the canonical host first so the
  // redirect_uri we hand Google matches the one it's registered with.
  if (url.origin !== canonical && url.searchParams.get("canonical") !== "1") {
    const bounce = new URL("/api/v1/auth/google", canonical);
    bounce.searchParams.set("canonical", "1");
    return NextResponse.redirect(bounce);
  }

  // `state` is signed and self-validating (see lib/google.ts). The cookie is a
  // best-effort second factor — the flow no longer breaks if it doesn't survive
  // the round trip to Google.
  const { state, nonce } = issueOAuthState();
  const response = NextResponse.redirect(
    buildGoogleAuthUrl({ state, redirectUri: googleRedirectUri(canonical) }),
  );
  response.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  response.headers.set("cache-control", "no-store");
  return response;
}
