import { getAuthOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import NextAuth from "next-auth";

/**
 * テナント固有のNextAuth設定を生成
 */
function createAuthOptions(tenantId: string) {
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
 * デフォルトのテナントID（フォールバック用）
 */
const DEFAULT_TENANT_ID = "tenant1";

/**
 * テナントIDを取得してハンドラーを返す
 */
async function getHandler() {
    const cookieStore = await cookies();
    const tenantId =
        cookieStore.get("auth_tenant_id")?.value || DEFAULT_TENANT_ID;
    const authOptions = createAuthOptions(tenantId);
    return NextAuth(authOptions);
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
