"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import { useParams } from "next/navigation";
import type { Session } from "next-auth";

/**
 * テナント対応のセッションフック
 * クライアントサイドでセッションを取得します
 * グローバル認証に対応（セッションにtenantIdがなくても有効）
 *
 * @param tenantId - テナントID（省略時はURLパラメータから取得）
 */
export function useTenantSession(tenantId?: string) {
    const params = useParams();
    const resolvedTenantId = tenantId || (params?.tenantId as string);
    const { data: session, status } = useNextAuthSession();

    // グローバル認証: セッションがあればOK（tenantIdチェック不要）
    // テナント所属チェックはサーバーサイドで行う
    if (status === "loading") {
        return {
            data: null,
            status: "loading" as const,
        };
    }

    if (session?.user?.email) {
        // セッションがあれば、tenantIdを付与して返す
        const tenantSession: Session = {
            ...session,
            user: {
                ...session.user,
                tenantId: resolvedTenantId,
            },
        };
        return {
            data: tenantSession,
            status: "authenticated" as const,
        };
    }

    return {
        data: null,
        status: "unauthenticated" as const,
    };
}

