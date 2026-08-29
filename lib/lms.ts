import { randomUUID } from "node:crypto";
import { db, one, query } from "@/lib/db";

export interface CourseLesson {
  id?: string;
  title: string;
  kind: "reading" | "exercise" | "video" | "quiz" | "project";
  content: string;
  resourceUrl: string | null;
  durationMin: number | null;
  position: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: "junior" | "mid" | "senior" | "all";
  track: "technical" | "soft" | "mixed";
  skillIds: string[];
  published: boolean;
  createdBy: string | null;
  updatedAt: string;
  lessons: CourseLesson[];
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || `course-${Date.now()}`;
}

export async function listCourses(opts: { publishedOnly?: boolean } = {}) {
  return query<Record<string, unknown>>(
    `SELECT c.id, c.slug, c.title, c.summary, c.level, c.track, c.skill_ids AS "skillIds", c.published,
      c.updated_at AS "updatedAt",
      (SELECT count(*) FROM course_lessons l WHERE l.course_id=c.id) AS lessons,
      (SELECT count(*) FROM course_enrollments e WHERE e.course_id=c.id) AS enrollments
     FROM courses c
     ${opts.publishedOnly ? "WHERE c.published=true" : ""}
     ORDER BY c.updated_at DESC`,
  );
}

export async function getCourse(id: string): Promise<Course | null> {
  const course = await one<Record<string, unknown>>(
    `SELECT id, slug, title, summary, level, track, skill_ids AS "skillIds", published, created_by AS "createdBy", updated_at AS "updatedAt"
     FROM courses WHERE id=$1`,
    [id],
  );
  if (!course) return null;
  const lessons = await query<Record<string, unknown>>(
    `SELECT id, title, kind, content, resource_url AS "resourceUrl", duration_min AS "durationMin", position
     FROM course_lessons WHERE course_id=$1 ORDER BY position`,
    [id],
  );
  return { ...(course as unknown as Course), lessons: lessons as unknown as CourseLesson[] };
}

export async function saveCourse(
  input: {
    id?: string;
    title: string;
    summary?: string;
    level?: Course["level"];
    track?: Course["track"];
    skillIds?: string[];
    published?: boolean;
    lessons?: CourseLesson[];
  },
  editor: string,
) {
  const id = input.id ?? randomUUID();
  const slug = slugify(input.title);
  const skillIds = (input.skillIds ?? []).filter(Boolean).slice(0, 40);
  const lessons = (input.lessons ?? []).map((l, index) => ({
    id: l.id && /^[a-f0-9-]{36}$/.test(l.id) ? l.id : randomUUID(),
    title: String(l.title || "Untitled lesson").slice(0, 160),
    kind: (["reading", "exercise", "video", "quiz", "project"] as const).includes(l.kind) ? l.kind : "reading",
    content: String(l.content ?? "").slice(0, 20000),
    resourceUrl: l.resourceUrl ? String(l.resourceUrl).slice(0, 500) : null,
    durationMin: l.durationMin ? Math.max(1, Math.min(600, Number(l.durationMin))) : null,
    position: index,
  }));

  const sql = db();
  await sql.transaction((tx) => [
    tx`INSERT INTO courses (id, slug, title, summary, level, track, skill_ids, published, created_by, updated_at)
       VALUES (${id}, ${slug}, ${input.title.slice(0, 160)}, ${(input.summary ?? "").slice(0, 2000)},
         ${input.level ?? "mid"}, ${input.track ?? "technical"}, ${skillIds}, ${input.published ?? false}, ${editor}, now())
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary, level=EXCLUDED.level,
         track=EXCLUDED.track, skill_ids=EXCLUDED.skill_ids, published=EXCLUDED.published, updated_at=now()`,
    tx`DELETE FROM course_lessons WHERE course_id=${id}`,
    ...lessons.map(
      (l) => tx`INSERT INTO course_lessons (id, course_id, title, kind, content, resource_url, duration_min, position)
        VALUES (${l.id}, ${id}, ${l.title}, ${l.kind}, ${l.content}, ${l.resourceUrl}, ${l.durationMin}, ${l.position})`,
    ),
  ]);
  return getCourse(id);
}

export async function deleteCourse(id: string) {
  await query("DELETE FROM courses WHERE id=$1", [id]);
}

// --- user side -----------------------------------------------------------

