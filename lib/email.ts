import "server-only";

import { getIntegrationRuntime } from "@/lib/settings";

export interface EmailConfig {
  provider: "smtp" | "resend" | null;
  fromName: string;
  fromEmail: string;
}

async function resolveConfig(): Promise<EmailConfig & { smtp?: Record<string, string>; resendKey?: string }> {
  try {
    const smtp = await getIntegrationRuntime("email.smtp");
    if (smtp.enabled && smtp.config.host && smtp.secret("pass") && smtp.config.fromEmail) {
      return {
        provider: "smtp",
        fromName: smtp.config.fromName || "Aperio",
        fromEmail: smtp.config.fromEmail,
        smtp: {
          host: smtp.config.host,
          port: String(smtp.config.port || "587"),
          secure: String(smtp.config.secure || "").toLowerCase(),
          user: smtp.config.user || "",
          pass: smtp.secret("pass") || "",
        },
      };
    }
  } catch {
    /* fall through */
  }
  try {
    const resend = await getIntegrationRuntime("email.resend");
    if (resend.enabled && resend.secret("apiKey") && resend.config.fromEmail) {
      return {
        provider: "resend",
        fromName: resend.config.fromName || "Aperio",
        fromEmail: resend.config.fromEmail,
        resendKey: resend.secret("apiKey") || "",
      };
    }
  } catch {
    /* fall through */
  }
  return { provider: null, fromName: "Aperio", fromEmail: "" };
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const { provider, fromName, fromEmail } = await resolveConfig();
  return { provider, fromName, fromEmail };
}

export async function isEmailConfigured() {
  return (await resolveConfig()).provider !== null;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const cfg = await resolveConfig();
  if (!cfg.provider) throw new Error("EMAIL_NOT_CONFIGURED");
  const from = `${cfg.fromName} <${cfg.fromEmail}>`;
  const plain = text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  if (cfg.provider === "smtp" && cfg.smtp) {
    const nodemailer = (await import("nodemailer")).default;
    const port = Number(cfg.smtp.port) || 587;
    const transporter = nodemailer.createTransport({
      host: cfg.smtp.host,
      port,
      secure: cfg.smtp.secure === "true" || port === 465,
      auth: cfg.smtp.user ? { user: cfg.smtp.user, pass: cfg.smtp.pass } : undefined,
    });
    await transporter.sendMail({ from, to, subject, text: plain, html });
    return;
  }

  // Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text: plain }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`RESEND_SEND_FAILED: ${res.status} ${detail.slice(0, 200)}`);
  }
}

// --- templates ---------------------------------------------------------------

const APP_URL = process.env.APP_ORIGIN?.replace(/\/+$/, "") || "https://aperio-umber.vercel.app";

function shell(heading: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:700;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#4f46e5">Aperio</div>
    <div style="background:#fff;border:1px solid #e6e8ec;border-radius:16px;padding:28px;margin-top:16px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827">${heading}</h1>
      <div style="font-size:14px;line-height:1.65;color:#374151">${bodyHtml}</div>
      ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px">${cta.label}</a>` : ""}
    </div>
    <p style="font-size:11px;color:#9ca3af;margin-top:16px">You're receiving this because email updates are on for your Aperio account. Turn them off in Settings → Connected messaging.</p>
  </div></body></html>`;
}

export async function sendWelcomeEmail(user: { email: string; fullName: string }) {
  if (!(await isEmailConfigured())) return;
  const first = user.fullName.trim().split(" ")[0] || "there";
  await sendEmail(
    user.email,
    "Welcome to Aperio",
    shell(
      `Welcome, ${first}.`,
      `<p style="margin:0 0 12px">Aperio maps what your résumé and profile actually prove against what a target role needs, then turns the gap into a plan.</p>
       <p style="margin:0">Add a résumé or fill your profile, pick a role, and run your first analysis. You'll get an evidence-linked skill breakdown, a technical/professional readiness split, and a weekly course plan.</p>`,
      { label: "Start your first analysis", href: `${APP_URL}/analyze` },
    ),
  ).catch((error) => console.error("welcome email failed", error instanceof Error ? error.message : error));
}

/** Build an email from a notification's plain text (first line becomes the subject). */
export function notificationEmail(text: string) {
  const lines = text.split("\n").map((l) => l.replace(/<\/?b>/g, "").trim());
  const subject = lines[0] || "Aperio update";
  const bodyHtml = lines
    .slice(1)
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 10px">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
    .join("");
  return {
    subject,
    html: shell(subject, bodyHtml || `<p style="margin:0">${subject}</p>`, { label: "Open Aperio", href: `${APP_URL}/overview` }),
  };
}

/** Test-connection helper: sends a real email to `to`. */
export async function sendTestEmail(to: string) {
  await sendEmail(
    to,
    "Aperio email test",
    shell("Email is working", `<p style="margin:0">This is a test message from Aperio's admin integrations page. If you can read this, sending is configured correctly.</p>`),
  );
}
