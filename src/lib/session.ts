import { getServerSession } from "next-auth";
import { getAuthOptions } from "./auth";
import type { Session } from "next-auth";

/**
 * サーバーサイドでセッションを取得
 * テナントIDに対応したセッションを取得します
 */
export async function getServerSessionForTenant(
  tenantId: string
): Promise<Session | null> {
  const authOptions = getAuthOptions(tenantId);
  return await getServerSession(authOptions);
}

