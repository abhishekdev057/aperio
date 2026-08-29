import { requireUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";
import { getIntegrationsState } from "@/lib/integrations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await getIntegrationsState(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
