import { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { HeaderAuth } from "@/components/HeaderAuth";
import { getServerSessionForTenant } from "@/lib/session";
import { getUserTenantIdsDirect } from "@/lib/users";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface TenantLayoutProps {
    children: ReactNode;
    params: Promise<{
        tenantId: string;
    }>;
}

// 認証不要のパス（テナント配下の認証ページ）
const PUBLIC_PATHS = ["/auth/signin", "/auth/error"];

export default async function TenantLayout({
    children,
    params,
}: TenantLayoutProps) {
    const { tenantId } = await params;

    // 現在のパスを取得
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isPublicPath = PUBLIC_PATHS.some((path) =>
        pathname.includes(`/${tenantId}${path}`)
    );

    // テナントが存在するかチェック
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
        notFound();
    }

    // 認証不要のパス以外はアクセス制御を適用
    if (!isPublicPath) {
        const session = await getServerSessionForTenant(tenantId);

        // 未認証の場合はログインページへ
        if (!session?.user?.email) {
            redirect(`/auth/signin?callbackUrl=/${tenantId}`);
        }

        // ユーザーがこのテナントに所属しているかチェック
        const userTenants = await getUserTenantIdsDirect(session.user.email);
        if (!userTenants.includes(tenantId)) {
            // 所属していない場合はテナント選択ページへ
            redirect("/tenants");
        }
    }

    return (
        <SessionProvider tenantId={tenantId}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                テナント: {tenant.name}
                            </h1>
                            <HeaderAuth />
                        </div>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </SessionProvider>
    );
}

