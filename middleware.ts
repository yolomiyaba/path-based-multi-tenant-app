import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // リクエストヘッダーにパス名を追加（レイアウトで使用）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // 静的ファイルとAPIを除外
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
