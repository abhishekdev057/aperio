import { RoleExplorer } from "@/components/role-explorer";
import { requirePageUser } from "@/lib/auth";
import { getAnalysisHistory, getRoles } from "@/lib/reports";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  const user = await requirePageUser();
  const [roles, history] = await Promise.all([getRoles(user.id), getAnalysisHistory(user.id, 20)]);
  const analyzedRoleCount = new Set(history.map((item) => String(item.roleSlug))).size;
  return <div className="aperio-page"><RoleExplorer roles={roles} historyCount={analyzedRoleCount} /></div>;
}
