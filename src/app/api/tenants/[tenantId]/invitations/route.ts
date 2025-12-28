import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import {
  createInvitation,
  getInvitationsForTenant,
  canInvite,
} from "@/lib/invitations";
import { sendInvitationEmail } from "@/lib/email/mailgun";
import { getUserByEmail } from "@/lib/users";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

/**
 * GET /api/tenants/[tenantId]/invitations
 * テナントの招待一覧を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(getGlobalAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { tenantId } = await params;
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 権限チェック
    const hasPermission = await canInvite(user.id, tenantId);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: "招待一覧を表示する権限がありません" },
        { status: 403 }
      );
    }

    const invitations = await getInvitationsForTenant(tenantId);
    return NextResponse.json({ success: true, invitations });
  } catch (error) {
    console.error("Failed to get invitations:", error);
    return NextResponse.json(
      { success: false, error: "招待一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants/[tenantId]/invitations
 * 新しい招待を作成して送信
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(getGlobalAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { tenantId } = await params;
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    // 招待を作成
    const result = await createInvitation(tenantId, email, user.id, role);
    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // 招待メールを送信
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    // テナント名を取得（簡易的にtenantIdを使用、後で改善可能）
    const emailResult = await sendInvitationEmail(
      email,
      result.token,
      baseUrl,
      {
        inviterName: user.name || session.user.email,
        tenantName: tenantId, // TODO: 実際のテナント名を取得
      }
    );

    if (!emailResult.success) {
      console.warn("Failed to send invitation email:", emailResult.error);
      // メール送信失敗でも招待自体は作成済みなので成功とする
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { success: false, error: "招待の作成に失敗しました" },
      { status: 500 }
    );
  }
}
