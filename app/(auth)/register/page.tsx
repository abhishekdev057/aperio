import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Create account" };
export default function RegisterPage() { return <><p className="text-sm font-semibold text-[var(--primary)]">Start with your evidence</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Create your Aperio account</h1><p className="mb-8 mt-3 text-sm leading-6 text-[var(--muted)]">Your workspace starts clean. Add your own profile or resume to generate results.</p><AuthForm mode="register" /></>; }
