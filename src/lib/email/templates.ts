/**
 * メールテンプレート
 */

const APP_NAME = "lead X aid";
const BRAND_COLOR = "#2563eb";

/**
 * 共通のHTMLレイアウト
 */
function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: ${BRAND_COLOR}; margin-top: 0;">${APP_NAME}</h1>
      ${content}
    </div>
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
      &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>
`.trim();
}

/**
 * CTAボタン
 */
function ctaButton(url: string, text: string): string {
  return `
<p style="text-align: center; margin: 30px 0;">
  <a href="${url}"
     style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
    ${text}
  </a>
</p>
`.trim();
}

/**
 * URLフォールバック
 */
function urlFallback(url: string): string {
  return `
<p style="color: #666; font-size: 14px;">
  ボタンがクリックできない場合は、以下のURLをブラウザにコピーしてください：<br>
  <a href="${url}" style="color: ${BRAND_COLOR}; word-break: break-all;">${url}</a>
</p>
`.trim();
}

// ============================================
// メール認証テンプレート
// ============================================

export interface VerificationEmailParams {
  verificationUrl: string;
}

export function verificationEmailSubject(): string {
  return `【${APP_NAME}】メールアドレスの確認`;
}

export function verificationEmailText(params: VerificationEmailParams): string {
  return `
${APP_NAME}へのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：

${params.verificationUrl}

このリンクは24時間有効です。

このメールに心当たりがない場合は、無視してください。

---
${APP_NAME}
`.trim();
}

export function verificationEmailHtml(params: VerificationEmailParams): string {
  const content = `
<p>${APP_NAME}へのご登録ありがとうございます。</p>
<p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
${ctaButton(params.verificationUrl, "メールアドレスを確認")}
${urlFallback(params.verificationUrl)}
<p style="color: #666; font-size: 14px;">このリンクは24時間有効です。</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
<p style="color: #999; font-size: 12px;">
  このメールに心当たりがない場合は、無視してください。
</p>
`.trim();

  return baseLayout(content);
}

// ============================================
// 招待メールテンプレート（将来用）
// ============================================

export interface InvitationEmailParams {
  inviterName: string;
  tenantName: string;
  invitationUrl: string;
}

export function invitationEmailSubject(params: InvitationEmailParams): string {
  return `【${APP_NAME}】${params.inviterName}さんから${params.tenantName}への招待`;
}

export function invitationEmailText(params: InvitationEmailParams): string {
  return `
${params.inviterName}さんから${params.tenantName}への参加招待が届いています。

以下のリンクをクリックして、招待を承認してください：

${params.invitationUrl}

このリンクは7日間有効です。

このメールに心当たりがない場合は、無視してください。

---
${APP_NAME}
`.trim();
}

export function invitationEmailHtml(params: InvitationEmailParams): string {
  const content = `
<p><strong>${params.inviterName}</strong>さんから<strong>${params.tenantName}</strong>への参加招待が届いています。</p>
<p>以下のボタンをクリックして、招待を承認してください：</p>
${ctaButton(params.invitationUrl, "招待を承認")}
${urlFallback(params.invitationUrl)}
<p style="color: #666; font-size: 14px;">このリンクは7日間有効です。</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
<p style="color: #999; font-size: 12px;">
  このメールに心当たりがない場合は、無視してください。
</p>
`.trim();

  return baseLayout(content);
}

// ============================================
// パスワードリセットテンプレート（将来用）
// ============================================

export interface PasswordResetEmailParams {
  resetUrl: string;
}

export function passwordResetEmailSubject(): string {
  return `【${APP_NAME}】パスワードのリセット`;
}

export function passwordResetEmailText(params: PasswordResetEmailParams): string {
  return `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：

${params.resetUrl}

このリンクは1時間有効です。

このリクエストに心当たりがない場合は、このメールを無視してください。
アカウントのパスワードは変更されません。

---
${APP_NAME}
`.trim();
}

export function passwordResetEmailHtml(params: PasswordResetEmailParams): string {
  const content = `
<p>パスワードリセットのリクエストを受け付けました。</p>
<p>以下のボタンをクリックして、新しいパスワードを設定してください：</p>
${ctaButton(params.resetUrl, "パスワードをリセット")}
${urlFallback(params.resetUrl)}
<p style="color: #666; font-size: 14px;">このリンクは1時間有効です。</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
<p style="color: #999; font-size: 12px;">
  このリクエストに心当たりがない場合は、このメールを無視してください。<br>
  アカウントのパスワードは変更されません。
</p>
`.trim();

  return baseLayout(content);
}
