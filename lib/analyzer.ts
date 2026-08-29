import { randomUUID } from "node:crypto";
import { db, one, query } from "@/lib/db";
import type { Classification, ExperienceLevel, Importance } from "@/lib/types";

interface RequirementRow extends Record<string, unknown> {
  skillId: string;
  name: string;
  category: string;
  description: string;
  aliases: string[];
  targetLevel: number;
  importance: Importance;
  weight: string;
}

interface ExistingSkillRow extends Record<string, unknown> {
  skillId: string;
  level: number;
  confidence: string;
  evidence: Array<{ quote: string; source: string }>;
  userVerified: boolean;
}

interface ResumeRow extends Record<string, unknown> {
  id: string;
  extractedText: string;
  parsedData: {
    candidateName?: string;
  } | null;
}

interface CareerDiagnostics {
  summary: string;
  confidenceNote: string;
  skillRecommendations: Array<{
    skillId: string;
    recommendation: string;
    whyItMatters: string;
    effort: string;
    phase: number;
  }>;
}

export interface ScoredSkill {
  id: string;
  skillId: string;
  name: string;
  category: string;
  description: string;
  classification: Classification;
  currentLevel: number;
  targetLevel: number;
  confidence: number;
  importance: Importance;
  weight: number;
  evidence: Array<{ quote: string; source: string }>;
  recommendation: string;
  whyItMatters: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sentenceEvidence(text: string, aliases: string[]) {
  const sentences = text.split(/(?<=[.!?\n])\s+/).map((item) => item.trim()).filter(Boolean);
  const patterns = aliases.filter((alias) => alias.length > 1).map((alias) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias.toLowerCase())}([^a-z0-9]|$)`, "i"));
  return sentences.filter((sentence) => patterns.some((pattern) => pattern.test(sentence))).slice(0, 3);
}

export function inferSkill(text: string, aliases: string[]) {
  const evidence = sentenceEvidence(text, aliases);
  if (!evidence.length) return { level: 0, confidence: 0.2, evidence: [] as string[] };
  const combined = evidence.join(" ").toLowerCase();
  const advancedSignals = /\b(architected|led|mentored|scaled|optimized|owned|designed)\b/;
  const workingSignals = /\b(built|developed|implemented|deployed|created|integrated|maintained)\b/;
  const level = advancedSignals.test(combined) ? Math.min(4, 2 + Math.min(evidence.length, 2)) : workingSignals.test(combined) || evidence.length > 1 ? 2 : 1;
  const confidence = Math.min(0.96, 0.62 + evidence.length * 0.1 + (advancedSignals.test(combined) ? 0.08 : 0));
  return { level, confidence, evidence };
}

export function classifySkill(currentLevel: number, targetLevel: number): Classification {
  if (currentLevel >= targetLevel) return "strong";
  if (currentLevel > 0) return "developing";
  return "missing";
}

export function calculateScore(skills: Array<Pick<ScoredSkill, "currentLevel" | "targetLevel" | "weight">>) {
  const possible = skills.reduce((sum, skill) => sum + skill.weight, 0);
  if (!possible) return 0;
  const achieved = skills.reduce((sum, skill) => sum + Math.min(skill.currentLevel / Math.max(skill.targetLevel, 1), 1) * skill.weight, 0);
  return Math.round((achieved / possible) * 100);
}

function recommendation(name: string, current: number, target: number) {
  if (current === 0) return `Build a small, reviewable project that demonstrates ${name}, then add the outcome and evidence to your profile.`;
  return `Deepen ${name} from level ${current} to ${target} through applied practice, feedback, and one production-style example.`;
}

function makeSummary(roleTitle: string, skills: ScoredSkill[]) {
  const strong = skills.filter((item) => item.classification === "strong").slice(0, 3).map((item) => item.name);
  const gaps = skills.filter((item) => item.classification !== "strong").sort((a, b) => b.weight - a.weight).slice(0, 4).map((item) => item.name);
  const foundation = strong.length ? `Your current profile demonstrates a foundation in ${strong.join(", ")}.` : "Your profile does not yet clearly demonstrate the core requirements for this role.";
  const focus = gaps.length ? ` The highest-impact areas to strengthen for ${roleTitle} are ${gaps.join(", ")}.` : ` Your profile currently covers the assessed ${roleTitle} requirements well.`;
  return `${foundation}${focus}`;
}

export async function runAnalysis(userId: string, roleId: string, experienceLevel: ExperienceLevel, resumeId?: string | null) {
  const role = await one<{ id: string; title: string } & Record<string, unknown>>("SELECT id, title FROM roles WHERE id=$1 AND active=true", [roleId]);
  if (!role) throw new Error("ROLE_NOT_FOUND");

  let resumeText = "";
  let candidateName = "";
  if (resumeId) {
    const resume = await one<ResumeRow>(
      `SELECT id, extracted_text AS "extractedText", parsed_data AS "parsedData"
       FROM resumes WHERE id=$1 AND user_id=$2 AND status='processed'`,
      [resumeId, userId],
    );
    if (!resume) throw new Error("RESUME_NOT_FOUND");
    resumeText = resume.extractedText;
    candidateName = resume.parsedData?.candidateName ?? "";
  } else {
    const resume = await one<ResumeRow>(
      `SELECT id, extracted_text AS "extractedText", parsed_data AS "parsedData"
       FROM resumes WHERE user_id=$1 AND status='processed' ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (resume) {
      resumeText = resume.extractedText;
      candidateName = resume.parsedData?.candidateName ?? "";
      resumeId = resume.id;
    }
  }

  const profileParts = await query<{ text: string } & Record<string, unknown>>(
    `SELECT COALESCE(headline,'') || ' ' || COALESCE(bio,'') AS text FROM profiles WHERE user_id=$1
     UNION ALL SELECT COALESCE(name,'') || ' ' || COALESCE(description,'') FROM projects WHERE user_id=$1
     UNION ALL SELECT COALESCE(title,'') || ' ' || COALESCE(company,'') || ' ' || COALESCE(description,'') FROM work_experience WHERE user_id=$1
     UNION ALL SELECT COALESCE(name,'') || ' ' || COALESCE(issuer,'') FROM certifications WHERE user_id=$1`,
    [userId],
  );
  const sourceText = `${resumeText}\n${profileParts.map((part) => part.text).join("\n")}`.trim();
  if (!sourceText) throw new Error("PROFILE_EMPTY");

  const requirements = await query<RequirementRow>(
    `SELECT s.id AS "skillId", s.name, s.category, s.description, s.aliases,
      r.target_level AS "targetLevel", r.importance, r.weight
     FROM role_skill_requirements r JOIN skills s ON s.id=r.skill_id
     WHERE r.role_id=$1 AND r.experience_level=$2 ORDER BY r.weight DESC, s.name`,
    [roleId, experienceLevel],
  );
  if (!requirements.length) throw new Error("ROLE_REQUIREMENTS_MISSING");

  const existing = await query<ExistingSkillRow>(
    `SELECT skill_id AS "skillId", level, confidence, evidence, user_verified AS "userVerified" FROM user_skills WHERE user_id=$1`,
    [userId],
  );
  const bySkill = new Map(existing.map((item) => [item.skillId, item]));

  const scored: ScoredSkill[] = requirements.map((requirement) => {
    const inferred = inferSkill(sourceText, [requirement.name, ...requirement.aliases]);
    const saved = bySkill.get(requirement.skillId);
    const currentLevel = saved?.userVerified ? saved.level : Math.max(saved?.level ?? 0, inferred.level);
    const inferredEvidence = inferred.evidence.map((quote) => ({ quote: quote.slice(0, 360), source: resumeText.includes(quote) ? "Resume" : "Profile" }));
    const evidence = saved?.userVerified && saved.evidence?.length ? saved.evidence : inferredEvidence;
    const confidence = saved?.userVerified ? 1 : Math.max(Number(saved?.confidence ?? 0), inferred.confidence);
    return {
      id: randomUUID(), skillId: requirement.skillId, name: requirement.name, category: requirement.category,
      description: requirement.description, currentLevel, targetLevel: requirement.targetLevel,
      confidence, importance: requirement.importance, weight: Number(requirement.weight),
      classification: classifySkill(currentLevel, requirement.targetLevel), evidence,
      recommendation: recommendation(requirement.name, currentLevel, requirement.targetLevel),
      whyItMatters: requirement.description,
    };
  });

  const score = calculateScore(scored);
  const matched = scored.filter((item) => item.classification === "strong").length;
  const developing = scored.filter((item) => item.classification === "developing").length;
  const missing = scored.filter((item) => item.classification === "missing").length;
  const analysisId = randomUUID();
  const roadmapId = randomUUID();
  let summary = makeSummary(role.title, scored);
  let diagnostics: CareerDiagnostics | null = null;
  const gemini = await import("@/lib/gemini");
  if (gemini.isGeminiConfigured()) {
    try {
      diagnostics = await gemini.generateCareerDiagnostics({
        candidateName,
        roleTitle: role.title,
        experienceLevel,
        overallScore: score,
        skills: scored.map((item) => ({
          skillId: item.skillId,
          name: item.name,
          category: item.category,
          classification: item.classification,
          currentLevel: item.currentLevel,
          targetLevel: item.targetLevel,
          importance: item.importance,
          evidence: item.evidence,
        })),
      });
      summary = `${diagnostics.summary} ${diagnostics.confidenceNote}`.trim();
    } catch (error) {
      console.error("Gemini career diagnostics were unavailable; using deterministic guidance", error instanceof Error ? error.message : "unknown error");
    }
  }

  const guidanceBySkill = new Map(diagnostics?.skillRecommendations.map((item) => [item.skillId, item]) ?? []);
  for (const item of scored) {
    const guidance = guidanceBySkill.get(item.skillId);
    if (!guidance) continue;
    item.recommendation = guidance.recommendation;
    item.whyItMatters = guidance.whyItMatters;
  }
  const roadmapSkills = scored.filter((item) => item.classification !== "strong").sort((a, b) => b.weight - a.weight).slice(0, 9);

  const sql = db();
  await sql.transaction((tx) => [
    tx`INSERT INTO analyses (id,user_id,role_id,resume_id,experience_level,overall_score,summary,matched_count,developing_count,missing_count)
       VALUES (${analysisId},${userId},${roleId},${resumeId ?? null},${experienceLevel},${score},${summary},${matched},${developing},${missing})`,
    ...scored.map((item) => tx`INSERT INTO analysis_skill_results
      (id,analysis_id,skill_id,classification,current_level,target_level,confidence,importance,evidence,recommendation,why_it_matters)
      VALUES (${item.id},${analysisId},${item.skillId},${item.classification},${item.currentLevel},${item.targetLevel},${item.confidence},${item.importance},${JSON.stringify(item.evidence)}::jsonb,${item.recommendation},${item.whyItMatters})`),
    tx`INSERT INTO roadmaps (id,user_id,analysis_id,title) VALUES (${roadmapId},${userId},${analysisId},${`${role.title} readiness roadmap`})`,
    ...roadmapSkills.map((item, index) => {
      const guidance = guidanceBySkill.get(item.skillId);
      return tx`INSERT INTO roadmap_items
      (id,roadmap_id,skill_id,phase,priority,effort,status,recommended_action,why_it_matters,position)
      VALUES (${randomUUID()},${roadmapId},${item.skillId},${guidance?.phase ?? Math.min(3, Math.floor(index / 3) + 1)},${item.importance},${guidance?.effort ?? (item.currentLevel === 0 ? "Focused foundation" : "Applied practice")},'not_started',${item.recommendation},${item.whyItMatters},${index})`;
    }),
    tx`UPDATE profiles SET target_role_id=${roleId}, target_level=${experienceLevel}, onboarding_completed=true, updated_at=now() WHERE user_id=${userId}`,
  ]);

  return { id: analysisId, overallScore: score, matchedCount: matched, developingCount: developing, missingCount: missing, summary };
}
