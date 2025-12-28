import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { db } from "@/lib/db";
import { tenants, users, userTenants, licenseKeys, licenseKeyOtps } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { markLicenseKeyAsUsed } from "@/lib/license-keys";

// 予約済みパス（テナントIDとして使用不可）
const RESERVED_PATHS = [
  "auth",
  "api",
  "tenants",
  "admin",
  "signup",
  "signin",
  "signout",
  "login",
  "logout",
  "register",
  "settings",
  "profile",
  "dashboard",
  "help",
  "support",
  "docs",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
  "select-tenant",
];

/**
 * テナントIDのバリデーション
 */
function validateTenantId(tenantId: string): { valid: boolean; error?: string } {
  // 長さチェック
  if (tenantId.length < 3 || tenantId.length > 50) {
    return { valid: false, error: "テナントIDは3〜50文字で入力してください" };
  }

  // 英数字とハイフンのみ許可
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(tenantId)) {
    return {
      valid: false,
      error: "テナントIDは英小文字、数字、ハイフンのみ使用できます（先頭と末尾はハイフン不可）",
    };
  }

  // 連続ハイフンチェック
  if (/--/.test(tenantId)) {
    return { valid: false, error: "連続したハイフンは使用できません" };
  }

  // 予約語チェック
  if (RESERVED_PATHS.includes(tenantId.toLowerCase())) {
    return { valid: false, error: "このテナントIDは使用できません" };
  }

  return { valid: true };
}

/**
 * POST /api/tenants/create
 * 新しいテナントを作成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(getGlobalAuthOptions());
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { tenantId, tenantName } = await request.json();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "テナントIDが必要です" },
        { status: 400 }
      );
    }

    // テナントID正規化（小文字に変換）
    const normalizedTenantId = tenantId.toLowerCase().trim();

    // バリデーション
    const validation = validateTenantId(normalizedTenantId);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 同一IDのテナントが存在しないかチェック
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, normalizedTenantId),
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: "このテナントIDは既に使用されています" },
        { status: 400 }
      );
    }

    // ユーザーが有効なライセンス（OTP認証済み）を持っているかチェック
    const email = session.user.email.toLowerCase();
    const license = await db.query.licenseKeys.findFirst({
      where: and(
        eq(licenseKeys.email, email),
        isNull(licenseKeys.usedAt),
        gt(licenseKeys.expiresAt, new Date())
      ),
    });

    if (!license) {
      return NextResponse.json(
        { success: false, error: "有効なライセンスキーがありません" },
        { status: 403 }
      );
    }

    // そのライセンスキーに対する認証済みOTPがあるかチェック
    const verifiedOtp = await db.query.licenseKeyOtps.findFirst({
      where: and(
        eq(licenseKeyOtps.licenseKeyId, license.id),
        gt(licenseKeyOtps.verifiedAt, new Date(0))
      ),
    });

    if (!verifiedOtp) {
      return NextResponse.json(
        { success: false, error: "ライセンスキーのOTP認証が完了していません" },
        { status: 403 }
      );
    }

    // ユーザーを取得（存在しなければ作成）
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: session.user.name || null,
          emailVerified: new Date(), // OAuth経由なので認証済み
        })
        .returning();
      user = newUser;
    }

    // テナントを作成
    await db.insert(tenants).values({
      id: normalizedTenantId,
      name: tenantName || normalizedTenantId,
    });

    // ユーザーをテナントのオーナーとして追加
    await db.insert(userTenants).values({
      userId: user.id,
      tenantId: normalizedTenantId,
      role: "owner",
    });

    // ライセンスキーを使用済みにする
    await markLicenseKeyAsUsed(license.id, user.id);

    return NextResponse.json({
      success: true,
      tenantId: normalizedTenantId,
      message: "テナントを作成しました",
    });
  } catch (error) {
    console.error("Tenant creation error:", error);
    return NextResponse.json(
      { success: false, error: "テナント作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
