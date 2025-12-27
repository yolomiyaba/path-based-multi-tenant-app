import { getAuthOptions } from "@/lib/auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { cookies } from "next/headers";
import NextAuth from "next-auth";

/**
 * テナント固有のNextAuth設定を生成
 */
function createTenantAuthOptions(tenantId: string) {
    const authOptions = getAuthOptions(tenantId);

    return {
        ...authOptions,
        callbacks: {
            ...authOptions.callbacks,
            async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
                // リダイレクト時にテナントIDを含める
                if (url.startsWith("/")) {
                    // 既にテナントIDが含まれている場合はそのまま返す
                    if (url.startsWith(`/${tenantId}`)) {
                        return url;
                    }
                    return `/${tenantId}${url}`;
                }
                if (new URL(url).origin === baseUrl) {
                    const pathname = new URL(url).pathname;
                    // 既にテナントIDが含まれている場合はそのまま返す
                    if (pathname.startsWith(`/${tenantId}`)) {
                        return url;
                    }
                    return `${baseUrl}/${tenantId}${pathname}`;
                }
                return `${baseUrl}/${tenantId}`;
            },
        },
    };
}

/**
 * テナントIDを取得してハンドラーを返す
 * - auth_tenant_id クッキーがある場合: テナント固有の認証
 * - クッキーがない場合: グローバル認証（テナント非指定）
 */
async function getHandler() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("auth_tenant_id")?.value;

    console.log("[NextAuth] auth_tenant_id cookie:", tenantId || "(not set)");

    if (tenantId) {
        // テナント指定ログイン（既存のフロー）
        console.log("[NextAuth] Using tenant-specific auth for:", tenantId);
        const authOptions = createTenantAuthOptions(tenantId);
        return NextAuth(authOptions);
    } else {
        // テナント非指定ログイン（新しいグローバルフロー）
        console.log("[NextAuth] Using global auth (no tenant specified)");
        const authOptions = getGlobalAuthOptions();
        return NextAuth(authOptions);
    }
}

// NextAuth v4 App Router: NextAuth()は直接ハンドラー関数を返す
export async function GET(
    req: Request,
    context: { params: Promise<{ nextauth: string[] }> }
) {
    const handler = await getHandler();
    return handler(req, context);
}

export async function POST(
    req: Request,
    context: { params: Promise<{ nextauth: string[] }> }
) {
    const handler = await getHandler();
    return handler(req, context);
}
