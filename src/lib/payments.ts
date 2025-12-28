/**
 * 課金管理ロジック（Stripeモック）
 *
 * 本番環境ではStripe SDKに置き換える
 */

import { db } from "@/lib/db";
import { paymentSessions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { generatePaymentSessionId } from "@/lib/crypto";

const SESSION_EXPIRY_HOURS = 24;

/**
 * 課金セッションを作成（Stripe Checkout Session相当）
 */
export async function createPaymentSession(
  email: string,
  plan: string = "standard",
  successUrl: string,
  cancelUrl: string
): Promise<{
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}> {
  try {
    const sessionId = generatePaymentSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.insert(paymentSessions).values({
      email: email.toLowerCase(),
      sessionId,
      plan,
      status: "pending",
      expiresAt,
    });

    // 本番ではStripe Checkout URLを返す
    // モック版では直接成功ページにリダイレクトするURLを返す
    const checkoutUrl = `/api/payments/mock-checkout?session_id=${sessionId}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;

    return {
      success: true,
      sessionId,
      checkoutUrl,
    };
  } catch (error) {
    console.error("Failed to create payment session:", error);
    return { success: false, error: "課金セッションの作成に失敗しました" };
  }
}

/**
 * 課金セッションを完了としてマーク
 */
export async function completePaymentSession(
  sessionId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const session = await db.query.paymentSessions.findFirst({
      where: and(
        eq(paymentSessions.sessionId, sessionId),
        eq(paymentSessions.status, "pending"),
        gt(paymentSessions.expiresAt, new Date())
      ),
    });

    if (!session) {
      return { success: false, error: "無効または期限切れのセッションです" };
    }

    await db
      .update(paymentSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(paymentSessions.id, session.id));

    return { success: true, email: session.email };
  } catch (error) {
    console.error("Failed to complete payment session:", error);
    return { success: false, error: "課金完了処理に失敗しました" };
  }
}

/**
 * ユーザーが課金済みかどうかをチェック
 */
export async function hasCompletedPayment(email: string): Promise<boolean> {
  const session = await db.query.paymentSessions.findFirst({
    where: and(
      eq(paymentSessions.email, email.toLowerCase()),
      eq(paymentSessions.status, "completed")
    ),
  });

  return !!session;
}

/**
 * ユーザーがテナント作成権限を持っているかチェック
 * ライセンスキー認証済み OR 課金済み
 */
export async function canCreateTenant(email: string): Promise<{
  allowed: boolean;
  method?: "license" | "payment";
}> {
  // 1. ライセンスキーでOTP認証済みかチェック
  const { licenseKeys, licenseKeyOtps } = await import("@/lib/db/schema");
  const { isNull } = await import("drizzle-orm");

  const license = await db.query.licenseKeys.findFirst({
    where: and(
      eq(licenseKeys.email, email.toLowerCase()),
      isNull(licenseKeys.usedAt),
      gt(licenseKeys.expiresAt, new Date())
    ),
  });

  if (license) {
    const verifiedOtp = await db.query.licenseKeyOtps.findFirst({
      where: and(
        eq(licenseKeyOtps.licenseKeyId, license.id),
        gt(licenseKeyOtps.verifiedAt, new Date(0))
      ),
    });

    if (verifiedOtp) {
      return { allowed: true, method: "license" };
    }
  }

  // 2. 課金済みかチェック
  const hasPaid = await hasCompletedPayment(email);
  if (hasPaid) {
    return { allowed: true, method: "payment" };
  }

  return { allowed: false };
}
