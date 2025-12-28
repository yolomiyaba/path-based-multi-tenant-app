/**
 * ライセンスキー管理ロジック
 * テナント作成権限を制御するためのライセンスキー検証・OTP送信機能
 */

import { db } from "@/lib/db";
import { licenseKeys, licenseKeyOtps } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { generateLicenseKey, generateOtp } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/mailgun";
import {
  licenseOtpEmailSubject,
  licenseOtpEmailText,
  licenseOtpEmailHtml,
} from "@/lib/email/templates";

const OTP_EXPIRY_MINUTES = 10;

// crypto.ts から再エクスポート
export { generateLicenseKey } from "@/lib/crypto";

/**
 * ライセンスキーを検証（存在確認・有効期限・未使用チェック）
 */
export async function validateLicenseKey(
  code: string,
  email: string
): Promise<{
  valid: boolean;
  licenseKey?: typeof licenseKeys.$inferSelect;
  error?: string;
}> {
  const license = await db.query.licenseKeys.findFirst({
    where: eq(licenseKeys.code, code),
  });

  if (!license) {
    return { valid: false, error: "ライセンスキーが見つかりません" };
  }

  // メールアドレスチェック
  if (license.email.toLowerCase() !== email.toLowerCase()) {
    return {
      valid: false,
      error: "このライセンスキーは別のメールアドレスに紐付けられています",
    };
  }

  // 使用済みチェック
  if (license.usedAt) {
    return { valid: false, error: "このライセンスキーは既に使用されています" };
  }

  // 有効期限チェック
  if (license.expiresAt < new Date()) {
    return { valid: false, error: "ライセンスキーの有効期限が切れています" };
  }

  return { valid: true, licenseKey: license };
}

/**
 * OTPを生成してメール送信
 */
export async function sendLicenseOtp(
  licenseKeyId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 既存のOTPを削除（同一ライセンスキーに対する古いOTP）
  await db
    .delete(licenseKeyOtps)
    .where(eq(licenseKeyOtps.licenseKeyId, licenseKeyId));

  // 新しいOTPを保存
  await db.insert(licenseKeyOtps).values({
    licenseKeyId,
    otp,
    expiresAt,
  });

  // メール送信
  const result = await sendEmail({
    to: email,
    subject: licenseOtpEmailSubject(),
    text: licenseOtpEmailText({ otp }),
    html: licenseOtpEmailHtml({ otp }),
  });

  if (!result.success) {
    return { success: false, error: result.error || "OTPメール送信に失敗しました" };
  }

  return { success: true };
}

/**
 * OTPを検証
 */
export async function verifyLicenseOtp(
  licenseKeyId: string,
  otp: string
): Promise<{ valid: boolean; error?: string }> {
  const otpRecord = await db.query.licenseKeyOtps.findFirst({
    where: and(
      eq(licenseKeyOtps.licenseKeyId, licenseKeyId),
      eq(licenseKeyOtps.otp, otp),
      gt(licenseKeyOtps.expiresAt, new Date()),
      isNull(licenseKeyOtps.verifiedAt)
    ),
  });

  if (!otpRecord) {
    return { valid: false, error: "認証コードが無効または期限切れです" };
  }

  // OTPを使用済みにする
  await db
    .update(licenseKeyOtps)
    .set({ verifiedAt: new Date() })
    .where(eq(licenseKeyOtps.id, otpRecord.id));

  return { valid: true };
}

/**
 * ライセンスキーを使用済みにする
 */
export async function markLicenseKeyAsUsed(
  licenseKeyId: string,
  userId: string
): Promise<void> {
  await db
    .update(licenseKeys)
    .set({
      usedAt: new Date(),
      usedBy: userId,
    })
    .where(eq(licenseKeys.id, licenseKeyId));
}

/**
 * ユーザーが有効なライセンスを持っているかチェック
 * （OTP認証済みのライセンスキーがあるか）
 */
export async function hasValidLicense(email: string): Promise<boolean> {
  // 未使用かつ有効期限内のライセンスキーを検索
  const license = await db.query.licenseKeys.findFirst({
    where: and(
      eq(licenseKeys.email, email.toLowerCase()),
      isNull(licenseKeys.usedAt),
      gt(licenseKeys.expiresAt, new Date())
    ),
  });

  if (!license) {
    return false;
  }

  // そのライセンスキーに対する認証済みOTPがあるかチェック
  const verifiedOtp = await db.query.licenseKeyOtps.findFirst({
    where: and(
      eq(licenseKeyOtps.licenseKeyId, license.id),
      // verifiedAtがnullでない = 検証済み
      gt(licenseKeyOtps.verifiedAt, new Date(0))
    ),
  });

  return !!verifiedOtp;
}

/**
 * 管理者用: ライセンスキーを発行
 */
export async function createLicenseKey(
  email: string,
  plan: string = "standard",
  expiresInDays: number = 365
): Promise<{ code: string; expiresAt: Date }> {
  const code = generateLicenseKey();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  await db.insert(licenseKeys).values({
    code,
    email: email.toLowerCase(),
    plan,
    expiresAt,
  });

  return { code, expiresAt };
}
