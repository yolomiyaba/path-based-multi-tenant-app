/**
 * 暗号化・トークン生成ユーティリティ
 * 各種トークン・OTP・セッションIDの生成を一元化
 */

import { randomBytes } from "crypto";

/**
 * 安全なランダムトークンを生成（64文字のhex文字列）
 * 用途: メール認証、招待トークンなど
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * ライセンスキーを生成（32文字のhex文字列）
 */
export function generateLicenseKey(): string {
  return randomBytes(16).toString("hex");
}

/**
 * 6桁のOTPを生成
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 課金セッションIDを生成（Stripeモック用）
 * 本番ではStripeが生成するため不要になる
 */
export function generatePaymentSessionId(): string {
  return `cs_mock_${randomBytes(16).toString("hex")}`;
}
