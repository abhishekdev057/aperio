import { notFound } from "next/navigation";
import { AnalysisReport } from "@/components/analysis-report";
import { requirePageUser } from "@/lib/auth";
import { getAnalysisReport } from "@/lib/reports";
export default async function ReportPage({params}:{params:Promise<{id:string}>}){const user=await requirePageUser();const report=await getAnalysisReport(user.id,(await params).id);if(!report)notFound();return <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-10 lg:py-10"><div><p className="text-sm font-semibold text-[var(--primary)]">Persisted report</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">{report.roleTitle} analysis</h1><p className="mt-3 text-sm text-[var(--muted)]">This report preserves the score, evidence, and recommendations from when it was created.</p></div><div className="mt-8"><AnalysisReport report={report}/></div></div>;}
