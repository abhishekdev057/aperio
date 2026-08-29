import { requireUser } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/api";

export const runtime = "nodejs";

// Placeholder: the WhatsApp adapter (Meta Cloud API or Twilio) is not wired yet.
// The notification engine already routes by channel platform, so enabling it is:
//   1. add a provider + credentials,
//   2. implement the 'whatsapp' branch in lib/notifications.ts deliver(),
//   3. replace this route with a real opt-in / number-verification flow.
export async function POST() {
  try {
    await requireUser();
    return fail(
      "NOT_IMPLEMENTED",
      "WhatsApp notifications are coming next. Link Telegram for automated updates for now.",
      501,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
