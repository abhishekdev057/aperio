import { z } from "zod";
import { experienceLevels, skillLevels } from "@/lib/types";

export const idSchema = z.string().min(2).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const experienceLevelSchema = z.enum(experienceLevels);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(10, "Use at least 10 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  headline: z.string().trim().max(140).optional().nullable(),
  currentStatus: z.enum(["student", "fresher", "professional", "career_switcher"]).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  yearsExperience: z.number().min(0).max(60).optional().nullable(),
  targetRoleId: idSchema.optional().nullable(),
  targetLevel: experienceLevelSchema.optional().nullable(),
  onboardingCompleted: z.boolean().optional(),
});

export const analysisSchema = z.object({
  roleId: idSchema,
  experienceLevel: experienceLevelSchema,
  resumeId: idSchema.optional().nullable(),
});

export const userSkillSchema = z.object({
  level: z.enum(skillLevels),
  userVerified: z.boolean().default(true),
});

export const roadmapItemSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed"]),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
