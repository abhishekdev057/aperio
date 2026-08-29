import { PracticeBoard } from "@/components/practice-board";
import { QuizSets } from "@/components/quiz-sets";
import { requirePageUser } from "@/lib/auth";
import { listPracticeSessions, suggestedPracticeSkills } from "@/lib/practice";
import { listQuestionSetsForUser } from "@/lib/quiz-bank";

export const metadata = { title: "Practice" };

export default async function PracticePage() {
  const user = await requirePageUser();
  const [sessions, suggestions, quizSets] = await Promise.all([
    listPracticeSessions(user.id),
    suggestedPracticeSkills(user.id),
    listQuestionSetsForUser(user.id),
  ]);
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 lg:px-10 lg:py-10">
      <PracticeBoard initial={{ sessions: sessions as never, suggestions: suggestions as never }} />
      <QuizSets initial={quizSets as never} />
    </div>
  );
}
