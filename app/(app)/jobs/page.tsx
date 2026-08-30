import { JobsBoard } from "@/components/jobs-board";
import { requirePageUser } from "@/lib/auth";
import { getJobsForUser } from "@/lib/jobs";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const user = await requirePageUser();
  const initial = await getJobsForUser(user.id, { scope: "all", limit: 24 });
  return (
    <div className="aperio-page mx-auto max-w-[1180px]">
      <JobsBoard initial={initial as never} />
    </div>
  );
}
