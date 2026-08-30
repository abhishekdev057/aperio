import { Sparkles } from "lucide-react";
import { AnalysisWorkbench, type Resume } from "@/components/analysis-workbench";
import { requirePageUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getRoles } from "@/lib/reports";

export const metadata = { title: "Analyze" };

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await requirePageUser();
  const queryParams = await searchParams;
  const [roles, resumes] = await Promise.all([
    getRoles(user.id),
    query<Resume & Record<string, unknown>>(`SELECT id,filename,mime_type AS "mimeType",file_size AS "fileSize",status,
      document_type AS "documentType",validation_confidence AS "validationConfidence",
      processing_provider AS "processingProvider",processing_warnings AS warnings,
      parsed_data->>'candidateName' AS "candidateName",
      jsonb_array_length(COALESCE(parsed_data->'skills','[]'::jsonb)) AS "skillsDetected",
      created_at AS "createdAt" FROM resumes WHERE user_id=$1 ORDER BY created_at DESC`, [user.id]),
  ]);

  return (
    <div className="aperio-page">
      <header className="max-w-3xl">
        <p className="aperio-eyebrow flex items-center gap-2"><Sparkles size={12} />Evidence intelligence</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-[38px]">Turn your resume into a clear next move.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Choose a role, verify your resume, and let Aperio map visible evidence to stored expectations—without guessing what you know.</p>
      </header>
      <div className="mt-7"><AnalysisWorkbench roles={roles} initialRoleId={queryParams.role} initialResumes={resumes} /></div>
    </div>
  );
}
