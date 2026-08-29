import "server-only";

import { getIntegrationRuntime } from "@/lib/settings";

export interface EmailConfig {
  provider: "smtp" | null;
  fromName: string;
  fromEmail: string;
}

interface ResolvedConfig {
  ready: boolean;
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  host: string;
  port: number;
  user: string;
  pass: string;
}

async function resolveConfig(): Promise<ResolvedConfig> {
  try {
    const smtp = await getIntegrationRuntime("email.smtp");
    const host = String(smtp.config.host ?? "").trim();
    const user = String(smtp.config.user ?? "").trim();
    const pass = smtp.secret("pass") ?? "";
    const port = Number(smtp.config.port ?? 587) || 587;
    return {
      ready: Boolean(host && user && pass),
      enabled: smtp.enabled,
      fromName: String(smtp.config.fromName ?? "").trim() || "Aperio",
      fromEmail: String(smtp.config.fromEmail ?? "").trim() || user,
      host,
      port,
      user,
      pass,
    };
  } catch {
    return { ready: false, enabled: false, fromName: "Aperio", fromEmail: "", host: "", port: 587, user: "", pass: "" };
  }
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const c = await resolveConfig();
  return { provider: c.ready && c.enabled ? "smtp" : null, fromName: c.fromName, fromEmail: c.fromEmail };
}

export async function isEmailConfigured() {
  const c = await resolveConfig();
  return c.ready && c.enabled;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  opts: { requireEnabled?: boolean } = {},
) {
  const c = await resolveConfig();
  if (!c.ready) throw new Error("EMAIL_NOT_CONFIGURED");
  if ((opts.requireEnabled ?? true) && !c.enabled) throw new Error("EMAIL_DISABLED");

  const from = `${c.fromName} <${c.fromEmail}>`;
  const plain = text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465, // 465 = implicit TLS; 587/25 = STARTTLS, handled automatically
    auth: { user: c.user, pass: c.pass },
  });
  await transporter.sendMail({ from, to, subject, text: plain, html });
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

/** Test-connection helper: sends a real email to `to`, ignoring the Enabled toggle. */
export async function sendTestEmail(to: string) {
  await sendEmail(
    to,
    "Aperio email test",
    shell("Email is working", `<p style="margin:0">This is a test message from Aperio's admin integrations page. If you can read this, sending is configured correctly. Remember to tick <b>Enabled</b> and Save so notification emails actually go out.</p>`),
    undefined,
    { requireEnabled: false },
  );
}
