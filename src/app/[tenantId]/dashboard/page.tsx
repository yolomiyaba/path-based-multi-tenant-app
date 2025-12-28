import Link from "next/link";
import { getServerSessionForTenant } from "@/lib/session";

interface DashboardPageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenantId } = await params;

  // セッションを取得（認証・テナント所属チェックはレイアウトで実施済み）
  const session = await getServerSessionForTenant(tenantId);

  // レイアウトで認証チェック済みなのでsessionは必ず存在する
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ダッシュボード
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ようこそ、<span className="font-semibold">{user?.name || user?.email}</span>さん
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          テナントID: <span className="font-mono font-semibold">{tenantId}</span>
        </p>
      </div>

      <div>
        <Link
          href={`/${tenantId}/settings`}
          className="inline-block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            設定
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            テナント設定を管理できます
          </p>
        </Link>
      </div>
    </div>
  );
}

