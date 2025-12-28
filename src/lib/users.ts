/**
 * ユーザー管理用のユーティリティ関数
 */

import { db } from "./db";
import { users, userTenants } from "./db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * ユーザーが指定されたテナントに所属しているかチェック
 */
export async function isUserBelongsToTenant(
  email: string,
  tenantId: string
): Promise<boolean> {
  const tenantIds = await getUserTenantIds(email);
  return tenantIds.includes(tenantId);
}

/**
 * ユーザーの所属テナントIDリストを取得（キャッシュなし版）
 * テナント作成直後などキャッシュをバイパスしたい場合に使用
 */
export async function getUserTenantIdsDirect(email: string): Promise<string[]> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: {
      userTenants: true,
    },
  });

  if (!user) return [];
  return user.userTenants.map((ut) => ut.tenantId);
}

/**
 * ユーザーの所属テナントIDリストを取得（キャッシュあり）
 */
export const getUserTenantIds = unstable_cache(
  async (email: string): Promise<string[]> => {
    return getUserTenantIdsDirect(email);
  },
  ["user-tenants"],
  { revalidate: 60 }
);

/**
 * ユーザーの所属テナントIDを取得（後方互換性のため維持、最初のテナントを返す）
 */
export async function getUserTenantId(email: string): Promise<string | null> {
  const tenants = await getUserTenantIds(email);
  return tenants.length > 0 ? tenants[0] : null;
}

/**
 * テナントに所属するすべてのユーザーのメールアドレスを取得
 */
export const getTenantUsers = unstable_cache(
  async (tenantId: string): Promise<string[]> => {
    const results = await db.query.userTenants.findMany({
      where: eq(userTenants.tenantId, tenantId),
      with: {
        user: true,
      },
    });

    return results.map((r) => r.user.email);
  },
  ["tenant-users"],
  { revalidate: 60 }
);

/**
 * ユーザーが登録済みかどうかをチェック（いずれかのテナントに所属しているか）
 */
export async function isRegisteredUser(email: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  return user !== undefined;
}

/**
 * メールアドレスでユーザーを取得（認証用）
 */
export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
}
