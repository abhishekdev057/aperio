import { query } from "@/lib/db";
import { getTelegramConfig } from "@/lib/telegram";
import { getWhatsAppConfig } from "@/lib/whatsapp";

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
    whatsapp: { configured: boolean; businessNumber: string };
  };
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
  const [telegram, whatsapp] = await Promise.all([getTelegramConfig(), getWhatsAppConfig()]);
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
      whatsapp: { configured: whatsapp.configured, businessNumber: whatsapp.businessNumber },
    },
  };
}
