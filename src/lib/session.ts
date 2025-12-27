import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "./auth-global";
import type { Session } from "next-auth";

/**
 * サーバーサイドでセッションを取得
 * グローバル認証のみ使用
 */
export async function getServerSessionForTenant(
  tenantId: string
): Promise<Session | null> {
  const authOptions = getGlobalAuthOptions();
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    // tenantIdを付与して返す（URLパスから取得したtenantId）
    return {
      ...session,
      user: {
        ...session.user,
        tenantId: tenantId,
      },
    };
  }

  return null;
}
