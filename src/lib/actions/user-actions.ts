"use server";

import { getUserTenantIdsDirect, getUserByEmail } from "@/lib/users";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createVerificationToken } from "@/lib/auth/email-verification";
import { sendVerificationEmail } from "@/lib/email/mailgun";
import { headers } from "next/headers";

/**
 * ユーザーの所属テナントIDリストを取得（Server Action）
 * キャッシュなし版を使用（テナント作成直後でもすぐに反映されるように）
 */
export async function getUserTenantIds(email: string): Promise<string[]> {
  return getUserTenantIdsDirect(email);
}

/**
 * ユーザーが指定されたテナントに所属しているかチェック（Server Action）
 */
export async function isUserBelongsToTenant(
  email: string,
  tenantId: string
): Promise<boolean> {
  const tenantIds = await getUserTenantIdsDirect(email);
  return tenantIds.includes(tenantId);
}

/**
 * 新規ユーザーを作成（Server Action）
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> {
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

    // メール認証トークンを作成して送信
    const token = await createVerificationToken(normalizedEmail);
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const emailResult = await sendVerificationEmail(normalizedEmail, token, baseUrl);
    if (!emailResult.success) {
      console.warn("Failed to send verification email:", emailResult.error);
      // メール送信に失敗してもアカウント作成は成功とする
    }

    return { success: true, requiresVerification: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "ユーザー作成に失敗しました" };
  }
}
