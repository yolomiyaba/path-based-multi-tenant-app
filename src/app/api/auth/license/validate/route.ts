import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { validateLicenseKey, sendLicenseOtp } from "@/lib/license-keys";

/**
 * POST /api/auth/license/validate
 * ライセンスキーを検証してOTPを送信
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

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { success: false, error: "ライセンスキーが必要です" },
        { status: 400 }
      );
    }

    // ライセンスキー検証
    const validation = await validateLicenseKey(code, session.user.email);
    if (!validation.valid || !validation.licenseKey) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // OTP送信
    const otpResult = await sendLicenseOtp(
      validation.licenseKey.id,
      session.user.email
    );

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      licenseKeyId: validation.licenseKey.id,
      message: "認証コードをメールに送信しました",
    });
  } catch (error) {
    console.error("License validation error:", error);
    return NextResponse.json(
      { success: false, error: "ライセンス検証中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
