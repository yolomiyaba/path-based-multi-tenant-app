import { getServerSessionForTenant } from "@/lib/session";
import { isUserBelongsToTenant } from "@/lib/users";
import { redirect } from "next/navigation";
import { ServerSessionInfo } from "@/components/ServerSessionInfo";

interface DashboardPageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenantId } = await params;

  // セッションを取得（テナント固有認証とグローバル認証の両方に対応）
  const session = await getServerSessionForTenant(tenantId);

  // 未認証の場合はリダイレクト
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/${tenantId}/dashboard`);
  }

  // ユーザーがこのテナントに所属しているか確認
  if (!isUserBelongsToTenant(session.user.email, tenantId)) {
    // 所属していない場合はテナント選択ページへ
    redirect("/tenants");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ダッシュボード
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ようこそ、<span className="font-semibold">{session.user.name || session.user.email}</span>さん
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          テナントID: <span className="font-mono font-semibold">{tenantId}</span>
        </p>
      </div>

      <ServerSessionInfo tenantId={tenantId} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            統計情報
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            テナント固有の統計情報がここに表示されます
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            設定
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            テナント設定を管理できます
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ユーザー管理
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            テナントのユーザーを管理できます
          </p>
        </div>
      </div>
    </div>
  );
}

