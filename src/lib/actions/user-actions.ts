"use server";

import { getUserTenantIds as _getUserTenantIds, isUserBelongsToTenant as _isUserBelongsToTenant } from "@/lib/users";

/**
 * ユーザーの所属テナントIDリストを取得（Server Action）
 */
export async function getUserTenantIds(email: string): Promise<string[]> {
  return _getUserTenantIds(email);
}

/**
 * ユーザーが指定されたテナントに所属しているかチェック（Server Action）
 */
export async function isUserBelongsToTenant(
  email: string,
  tenantId: string
): Promise<boolean> {
  return _isUserBelongsToTenant(email, tenantId);
}
