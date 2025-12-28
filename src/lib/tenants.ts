/**
 * テナント管理用のユーティリティ関数
 */

import { db } from "./db";
import { tenants } from "./db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * テナントIDが有効かどうかをチェック
 */
export const isValidTenant = unstable_cache(
  async (tenantId: string): Promise<boolean> => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    return tenant !== undefined;
  },
  ["valid-tenant"],
  { revalidate: 60 }
);

/**
 * すべての有効なテナントIDを取得
 */
export const getValidTenants = unstable_cache(
  async (): Promise<string[]> => {
    const allTenants = await db.query.tenants.findMany();
    return allTenants.map((t) => t.id);
  },
  ["all-tenants"],
  { revalidate: 60 }
);
