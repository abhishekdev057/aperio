import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <><p className="text-sm font-semibold text-[var(--primary)]">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Sign in to your workspace</h1><p className="mb-8 mt-3 text-sm leading-6 text-[var(--muted)]">Continue tracking your role readiness and learning progress.</p><AuthForm mode="login" oauthError={error} /></>;
}
