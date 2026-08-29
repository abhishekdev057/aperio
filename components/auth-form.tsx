"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const oauthErrors: Record<string, string> = {
  google_unavailable: "Google sign-in is not configured yet. Use email and password for now.",
  google_denied: "Google sign-in was cancelled.",
  google_state: "That Google sign-in attempt expired. Please try again.",
  google_unverified: "Your Google account email is not verified.",
  google_failed: "We could not complete Google sign-in. Please try again.",
};

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z" />
      <path fill="#34A853" d="M12 24c3.12 0 5.74-1.03 7.65-2.8l-3.73-2.89c-1.03.7-2.36 1.11-3.92 1.11-3.01 0-5.56-2.03-6.47-4.77H1.68v3c1.9 3.78 5.8 6.35 10.32 6.35Z" />
      <path fill="#FBBC05" d="M5.53 14.65a7.2 7.2 0 0 1 0-4.6v-3H1.68a12 12 0 0 0 0 10.6l3.85-3Z" />
      <path fill="#EA4335" d="M12 4.75c1.7 0 3.22.58 4.42 1.72l3.31-3.31C17.74 1.2 15.12 0 12 0 7.48 0 3.58 2.57 1.68 6.35l3.85 3C6.44 6.78 8.99 4.75 12 4.75Z" />
    </svg>
  );
}

export function AuthForm({ mode, oauthError }: { mode: "login" | "register"; oauthError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(oauthError ? oauthErrors[oauthError] ?? "Sign-in failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/v1/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Unable to continue.");
      router.push(mode === "register" ? "/onboarding" : "/overview"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue."); }
    finally { setLoading(false); }
  }
  return <div className="space-y-5">
    <a href="/api/v1/auth/google" className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border bg-[var(--surface)] text-sm font-semibold transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]">
      <GoogleGlyph />{mode === "register" ? "Sign up with Google" : "Continue with Google"}
    </a>
    <div className="flex items-center gap-3 text-xs text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--border)]" />or use email<span className="h-px flex-1 bg-[var(--border)]" /></div>
    <form onSubmit={submit} className="space-y-5">
      {mode === "register" && <label className="block"><span className="mb-2 block text-sm font-medium">Full name</span><Input name="fullName" autoComplete="name" required placeholder="Your name" /></label>}
      <label className="block"><span className="mb-2 block text-sm font-medium">Email</span><Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><Input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
      {error && <div role="alert" className="rounded-[10px] border border-[color-mix(in_srgb,var(--critical)_35%,var(--border))] bg-[var(--critical-soft)] px-3.5 py-3 text-sm text-[var(--critical)]">{error}</div>}
      <Button className="w-full" size="lg" disabled={loading}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <>{mode === "register" ? "Create account" : "Sign in"}<ArrowRight size={16} /></>}</Button>
      <p className="text-center text-sm text-[var(--muted)]">{mode === "register" ? "Already have an account?" : "New to Aperio?"} <Link href={mode === "register" ? "/login" : "/register"} className="font-semibold text-[var(--primary)] hover:underline">{mode === "register" ? "Sign in" : "Create an account"}</Link></p>
    </form>
  </div>;
}
