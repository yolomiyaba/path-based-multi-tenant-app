/**
 * テナント招待ロジック
 */

import { db } from "@/lib/db";
import { tenantInvitations, userTenants, users, tenants } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

const INVITATION_EXPIRY_DAYS = 7;

// 招待可能なロール
export const ROLES_CAN_INVITE = ["owner", "admin"] as const;
export type Role = "owner" | "admin" | "member";

/**
 * 安全なランダムトークンを生成
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * ユーザーのテナントでのロールを取得
 */
export async function getUserRoleInTenant(
  userId: string,
  tenantId: string
): Promise<Role | null> {
  const membership = await db.query.userTenants.findFirst({
    where: and(
      eq(userTenants.userId, userId),
      eq(userTenants.tenantId, tenantId)
    ),
  });

  return membership?.role as Role | null;
}

/**
 * ユーザーが招待権限を持っているかチェック
 */
export async function canInvite(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRoleInTenant(userId, tenantId);
  return role !== null && ROLES_CAN_INVITE.includes(role as typeof ROLES_CAN_INVITE[number]);
}

/**
 * 招待を作成
 */
export async function createInvitation(
  tenantId: string,
  email: string,
  invitedByUserId: string,
  role: Role = "member"
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 招待権限チェック
    const hasPermission = await canInvite(invitedByUserId, tenantId);
    if (!hasPermission) {
      return { success: false, error: "招待する権限がありません" };
    }

    // 既にテナントに所属しているかチェック
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      const existingMembership = await db.query.userTenants.findFirst({
        where: and(
          eq(userTenants.userId, existingUser.id),
          eq(userTenants.tenantId, tenantId)
        ),
      });

      if (existingMembership) {
        return { success: false, error: "このユーザーは既にテナントに所属しています" };
      }
    }

    // 既存の未使用招待を削除
    await db
      .delete(tenantInvitations)
      .where(
        and(
          eq(tenantInvitations.email, normalizedEmail),
          eq(tenantInvitations.tenantId, tenantId),
          isNull(tenantInvitations.acceptedAt)
        )
      );

    // 新しい招待を作成
    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(tenantInvitations).values({
      tenantId,
      email: normalizedEmail,
      token,
      role,
      invitedBy: invitedByUserId,
      expiresAt,
    });

    return { success: true, token };
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return { success: false, error: "招待の作成に失敗しました" };
  }
}

/**
 * 招待トークンを検証
 */
export async function verifyInvitation(token: string): Promise<{
  success: boolean;
  invitation?: {
    id: string;
    tenantId: string;
    tenantName: string;
    email: string;
    role: string;
    inviterName: string | null;
  };
  error?: string;
}> {
  const invitation = await db.query.tenantInvitations.findFirst({
    where: and(
      eq(tenantInvitations.token, token),
      gt(tenantInvitations.expiresAt, new Date()),
      isNull(tenantInvitations.acceptedAt)
    ),
  });

  if (!invitation) {
    return { success: false, error: "無効または期限切れの招待です" };
  }

  // テナント情報を取得
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, invitation.tenantId),
  });

  // 招待者情報を取得
  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitation.invitedBy),
  });

  return {
    success: true,
    invitation: {
      id: invitation.id,
      tenantId: invitation.tenantId,
      tenantName: tenant?.name || invitation.tenantId,
      email: invitation.email,
      role: invitation.role,
      inviterName: inviter?.name || null,
    },
  };
}

/**
 * 招待を承認してテナントに参加
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; tenantId?: string; error?: string }> {
  try {
    // 招待を検証
    const verification = await verifyInvitation(token);
    if (!verification.success || !verification.invitation) {
      return { success: false, error: verification.error };
    }

    const { invitation } = verification;

    // ユーザーのメールアドレスが招待メールと一致するかチェック
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" };
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: "この招待は別のメールアドレス宛てです" };
    }

    // テナントに参加
    await db.insert(userTenants).values({
      userId,
      tenantId: invitation.tenantId,
      role: invitation.role,
    });

    // 招待を承認済みにする
    await db
      .update(tenantInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(tenantInvitations.id, invitation.id));

    return { success: true, tenantId: invitation.tenantId };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return { success: false, error: "招待の承認に失敗しました" };
  }
}

/**
 * テナントの招待一覧を取得
 */
export async function getInvitationsForTenant(tenantId: string) {
  return db.query.tenantInvitations.findMany({
    where: eq(tenantInvitations.tenantId, tenantId),
    orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
  });
}

/**
 * 招待をキャンセル
 */
export async function cancelInvitation(
  invitationId: string,
  userId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const hasPermission = await canInvite(userId, tenantId);
  if (!hasPermission) {
    return { success: false, error: "招待をキャンセルする権限がありません" };
  }

  await db
    .delete(tenantInvitations)
    .where(
      and(
        eq(tenantInvitations.id, invitationId),
        eq(tenantInvitations.tenantId, tenantId)
      )
    );

  return { success: true };
}
