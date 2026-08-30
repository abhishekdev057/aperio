"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  FileCheck2,
  FileSearch,
  Fingerprint,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExperienceLevel, RoleSummary } from "@/lib/types";

export type Resume = {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  status: string;
  documentType?: string | null;
  validationConfidence?: number | string | null;
  processingProvider?: string | null;
  candidateName?: string | null;
  skillsDetected?: number;
  warnings?: string[];
  createdAt: string;
};

const analysisStages = [
  { label: "Reading resume", detail: "Understanding visible experience", icon: FileSearch },
  { label: "Verifying evidence", detail: "Checking sources and confidence", icon: Fingerprint },
  { label: "Mapping skills", detail: "Structuring demonstrated capabilities", icon: BrainCircuit },
  { label: "Comparing role", detail: "Aligning evidence with expectations", icon: ShieldCheck },
];

const uploadStages = [
  "Verifying file and document structure",
  "Reading text, layout, and visual signals",
  "Extracting skills and supporting evidence",
];

function confidenceLabel(value?: number | string | null) {
  const score = Number(value ?? 0);
  if (!score) return "Verified resume";
  return `${Math.round(score * 100)}% document confidence`;
}

export function AnalysisWorkbench({ roles, initialResumes, initialRoleId }: { roles: RoleSummary[]; initialResumes: Resume[]; initialRoleId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [roleId, setRoleId] = useState(initialRoleId && roles.some((role) => role.id === initialRoleId) ? initialRoleId : roles[0]?.id ?? "");
  const [level, setLevel] = useState<ExperienceLevel>("mid");
  const [resumes, setResumes] = useState(initialResumes);
  const [resumeId, setResumeId] = useState(initialResumes[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!analyzing) return;
    const timer = window.setInterval(() => setStage((value) => Math.min(analysisStages.length - 1, value + 1)), 1500);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  useEffect(() => {
    if (!uploading) return;
    const timer = window.setInterval(() => setUploadStage((value) => (value + 1) % uploadStages.length), 1500);
    return () => window.clearInterval(timer);
  }, [uploading]);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setUploadStage(0);
    setError("");
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/v1/resumes", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Resume could not be processed.");
      const uploaded = { ...json.data, createdAt: new Date().toISOString() } as Resume;
      setResumes((items) => [uploaded, ...items]);
      setResumeId(uploaded.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume could not be processed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function analyze() {
    if (!roleId) return setError("Choose a target role.");
    setAnalyzing(true);
    setStage(0);
    setError("");
    try {
      const response = await fetch("/api/v1/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleId, experienceLevel: level, resumeId: resumeId || null }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Analysis failed.");
      router.push(`/history/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setAnalyzing(false);
    }
  }

  const selected = resumes.find((resume) => resume.id === resumeId);
  const selectedRole = roles.find((role) => role.id === roleId);

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#202b3b] bg-[#09101a] text-[#f5f7fb] shadow-[0_24px_70px_rgb(5_9_18/22%)]">
      <div className="grid gap-3 border-b border-white/8 bg-[#0b121d] p-4 md:grid-cols-[1fr_auto] md:items-center lg:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_310px]">
          <label className="relative block"><span className="sr-only">Career role</span><FileSearch size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d98aa]" /><select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="h-12 w-full appearance-none rounded-[11px] border border-[#2a3647] bg-[#0e1723] pl-11 pr-10 text-sm font-semibold text-white outline-none transition focus:border-[#7467f3]"><option value="" disabled>Choose a career role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8d98aa]" /></label>
          <fieldset><legend className="sr-only">Experience target</legend><div className="grid h-12 grid-cols-3 rounded-[11px] border border-[#2a3647] bg-[#0e1723] p-1">{(["junior", "mid", "senior"] as const).map((item) => <button type="button" key={item} onClick={() => setLevel(item)} aria-pressed={level === item} className={cn("rounded-[8px] text-xs font-semibold capitalize transition-all", level === item ? "bg-[#5146e8] text-white shadow-lg" : "text-[#8d98aa] hover:text-white")}>{item}</button>)}</div></fieldset>
        </div>
        <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#7f8ba0]">Target context</p><p className="mt-1 text-xs font-semibold">{selectedRole?.title ?? "Choose a role"} · <span className="capitalize">{level}</span></p></div>
      </div>

      <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} />

      {selected && !uploading ? <div className="grid gap-3 border-b border-white/8 bg-[#0c1520] p-4 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,.55fr))] md:items-center lg:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-white/6 text-[#7b70ff]"><FileCheck2 size={18} /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{selected.filename}</span><span className="mt-1 block text-[10px] text-[#8995a8]">{(selected.fileSize / 1024).toFixed(0)} KB · {selected.candidateName || "Verified candidate"}</span></span><button type="button" onClick={() => setResumeId("")} className="ml-auto grid size-8 place-items-center rounded-lg text-[#7f8ba0] transition hover:bg-white/6 hover:text-white" aria-label="Remove selected resume"><X size={14} /></button></div>
        <EvidenceMetric icon={ShieldCheck} title="Resume verified" detail={confidenceLabel(selected.validationConfidence)} tone="positive" />
        <EvidenceMetric icon={ScanLine} title="OCR ready" detail="Text and layout extracted" />
        <EvidenceMetric icon={ImageIcon} title="Image support" detail="Scanned pages supported" />
      </div> : null}

      <div className="relative min-h-[480px] overflow-hidden p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_40%,rgb(79_70_229/14%),transparent_34%)]" />
        {uploading ? <UploadProcessing stage={uploadStage} /> : analyzing ? <AnalysisProcessing stage={stage} role={selectedRole?.title} filename={selected?.filename} /> : selected ? <ReadyWorkspace selected={selected} onReplace={() => inputRef.current?.click()} /> : <ResumeDropzone onChoose={() => inputRef.current?.click()} onDrop={upload} />}
      </div>

      <div className="border-t border-white/8 bg-[#0b121d] p-4 sm:p-5">
        <div className="mx-auto max-w-xl"><Button onClick={analyze} size="lg" className="h-12 w-full rounded-[11px] bg-gradient-to-r from-[#5548e9] to-[#4f46e5] text-white shadow-[0_14px_34px_rgb(62_50_220/28%)] hover:from-[#6559f3] hover:to-[#5a51eb]" disabled={!roleId || uploading || analyzing}><Sparkles size={17} />Analyze skill gap <ArrowRight size={16} className="ml-auto" /></Button><p className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] text-[#7f8ba0]"><LockKeyhole size={11} />Evidence is processed securely and remains under your control.</p>{error && <div role="alert" className="mt-4 rounded-[10px] border border-[#71363c] bg-[#321a20] p-3 text-xs text-[#ff9aa0]">{error}</div>}</div>
      </div>

      {resumes.length > 1 && !uploading && !analyzing && <div className="border-t border-white/8 bg-[#0b121d] px-5 py-3"><label className="mx-auto flex max-w-xl items-center gap-3"><span className="text-[10px] font-semibold text-[#8995a8]">Use previous resume</span><select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="h-8 min-w-0 flex-1 rounded-[8px] border border-[#2a3647] bg-[#0e1723] px-2 text-[10px] text-white"><option value="">Use profile only</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.filename}</option>)}</select></label></div>}
    </section>
  );
}

function EvidenceMetric({ icon: Icon, title, detail, tone }: { icon: typeof ShieldCheck; title: string; detail: string; tone?: "positive" }) {
  return <div className="flex items-center gap-2.5"><span className={cn("grid size-8 shrink-0 place-items-center rounded-[8px] bg-white/5", tone === "positive" ? "text-[#45d68b]" : "text-[#8b83ff]")}><Icon size={15} /></span><span className="min-w-0"><span className={cn("block truncate text-[10px] font-semibold", tone === "positive" && "text-[#45d68b]")}>{title}</span><span className="mt-0.5 block truncate text-[9px] text-[#7f8ba0]">{detail}</span></span></div>;
}

function ResumeDropzone({ onChoose, onDrop }: { onChoose: () => void; onDrop: (file?: File) => void }) {
  return <button type="button" onClick={onChoose} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onDrop(event.dataTransfer.files?.[0]); }} className="relative mx-auto flex min-h-[420px] w-full max-w-3xl flex-col items-center justify-center rounded-[18px] border border-dashed border-[#344256] bg-[#0d1621]/70 px-6 text-center transition hover:border-[#7467f3] hover:bg-[#10192a]"><span className="grid size-14 place-items-center rounded-[16px] bg-[#1b1d42] text-[#8c84ff]"><UploadCloud size={24} /></span><h2 className="mt-5 text-lg font-semibold">Add your current resume</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#8995a8]">Drop a PDF, DOCX, JPG, PNG, or WebP here, or click to browse. Up to 5 MB.</p><span className="mt-5 inline-flex items-center gap-2 rounded-[8px] border border-white/7 bg-white/4 px-3 py-2 text-[10px] text-[#a9b3c2]"><ScanLine size={13} />OCR and image-based resumes supported</span></button>;
}

function ReadyWorkspace({ selected, onReplace }: { selected: Resume; onReplace: () => void }) {
  return <div className="relative mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[.76fr_1.24fr]">
    <div className="relative mx-auto w-full max-w-[310px]"><div className="absolute -inset-5 rounded-[28px] bg-[#5146e8]/10 blur-2xl" /><div className="relative aspect-[.76] rounded-[14px] border border-[#344256] bg-[#101a26] p-5 shadow-2xl"><div className="flex items-center gap-2 border-b border-white/8 pb-4"><FileCheck2 size={16} className="text-[#45d68b]" /><span className="max-w-[210px] truncate text-[10px] font-semibold">{selected.filename}</span></div><div className="mt-5 space-y-3">{[88, 72, 93, 65, 84, 58, 76, 46].map((width, index) => <span key={index} className="block h-1.5 rounded-full bg-[#293546]" style={{ width: `${width}%` }} />)}</div><div className="absolute inset-x-5 top-[46%] h-px bg-[#7467f3] shadow-[0_0_16px_#7467f3]" /><ScanLine size={22} className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-[#8c84ff]" /></div></div>
    <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8177ff]">Ready to assess</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">Your evidence is structured and ready.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#8995a8]">Aperio will compare only verified resume and profile evidence with stored role requirements. Skill classifications remain explainable and correctable.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><TrustPoint icon={Fingerprint} title="Evidence-linked" detail="Every inferred skill keeps its source." /><TrustPoint icon={ShieldCheck} title="Constructive guidance" detail="Gaps mean not demonstrated—not inability." /></div><button type="button" onClick={onReplace} className="mt-6 text-xs font-semibold text-[#8c84ff]">Replace resume</button></div>
  </div>;
}

function TrustPoint({ icon: Icon, title, detail }: { icon: typeof ShieldCheck; title: string; detail: string }) {
  return <div className="rounded-[12px] border border-white/8 bg-white/[.025] p-4"><Icon size={16} className="text-[#8177ff]" /><p className="mt-3 text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#7f8ba0]">{detail}</p></div>;
}

function UploadProcessing({ stage }: { stage: number }) {
  return <div className="relative mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center text-center"><span className="grid size-16 place-items-center rounded-[18px] bg-[#1b1d42] text-[#8c84ff]"><ScanLine size={28} className="animate-pulse" /></span><h2 className="mt-6 text-xl font-semibold">Verifying your document</h2><p className="mt-2 text-xs text-[#8995a8]">Gemini is checking that the file is a real resume and extracting visible evidence.</p><div className="mt-8 w-full max-w-md space-y-2">{uploadStages.map((label, index) => <div key={label} className={cn("flex items-center gap-3 rounded-[10px] border px-4 py-3 text-left text-xs transition", index === stage ? "border-[#5b50f2] bg-[#161b36] text-white" : "border-white/6 text-[#718096]")}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full", index === stage ? "bg-[#5146e8] text-white" : "bg-white/5")}>{index === stage ? <LoaderCircle size={13} className="animate-spin" /> : index + 1}</span>{label}</div>)}</div></div>;
}

function AnalysisProcessing({ stage, role, filename }: { stage: number; role?: string; filename?: string }) {
  return <div className="relative mx-auto min-h-[420px] max-w-5xl"><div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center"><div className="rounded-[16px] border border-white/8 bg-[#0d1722] p-5"><div className="flex items-center gap-2 border-b border-white/8 pb-4"><FileSearch size={15} className="text-[#8177ff]" /><span className="truncate text-[10px] font-semibold">{filename || "Profile evidence"}</span></div><div className="mt-5 space-y-3">{[88, 72, 93, 61, 84, 69, 76].map((width, index) => <div key={index} className="flex items-center gap-3"><span className="h-1.5 rounded-full bg-[#273447]" style={{ width: `${width}%` }} />{index <= stage && <span className="size-1.5 rounded-full bg-[#8177ff] shadow-[0_0_10px_#8177ff]" />}</div>)}</div></div><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8177ff]">Analysis in progress</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">Building your {role || "role"} readiness map</h2><div className="mt-7 space-y-3">{analysisStages.map(({ label, detail, icon: Icon }, index) => <div key={label} className={cn("flex items-center gap-3 rounded-[11px] border px-4 py-3.5 transition", index === stage ? "border-[#5b50f2] bg-[#161b36]" : index < stage ? "border-[#24523e] bg-[#10251e]" : "border-white/6")}><span className={cn("grid size-8 shrink-0 place-items-center rounded-full", index < stage ? "bg-[#2cb879] text-white" : index === stage ? "bg-[#5146e8] text-white" : "bg-white/5 text-[#718096]")}>{index < stage ? <Check size={14} /> : index === stage ? <LoaderCircle size={14} className="animate-spin" /> : <Icon size={14} />}</span><span><span className="block text-xs font-semibold">{label}</span><span className="mt-1 block text-[10px] text-[#7f8ba0]">{detail}</span></span></div>)}</div></div></div><p className="mt-8 text-center text-[10px] text-[#718096]">No fake completion percentage or guaranteed outcome.</p></div>;
}
