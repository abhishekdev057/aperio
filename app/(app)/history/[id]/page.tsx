import { notFound } from "next/navigation";
import { AnalysisReport } from "@/components/analysis-report";
import { AnalysisFollowups } from "@/components/analysis-followups";
import { MarketOutlook } from "@/components/market-outlook";
import { requirePageUser } from "@/lib/auth";
import { getMarketOutlook, getRoleLeverage } from "@/lib/market";
import { getAnalysisReport } from "@/lib/reports";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const report = await getAnalysisReport(user.id, (await params).id);
  if (!report) notFound();
  const leverage = await getRoleLeverage(report.roleId, report.experienceLevel);
  const outlook = await getMarketOutlook(leverage.map((item) => item.skillId));
  return (
    <div className="aperio-page mx-auto max-w-[1280px]">
      <div>
        <p className="aperio-eyebrow text-[var(--primary)]">Persisted report</p>
        <h1 className="aperio-page-title mt-3">{report.roleTitle} analysis</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">This report preserves the score, evidence, and recommendations from when it was created.</p>
      </div>
      <div className="mt-7">
        <AnalysisReport report={report} />
        <AnalysisFollowups analysisId={report.id} />
        <MarketOutlook leverage={leverage} outlook={outlook} />
      </div>
    </div>
  );
}
