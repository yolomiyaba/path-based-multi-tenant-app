import { getServerSessionForTenant } from "@/lib/session";
import { redirect } from "next/navigation";

interface SettingsPageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tenantId } = await params;
  
  // セッションを取得
  const session = await getServerSessionForTenant(tenantId);

  // 未認証の場合はリダイレクト
  if (!session) {
    redirect(`/${tenantId}/auth/signin?callbackUrl=/${tenantId}/settings`);
  }

  // セッションのテナントIDとパスのテナントIDが一致するか確認
  if (session.user.tenantId !== tenantId) {
    redirect(`/${tenantId}/auth/signin?callbackUrl=/${tenantId}/settings`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          設定
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          テナント設定を管理します
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ユーザー情報
        </h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              ユーザーID:
            </span>
            <span className="ml-2 font-mono text-sm text-gray-900 dark:text-white">
              {session.user.id}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              メールアドレス:
            </span>
            <span className="ml-2 text-sm text-gray-900 dark:text-white">
              {session.user.email || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              名前:
            </span>
            <span className="ml-2 text-sm text-gray-900 dark:text-white">
              {session.user.name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              テナントID:
            </span>
            <span className="ml-2 font-mono text-sm text-gray-900 dark:text-white">
              {session.user.tenantId}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          テナント設定
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          テナント固有の設定項目がここに表示されます
        </p>
      </div>
    </div>
  );
}

