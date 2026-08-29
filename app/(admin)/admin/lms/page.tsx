import { CourseManager } from "@/components/admin/course-manager";
import { requireAdminPage } from "@/lib/admin";
import { query } from "@/lib/db";
import { listCourses } from "@/lib/lms";

export const metadata = { title: "Admin · LMS" };

export default async function AdminLmsPage() {
  await requireAdminPage();
  const [courses, skills] = await Promise.all([
    listCourses(),
    query<Record<string, unknown>>(`SELECT id, name, skill_type AS "skillType" FROM skills ORDER BY skill_type, name`),
  ]);
  return <CourseManager initialCourses={courses as never} skills={skills as never} />;
}
