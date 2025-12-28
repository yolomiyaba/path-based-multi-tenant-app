/**
 * Mailgun経由でメールを送信するユーティリティ
 */

import {
  verificationEmailSubject,
  verificationEmailText,
  verificationEmailHtml,
  invitationEmailSubject,
  invitationEmailText,
  invitationEmailHtml,
  type InvitationEmailParams,
} from "./templates";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface MailgunResponse {
  id: string;
  message: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM || `noreply@${domain}`;

  if (!apiKey || !domain) {
    console.error("Mailgun configuration missing");
    return { success: false, error: "メール設定が不完全です" };
  }

  try {
    const formData = new FormData();
    formData.append("from", from);
    formData.append("to", options.to);
    formData.append("subject", options.subject);
    formData.append("text", options.text);
    if (options.html) {
      formData.append("html", options.html);
    }

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun error:", errorText);
      return { success: false, error: "メール送信に失敗しました" };
    }

    const result = await response.json() as MailgunResponse;
    console.log("Email sent:", result.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "メール送信に失敗しました" };
  }
}

/**
 * メール認証用のメールを送信
 * @param redirectUrl - 認証後のリダイレクト先URL（省略可）
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string,
  redirectUrl?: string
): Promise<{ success: boolean; error?: string }> {
  let verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  if (redirectUrl) {
    verificationUrl += `&redirect=${encodeURIComponent(redirectUrl)}`;
  }

  return sendEmail({
    to: email,
    subject: verificationEmailSubject(),
    text: verificationEmailText({ verificationUrl }),
    html: verificationEmailHtml({ verificationUrl }),
  });
}

/**
 * テナント招待メールを送信
 */
export async function sendInvitationEmail(
  email: string,
  token: string,
  baseUrl: string,
  params: Omit<InvitationEmailParams, "invitationUrl">
): Promise<{ success: boolean; error?: string }> {
  const invitationUrl = `${baseUrl}/auth/accept-invitation?token=${token}`;
  const fullParams: InvitationEmailParams = {
    ...params,
    invitationUrl,
  };

  return sendEmail({
    to: email,
    subject: invitationEmailSubject(fullParams),
    text: invitationEmailText(fullParams),
    html: invitationEmailHtml(fullParams),
  });
}
