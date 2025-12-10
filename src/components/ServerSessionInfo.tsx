import { getServerSessionForTenant } from "@/lib/session";

interface ServerSessionInfoProps {
  tenantId: string;
}

export async function ServerSessionInfo({ tenantId }: ServerSessionInfoProps) {
  const session = await getServerSessionForTenant(tenantId);

  if (!session) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          セッション情報（サーバーサイド）
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          ログインしていません
        </p>
        <a
          href={`/${tenantId}/auth/signin`}
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          サインイン →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        セッション情報（サーバーサイド）
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
  );
}

