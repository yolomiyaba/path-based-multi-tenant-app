/**
 * ユーザー管理用のユーティリティ関数
 * 本番環境では、データベースからユーザー情報を取得するように実装してください
 */

/**
 * ユーザーとテナントの対応関係
 * 本番環境では、データベースから取得するように変更してください
 * 
 * 形式: { email: tenantId }
 */
const USER_TENANT_MAP: Record<string, string> = {
  "admin@example.com": "tenant1",
  "devleadxaid@gmail.com": "tenant1",
  "lx-test-1@saixaid.com": "tenant1",
  "user1@example.com": "tenant1",
  "user2@example.com": "tenant2",
  "user3@example.com": "tenant3",
};

/**
 * ユーザーが指定されたテナントに所属しているかチェック
 */
export function isUserBelongsToTenant(
  email: string,
  tenantId: string
): boolean {
  const userTenantId = USER_TENANT_MAP[email.toLowerCase()];
  return userTenantId === tenantId;
}

/**
 * ユーザーの所属テナントIDを取得
 */
export function getUserTenantId(email: string): string | null {
  return USER_TENANT_MAP[email.toLowerCase()] || null;
}

/**
 * テナントに所属するすべてのユーザーのメールアドレスを取得
 */
export function getTenantUsers(tenantId: string): string[] {
  return Object.entries(USER_TENANT_MAP)
    .filter(([_, userTenantId]) => userTenantId === tenantId)
    .map(([email]) => email);
}

