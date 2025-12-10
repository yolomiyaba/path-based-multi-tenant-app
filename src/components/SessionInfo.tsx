"use client";

import { useTenantSession } from "@/hooks/useTenantSession";
import { useParams } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export function SessionInfo() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { data: session, status } = useTenantSession();

  if (status === "loading") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          セッション情報
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
        セッション情報
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
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <LogoutButton />
      </div>
    </div>
  );
}

