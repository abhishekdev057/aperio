import { query } from "@/lib/db";
import { getTelegramConfig } from "@/lib/telegram";
import { getIntegrationRuntime } from "@/lib/settings";

export interface IntegrationsState {
  channels: Array<{
    platform: "telegram" | "whatsapp";
    status: "pending" | "linked" | "disabled";
    handle: string | null;
    hasAddress: boolean;
    linkCode: string | null;
  }>;
  preferences: {
    notifyRoadmap: boolean;
    notifyWeeklyDigest: boolean;
    notifyAnalysis: boolean;
    notifyInactivity: boolean;
  };
  providers: {
    telegram: { configured: boolean; botUsername: string };
    whatsapp: { configured: boolean };
  };
}

async function whatsappConfigured() {
  for (const key of ["whatsapp.cloud", "whatsapp.twilio"] as const) {
    try {
      const runtime = await getIntegrationRuntime(key);
      if (runtime.enabled) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

export async function getIntegrationsState(userId: string): Promise<IntegrationsState> {
  const channels = await query<IntegrationsState["channels"][number] & Record<string, unknown>>(
    `SELECT platform, status, handle, address IS NOT NULL AS "hasAddress", link_code AS "linkCode"
     FROM messaging_channels WHERE user_id=$1 ORDER BY platform`,
    [userId],
  );
  const prefs = await query<Record<string, unknown>>(
    `SELECT notify_roadmap AS "notifyRoadmap", notify_weekly_digest AS "notifyWeeklyDigest",
      notify_analysis AS "notifyAnalysis", notify_inactivity AS "notifyInactivity"
     FROM preferences WHERE user_id=$1`,
    [userId],
  );
  const telegram = await getTelegramConfig();
  return {
    channels,
    preferences: (prefs[0] as IntegrationsState["preferences"]) ?? {
      notifyRoadmap: true,
      notifyWeeklyDigest: true,
      notifyAnalysis: true,
      notifyInactivity: true,
    },
    providers: {
      telegram: { configured: telegram.configured, botUsername: telegram.botUsername },
      whatsapp: { configured: await whatsappConfigured() },
    },
  };
}
