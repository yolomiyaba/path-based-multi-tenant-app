import { ServerSessionInfo } from "@/components/ServerSessionInfo";
import { SessionInfo } from "@/components/SessionInfo";

interface TenantPageProps {
    params: Promise<{
        tenantId: string;
    }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
    const { tenantId } = await params;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    ダッシュボード
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    現在のテナントID: <span className="font-mono font-semibold">{tenantId}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ServerSessionInfo tenantId={tenantId} />
                <SessionInfo />
            </div>

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

