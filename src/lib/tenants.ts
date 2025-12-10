/**
 * テナント管理用のユーティリティ関数
 * 本番環境では、データベースからテナント情報を取得するように実装してください
 */

/**
 * 有効なテナントIDのリスト
 * 本番環境では、データベースから取得するように変更してください
 */
const VALID_TENANTS = ["tenant1", "tenant2", "tenant3"];

/**
 * テナントIDが有効かどうかをチェック
 */
export function isValidTenant(tenantId: string): boolean {
  return VALID_TENANTS.includes(tenantId);
}

/**
 * すべての有効なテナントIDを取得
 */
export function getValidTenants(): string[] {
  return VALID_TENANTS;
}

