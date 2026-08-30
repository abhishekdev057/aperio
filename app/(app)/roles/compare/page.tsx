import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { RoleComparison, type ComparisonData, type RoleHistoryItem } from "@/components/role-comparison";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";
import { getAnalysisHistory, getAnalysisReport } from "@/lib/reports";

export const metadata = { title: "Compare roles" };

export default async function ComparePage() {
  const user = await requirePageUser();
  const rawHistory = await getAnalysisHistory(user.id, 50) as unknown as RoleHistoryItem[];
  const uniqueHistory = Array.from(new Map(rawHistory.map((item) => [item.roleSlug, item])).values());
  const leftItem = uniqueHistory[0];
  const rightItem = uniqueHistory[1];
  const [left, right] = leftItem && rightItem ? await Promise.all([getAnalysisReport(user.id, leftItem.id), getAnalysisReport(user.id, rightItem.id)]) : [null, null];

  let initialData: ComparisonData | null = null;
  if (left && right) {
    const leftNames = new Set(left.skills.filter((item) => item.classification === "strong").map((item) => item.name));
    const rightNames = new Set(right.skills.filter((item) => item.classification === "strong").map((item) => item.name));
    initialData = {
      left,
      right,
      sharedSkills: [...leftNames].filter((name) => rightNames.has(name)),
      leftGaps: left.skills.filter((item) => item.classification !== "strong").slice(0, 5).map((item) => item.name),
      rightGaps: right.skills.filter((item) => item.classification !== "strong").slice(0, 5).map((item) => item.name),
    };
  }

  return <div className="aperio-page">
    <div className="max-w-2xl">
      <p className="aperio-eyebrow text-[var(--primary)]"><GitCompareArrows size={14} />Career decision workspace</p>
      <h1 className="aperio-page-title mt-3">Compare role readiness</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">See where your evidence overlaps, which gaps are role-specific, and what each direction asks you to strengthen next.</p>
    </div>
    <div className="mt-7">{initialData ? <RoleComparison history={uniqueHistory} initialData={initialData} /> : <section className="aperio-panel px-6 py-16 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]"><GitCompareArrows size={21} /></span><h2 className="mt-5 text-lg font-semibold">Two different roles are needed</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Complete a real analysis for at least two career roles. Both saved reports will remain available for comparison.</p><Button asChild className="mt-6"><Link href="/analyze">Analyze another role <ArrowRight size={15} /></Link></Button></section>}</div>
  </div>;
}
