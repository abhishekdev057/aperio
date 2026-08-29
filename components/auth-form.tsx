"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
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
  return <form onSubmit={submit} className="space-y-5">
    {mode === "register" && <label className="block"><span className="mb-2 block text-sm font-medium">Full name</span><Input name="fullName" autoComplete="name" required placeholder="Your name" /></label>}
    <label className="block"><span className="mb-2 block text-sm font-medium">Email</span><Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
    <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><Input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 10 : 1} required placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
    {error && <div role="alert" className="rounded-[10px] border border-[color-mix(in_srgb,var(--critical)_35%,var(--border))] bg-[var(--critical-soft)] px-3.5 py-3 text-sm text-[var(--critical)]">{error}</div>}
    <Button className="w-full" size="lg" disabled={loading}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <>{mode === "register" ? "Create account" : "Sign in"}<ArrowRight size={16} /></>}</Button>
    <p className="text-center text-sm text-[var(--muted)]">{mode === "register" ? "Already have an account?" : "New to Aperio?"} <Link href={mode === "register" ? "/login" : "/register"} className="font-semibold text-[var(--primary)] hover:underline">{mode === "register" ? "Sign in" : "Create an account"}</Link></p>
  </form>;
}
