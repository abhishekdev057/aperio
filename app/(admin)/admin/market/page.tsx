import { MarketSources } from "@/components/admin/market-sources";
import { requireAdminPage } from "@/lib/admin";
import { listMarketSources } from "@/lib/market";
import { INTEGRATION_SCHEMAS } from "@/lib/settings";

export const metadata = { title: "Admin · Job market" };

export default async function AdminMarketPage() {
  await requireAdminPage();
  const sources = await listMarketSources();
  const integrationKeys = INTEGRATION_SCHEMAS.filter((s) => s.key.startsWith("jobs.")).map((s) => ({ key: s.key, title: s.title }));
  return <MarketSources initial={{ sources: sources as never, integrationKeys }} />;
}
