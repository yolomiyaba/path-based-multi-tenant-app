import { NextRequest, NextResponse } from "next/server";
import { verifyToken, markEmailAsVerified } from "@/lib/auth/email-verification";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "トークンが必要です" },
        { status: 400 }
      );
    }

    // トークンを検証
    const verification = await verifyToken(token);
    if (!verification.success || !verification.email) {
      return NextResponse.json(
        { success: false, error: verification.error || "無効なトークンです" },
        { status: 400 }
      );
    }

    // メールを認証済みにする
    const result = await markEmailAsVerified(verification.email);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "認証処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
