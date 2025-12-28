import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { verifyLicenseOtp } from "@/lib/license-keys";

/**
 * POST /api/auth/license/verify-otp
 * OTPを検証
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

    const { licenseKeyId, otp } = await request.json();
    if (!licenseKeyId || !otp) {
      return NextResponse.json(
        { success: false, error: "ライセンスキーIDとOTPが必要です" },
        { status: 400 }
      );
    }

    // OTP検証
    const result = await verifyLicenseOtp(licenseKeyId, otp);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "認証が完了しました。テナントを作成できます",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, error: "OTP検証中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