export async function getRecommendedCourses(userId: string) {
  return query<Record<string, unknown>>(
    `WITH gaps AS (
       SELECT DISTINCT ar.skill_id
       FROM analysis_skill_results ar
       JOIN analyses a ON a.id=ar.analysis_id AND a.user_id=$1
       WHERE ar.classification <> 'strong'
         AND a.created_at = (SELECT max(created_at) FROM analyses WHERE user_id=$1)
     )
     SELECT c.id, c.slug, c.title, c.summary, c.level, c.track,
       (SELECT count(*) FROM course_lessons l WHERE l.course_id=c.id) AS lessons,
       cardinality(ARRAY(SELECT unnest(c.skill_ids) INTERSECT SELECT skill_id FROM gaps)) AS "matchCount",
       EXISTS (SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=$1) AS "enrolled"
     FROM courses c
     WHERE c.published = true
       AND cardinality(ARRAY(SELECT unnest(c.skill_ids) INTERSECT SELECT skill_id FROM gaps)) > 0
     ORDER BY "matchCount" DESC, c.updated_at DESC
     LIMIT 12`,
    [userId],
  );
}

export async function getEnrolledCourses(userId: string) {
  return query<Record<string, unknown>>(
    `SELECT c.id, c.slug, c.title, c.summary, c.track, e.status, e.source, e.enrolled_at AS "enrolledAt",
      (SELECT count(*) FROM course_lessons l WHERE l.course_id=c.id) AS lessons,
      (SELECT count(*) FROM lesson_progress lp WHERE lp.enrollment_id=e.id AND lp.status='completed') AS completed
     FROM course_enrollments e JOIN courses c ON c.id=e.course_id
     WHERE e.user_id=$1 ORDER BY e.enrolled_at DESC`,
    [userId],
  );
}

export async function enrollInCourse(userId: string, courseId: string, source: "self" | "recommended" = "self") {
  const course = await one("SELECT id FROM courses WHERE id=$1 AND published=true", [courseId]);
  if (!course) throw new Error("COURSE_NOT_FOUND");
  await query(
    `INSERT INTO course_enrollments (id, user_id, course_id, source)
     VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, course_id) DO NOTHING`,
    [randomUUID(), userId, courseId, source],
  );
  return getCourseForLearner(userId, courseId);
}

export async function getCourseForLearner(userId: string, courseId: string) {
  const course = await one<Record<string, unknown>>(
    `SELECT c.id, c.slug, c.title, c.summary, c.level, c.track,
       e.id AS "enrollmentId", e.status AS "enrollmentStatus"
     FROM courses c
     LEFT JOIN course_enrollments e ON e.course_id=c.id AND e.user_id=$1
     WHERE c.id=$2 AND c.published=true`,
    [userId, courseId],
  );
  if (!course) return null;
  const lessons = await query<Record<string, unknown>>(
    `SELECT l.id, l.title, l.kind, l.content, l.resource_url AS "resourceUrl", l.duration_min AS "durationMin", l.position,
       COALESCE(lp.status, 'not_started') AS status
     FROM course_lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.enrollment_id=$2
     WHERE l.course_id=$1 ORDER BY l.position`,
    [courseId, course.enrollmentId ?? null],
  );
  return { ...course, lessons };
}

export async function setLessonProgress(userId: string, lessonId: string, status: "not_started" | "in_progress" | "completed") {
  const enrollment = await one<{ id: string }>(
    `SELECT e.id FROM course_enrollments e
     JOIN course_lessons l ON l.course_id=e.course_id
     WHERE l.id=$1 AND e.user_id=$2`,
    [lessonId, userId],
  );
  if (!enrollment) throw new Error("NOT_ENROLLED");
  await query(
    `INSERT INTO lesson_progress (id, enrollment_id, lesson_id, status, updated_at)
     VALUES ($1,$2,$3,$4, now())
     ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET status=EXCLUDED.status, updated_at=now()`,
    [randomUUID(), enrollment.id, lessonId, status],
  );
  // roll enrollment to completed when all lessons are done
  await query(
    `UPDATE course_enrollments e SET status='completed'
     WHERE e.id=$1
       AND NOT EXISTS (
         SELECT 1 FROM course_lessons l
         LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.enrollment_id=e.id
         WHERE l.course_id=e.course_id AND COALESCE(lp.status,'not_started') <> 'completed'
       )`,
    [enrollment.id],
  );
  return { lessonId, status };
}
