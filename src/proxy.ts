import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
 * セッションが存在するかチェック（グローバル認証）
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // トークンが存在し、メールアドレスがあれば有効なセッション
    return !!token?.email;
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
}

/**
 * テナントに依存しないグローバルパス
 */
const globalPaths = ["/auth", "/tenants"];

/**
 * パスがグローバルパスかどうかをチェック
 */
function isGlobalPath(pathname: string): boolean {
  return globalPaths.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // グローバルパス（/auth/, /signup, /select-tenant）はそのまま通過
  if (isGlobalPath(pathname)) {
    return NextResponse.next();
  }

  // テナント配下のパスかどうかをチェック
  const tenantId = extractTenantId(pathname);

  if (!tenantId) {
    // テナント配下でない場合はそのまま通過
    return NextResponse.next();
  }

  // テナントIDの検証はページ側で行う（ミドルウェアでは非同期DB接続が困難）
  // 無効なテナントの場合はページで404を返す

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
    const hasSession = await hasValidSession(request);

    if (!hasSession) {
      // セッションがない場合は、グローバルサインインページにリダイレクト
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // セッションがある場合は通過を許可
    // テナント所属チェックはページ側で行う
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

