import { NextRequest, NextResponse } from "next/server";
import { completePaymentSession } from "@/lib/payments";

/**
 * GET /api/payments/mock-checkout
 * モック用の課金完了処理（本番ではStripe Webhookで処理）
 *
 * このエンドポイントは開発/テスト用です。
 * 本番環境ではStripe Checkoutにリダイレクトし、
 * Webhookで課金完了を処理します。
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");
  const successUrl = searchParams.get("success_url");
  const cancelUrl = searchParams.get("cancel_url");

  if (!sessionId) {
    return NextResponse.redirect(new URL(cancelUrl || "/auth/signup?payment=error", request.url));
  }

  // モック：セッションを完了としてマーク
  const result = await completePaymentSession(sessionId);

  if (result.success) {
    // 成功：successUrlにリダイレクト
    const redirectUrl = new URL(successUrl || "/auth/signup?payment=success", request.url);
    return NextResponse.redirect(redirectUrl);
  } else {
    // 失敗：cancelUrlにリダイレクト
    const redirectUrl = new URL(cancelUrl || "/auth/signup?payment=error", request.url);
    redirectUrl.searchParams.set("error", result.error || "課金処理に失敗しました");
    return NextResponse.redirect(redirectUrl);
  }
}
