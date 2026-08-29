import { QuestionSetManager } from "@/components/admin/question-set-manager";
import { requireAdminPage } from "@/lib/admin";
import { listQuestionSets } from "@/lib/quiz-bank";

export const metadata = { title: "Admin · Practice sets" };

export default async function AdminPracticeSetsPage() {
  await requireAdminPage();
  const sets = await listQuestionSets();
  return <QuestionSetManager initial={sets as never} />;
}
