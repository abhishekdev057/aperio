import { HistoryView } from "@/components/history-view";
import { requirePageUser } from "@/lib/auth";
import { getAnalysisHistory } from "@/lib/reports";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await requirePageUser();
  const history = await getAnalysisHistory(user.id, 100);
  return <div className="aperio-page"><HistoryView history={history as never[]} /></div>;
}
