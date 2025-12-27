/**
 * ユーザー管理用のユーティリティ関数
 * 本番環境では、データベースからユーザー情報を取得するように実装してください
 */

/**
 * ユーザーとテナントの対応関係（複数テナント対応）
 * 本番環境では、データベースから取得するように変更してください
 *
 * 形式: { email: tenantId[] }
 */
const USER_TENANTS_MAP: Record<string, string[]> = {
  "admin@example.com": ["tenant1"],
  "devleadxaid@gmail.com": ["tenant1", "tenant2"], // 複数テナント所属の例
  "lx-test-1@saixaid.com": ["tenant1"],
  "user1@example.com": ["tenant1"],
  "user2@example.com": ["tenant2"],
  "user3@example.com": ["tenant3"],
};

/**
 * ユーザーが指定されたテナントに所属しているかチェック
 */
export function isUserBelongsToTenant(
  email: string,
  tenantId: string
): boolean {
  const userTenants = USER_TENANTS_MAP[email.toLowerCase()];
  return userTenants?.includes(tenantId) ?? false;
}

/**
 * ユーザーの所属テナントIDリストを取得
 */
export function getUserTenantIds(email: string): string[] {
  return USER_TENANTS_MAP[email.toLowerCase()] || [];
}

/**
 * ユーザーの所属テナントIDを取得（後方互換性のため維持、最初のテナントを返す）
 */
export function getUserTenantId(email: string): string | null {
  const tenants = getUserTenantIds(email);
  return tenants.length > 0 ? tenants[0] : null;
}

/**
 * テナントに所属するすべてのユーザーのメールアドレスを取得
 */
export function getTenantUsers(tenantId: string): string[] {
  return Object.entries(USER_TENANTS_MAP)
    .filter(([_, userTenants]) => userTenants.includes(tenantId))
    .map(([email]) => email);
}

/**
 * ユーザーが登録済みかどうかをチェック（いずれかのテナントに所属しているか）
 */
export function isRegisteredUser(email: string): boolean {
  return email.toLowerCase() in USER_TENANTS_MAP;
}
