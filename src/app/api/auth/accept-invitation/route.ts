import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { acceptInvitation } from "@/lib/invitations";
import { getUserByEmail } from "@/lib/users";

/**
 * POST /api/auth/accept-invitation
 * 招待を承認してテナントに参加
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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "トークンが必要です" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const result = await acceptInvitation(token, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { success: false, error: "招待の承認に失敗しました" },
      { status: 500 }
    );
  }
}
