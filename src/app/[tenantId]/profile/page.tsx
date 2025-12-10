import { getServerSessionForTenant } from "@/lib/session";
import { redirect } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { tenantId } = await params;
  
  // セッションを取得
  const session = await getServerSessionForTenant(tenantId);

  // 未認証の場合はリダイレクト
  if (!session) {
    redirect(`/${tenantId}/auth/signin?callbackUrl=/${tenantId}/profile`);
  }

  // セッションのテナントIDとパスのテナントIDが一致するか確認
  if (session.user.tenantId !== tenantId) {
    redirect(`/${tenantId}/auth/signin?callbackUrl=/${tenantId}/profile`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          プロフィール
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ユーザープロフィール情報を管理します
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          基本情報
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ユーザーID
            </label>
            <div className="font-mono text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
              {session.user.id}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              メールアドレス
            </label>
            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
              {session.user.email || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名前
            </label>
            <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
              {session.user.name || "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              テナントID
            </label>
            <div className="font-mono text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
              {session.user.tenantId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

