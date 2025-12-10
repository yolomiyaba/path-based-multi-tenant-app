"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";

/**
 * テナント対応のセッションフック
 * クライアントサイドでセッションを取得します
 * 
 * @param tenantId - テナントID（省略時はURLパラメータから取得）
 */
export function useTenantSession(tenantId?: string) {
  const params = useParams();
  const resolvedTenantId = tenantId || (params?.tenantId as string);
  const { data: session, status } = useNextAuthSession();

  const [tenantSession, setTenantSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resolvedTenantId) {
      setIsLoading(false);
      return;
    }

    // セッションのテナントIDと現在のテナントIDが一致するか確認
    if (session?.user?.tenantId === resolvedTenantId) {
      setTenantSession(session);
    } else {
      setTenantSession(null);
    }
    setIsLoading(status === "loading");
  }, [session, resolvedTenantId, status]);

  return {
    data: tenantSession,
    status: isLoading ? "loading" : tenantSession ? "authenticated" : "unauthenticated",
  };
}

