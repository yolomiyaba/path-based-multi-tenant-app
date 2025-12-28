/**
 * Mailgun経由でメールを送信するユーティリティ
 */

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
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "【LeadxAid】メールアドレスの確認",
    text: `
LeadxAidへのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：

${verificationUrl}

このリンクは24時間有効です。

このメールに心当たりがない場合は、無視してください。

---
LeadxAid
`.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">LeadxAid</h1>
    <p>LeadxAidへのご登録ありがとうございます。</p>
    <p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        メールアドレスを確認
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">
      ボタンがクリックできない場合は、以下のURLをブラウザにコピーしてください：<br>
      <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
    </p>
    <p style="color: #666; font-size: 14px;">このリンクは24時間有効です。</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">
      このメールに心当たりがない場合は、無視してください。
    </p>
  </div>
</body>
</html>
`.trim(),
  });
}
