import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { getUserTenantIdsDirect } from "@/lib/users";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(getGlobalAuthOptions());

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/profile");
  }

  // ユーザーの所属テナント情報を取得
  const userTenantIds = await getUserTenantIdsDirect(session.user.email);
  const userTenants =
    userTenantIds.length > 0
      ? await db.query.tenants.findMany({
          where: inArray(tenants.id, userTenantIds),
        })
      : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            プロフィール
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            アカウント情報を確認できます
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            基本情報
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                メールアドレス
              </label>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                {session.user.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                名前
              </label>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                {session.user.name || "未設定"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            所属テナント
          </h3>
          {userTenants.length > 0 ? (
            <div className="space-y-2">
              {userTenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/${tenant.id}/dashboard`}
                  className="block px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tenant.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {tenant.id}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              所属しているテナントがありません
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Link
            href="/tenants"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            テナント選択に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
