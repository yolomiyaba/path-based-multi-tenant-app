/**
 * メール認証トークンの生成・検証ロジック
 */

import { db } from "@/lib/db";
import { emailVerifications, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

const TOKEN_EXPIRY_HOURS = 24;

/**
 * 安全なランダムトークンを生成
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * メール認証トークンを作成してDBに保存
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // 既存のトークンを削除（同じメールアドレスに対する古いトークン）
  await db.delete(emailVerifications).where(eq(emailVerifications.email, email.toLowerCase()));

  // 新しいトークンを作成
  await db.insert(emailVerifications).values({
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  return token;
}

/**
 * トークンを検証してメールアドレスを取得
 */
export async function verifyToken(token: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  const verification = await db.query.emailVerifications.findFirst({
    where: and(
      eq(emailVerifications.token, token),
      gt(emailVerifications.expiresAt, new Date())
    ),
  });

  if (!verification) {
    return { success: false, error: "無効または期限切れのトークンです" };
  }

  return { success: true, email: verification.email };
}

/**
 * メールアドレスを認証済みにする
 */
export async function markEmailAsVerified(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email.toLowerCase()));

    // 使用済みトークンを削除
    await db.delete(emailVerifications).where(eq(emailVerifications.email, email.toLowerCase()));

    return { success: true };
  } catch (error) {
    console.error("Failed to mark email as verified:", error);
    return { success: false, error: "メール認証の更新に失敗しました" };
  }
}

/**
 * ユーザーのメールが認証済みかどうかをチェック
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  return user?.emailVerified !== null;
}
