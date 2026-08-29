import { CoursesView } from "@/components/courses-view";
import { requirePageUser } from "@/lib/auth";
import { getEnrolledCourses, getRecommendedCourses } from "@/lib/lms";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const user = await requirePageUser();
  const [recommended, enrolled] = await Promise.all([
    getRecommendedCourses(user.id),
    getEnrolledCourses(user.id),
  ]);
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 lg:px-10 lg:py-10">
      <CoursesView initial={{ recommended: recommended as never, enrolled: enrolled as never }} />
    </div>
  );
}
