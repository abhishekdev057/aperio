import { SkillProfile } from "@/components/skill-profile";
import { requirePageUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const metadata = { title: "Skill Profile" };

export default async function SkillsPage() {
  const user = await requirePageUser();
  const skills = await query<Record<string, unknown>>(`SELECT s.id,s.name,s.category,s.description,us.level,us.source,us.user_verified AS "userVerified" FROM skills s LEFT JOIN user_skills us ON us.skill_id=s.id AND us.user_id=$1 ORDER BY s.category,s.name`, [user.id]);
  return <div className="aperio-page"><header className="max-w-3xl"><p className="aperio-eyebrow">Correctable intelligence</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-[38px]">Your evidence-backed capability map.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Explore your skill families, review inferred levels, and correct anything that does not reflect your current experience.</p></header><div className="mt-7"><SkillProfile skills={skills as unknown as never[]} /></div></div>;
}
