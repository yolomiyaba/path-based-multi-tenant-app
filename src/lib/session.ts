import { getServerSession } from "next-auth";
import { getAuthOptions } from "./auth";
import { getGlobalAuthOptions } from "./auth-global";
import type { Session } from "next-auth";

/**
 * サーバーサイドでセッションを取得
 * テナント固有認証とグローバル認証の両方に対応
 */
export async function getServerSessionForTenant(
  tenantId: string
): Promise<Session | null> {
  // まずテナント固有のセッションを試す
  const tenantAuthOptions = getAuthOptions(tenantId);
  const tenantSession = await getServerSession(tenantAuthOptions);

  if (tenantSession?.user?.tenantId === tenantId) {
    return tenantSession;
  }

  // テナント固有セッションがない場合、グローバルセッションを試す
  const globalAuthOptions = getGlobalAuthOptions();
  const globalSession = await getServerSession(globalAuthOptions);

  if (globalSession?.user?.email) {
    // グローバルセッションがある場合、tenantIdを付与して返す
    return {
      ...globalSession,
      user: {
        ...globalSession.user,
        tenantId: tenantId, // パスのテナントIDを付与
      },
    };
  }

  return null;
}

