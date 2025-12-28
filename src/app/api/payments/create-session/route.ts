import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { createPaymentSession } from "@/lib/payments";

/**
 * POST /api/payments/create-session
 * 課金セッションを作成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(getGlobalAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { plan, successUrl, cancelUrl } = await request.json();

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const result = await createPaymentSession(
      session.user.email,
      plan || "standard",
      successUrl || `${baseUrl}/auth/signup?payment=success`,
      cancelUrl || `${baseUrl}/auth/signup?payment=cancelled`
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    console.error("Payment session creation error:", error);
    return NextResponse.json(
      { success: false, error: "課金セッション作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
