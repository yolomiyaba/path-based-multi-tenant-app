"use server";

import { getUserTenantIds as _getUserTenantIds, isUserBelongsToTenant as _isUserBelongsToTenant, getUserByEmail } from "@/lib/users";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

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

/**
 * 新規ユーザーを作成（Server Action）
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // メールアドレスの正規化
    const normalizedEmail = email.toLowerCase().trim();

    // 既存ユーザーチェック
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に登録されています" };
    }

    // パスワードバリデーション
    if (password.length < 8) {
      return { success: false, error: "パスワードは8文字以上で入力してください" };
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザー作成
    await db.insert(users).values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "ユーザー作成に失敗しました" };
  }
}
