import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isValidTenant } from "@/lib/tenants";
import { getAuthOptions } from "@/lib/auth";

/**
 * 認証が必要なパス（テナント配下）
 * これらのパスは認証が必要です
 */
const protectedPaths = ["/dashboard", "/settings", "/profile"];

/**
 * 認証が不要なパス（テナント配下でも認証不要）
 */
const publicPaths = ["/auth/signin", "/auth/signup", "/auth/error"];

/**
 * パスからテナントIDを抽出
 */
function extractTenantId(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * パスが保護されたパスかどうかをチェック
 */
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.includes(path));
}

/**
 * パスが公開パスかどうかをチェック
 */
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.includes(path));
}

/**
 * セッションからテナントIDを取得
 */
async function getTenantIdFromSession(
  request: NextRequest,
  tenantId: string
): Promise<string | null> {
  try {
    const authOptions = getAuthOptions(tenantId);
    const token = await getToken({
      req: request,
      secret: authOptions.secret,
    });

    return token?.tenantId as string | null;
  } catch (error) {
    console.error("Error getting tenant ID from session:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ルートレベルの/auth/パスはそのまま通過
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // テナント配下のパスかどうかをチェック
  const tenantId = extractTenantId(pathname);

  if (!tenantId) {
    // テナント配下でない場合はそのまま通過
    return NextResponse.next();
  }

  // テナントIDの検証
  if (!isValidTenant(tenantId)) {
    return NextResponse.json(
      { error: "Invalid tenant" },
      { status: 404 }
    );
  }

  // APIルート（認証エンドポイントなど）はそのまま通過
  if (pathname.includes("/api/")) {
    return NextResponse.next();
  }

  // 公開パスはそのまま通過
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 保護されたパスの場合、認証チェック
  if (isProtectedPath(pathname)) {
    const sessionTenantId = await getTenantIdFromSession(request, tenantId);

    // セッションがない場合は、サインインページにリダイレクト
    if (!sessionTenantId) {
      const signInUrl = new URL(`/${tenantId}/auth/signin`, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // セッションのテナントIDとパスのテナントIDが一致しない場合
    if (sessionTenantId !== tenantId) {
      return NextResponse.json(
        { error: "Tenant mismatch" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 以下のパスにマッチ:
     * - /[tenantId]で始まるすべてのパス
     * - APIルート（/api/で始まるパス）は除外
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

