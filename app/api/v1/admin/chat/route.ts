import { requireAdmin } from "@/lib/admin";
import { handleApiError, ok } from "@/lib/api";
import { one } from "@/lib/db";
import { listThreads, type ChatChannel } from "@/lib/chat";
import { syncUserbotMessages } from "@/lib/telegram-userbot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const channel = (params.get("channel") as ChatChannel | "all") || "all";
    const q = params.get("q")?.trim() || undefined;

    // Opportunistically refresh Telegram in the background while the workspace is open.
    if (channel === "all" || channel === "telegram_userbot") {
      const state = await one<{ stale: boolean }>(
        `SELECT (synced_at IS NULL OR synced_at < now() - interval '10 seconds') AS stale FROM chat_sync_state WHERE channel='telegram_userbot'`,
      );
      if (!state || state.stale) void syncUserbotMessages().catch(() => {});
    }

    return ok({ threads: await listThreads({ channel, q }) });
  } catch (error) {
    return handleApiError(error);
  }
}
