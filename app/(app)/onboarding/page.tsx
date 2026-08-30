import { OnboardingForm } from "@/components/onboarding-form";
import { getRoles } from "@/lib/reports";

export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const roles = await getRoles();
  return <div className="aperio-page mx-auto max-w-[1120px]"><div className="mb-7 max-w-2xl"><p className="aperio-eyebrow text-[var(--primary)]">Welcome to Aperio</p><h1 className="aperio-page-title mt-3">Let’s understand where you are and where you want to go.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Set your starting context in a few focused choices. You can change every detail later.</p></div><OnboardingForm roles={roles} /></div>;
}
