import { NextRequest, NextResponse } from "next/server";
import { verifyInvitation } from "@/lib/invitations";

/**
 * GET /api/auth/verify-invitation?token=xxx
 * 招待トークンを検証して招待情報を返す
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "トークンが必要です" },
        { status: 400 }
      );
    }

    const result = await verifyInvitation(token);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to verify invitation:", error);
    return NextResponse.json(
      { success: false, error: "招待の検証に失敗しました" },
      { status: 500 }
    );
  }
}
