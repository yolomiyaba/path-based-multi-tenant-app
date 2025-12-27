"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserTenantIds } from "@/lib/users";

export default function SelectTenantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<string[]>([]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" || !session?.user?.email) {
      router.push("/auth/signin");
      return;
    }

    const userTenants = getUserTenantIds(session.user.email);

    if (userTenants.length === 0) {
      router.push("/auth/signup");
    } else if (userTenants.length === 1) {
      router.push(`/${userTenants[0]}/dashboard`);
    } else {
      setTenants(userTenants);
    }
  }, [session, status, router]);

  const handleTenantSelect = (tenantId: string) => {
    // テナントIDをクッキーに保存してからリダイレクト
    document.cookie = `auth_tenant_id=${tenantId}; path=/; max-age=1800; SameSite=Lax`;
    router.push(`/${tenantId}/dashboard`);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (status === "loading" || tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            テナントを選択
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {session?.user?.email} としてログイン中
          </p>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-500">
            アクセスするテナントを選択してください
          </p>
        </div>

        <div className="space-y-4">
          {tenants.map((tenantId) => (
            <button
              key={tenantId}
              onClick={() => handleTenantSelect(tenantId)}
              className="w-full flex items-center justify-between px-4 py-4 border border-gray-300 dark:border-gray-700 rounded-lg text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {tenantId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tenantId}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    テナントにアクセス
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            別のアカウントでログイン
          </button>
        </div>
      </div>
    </div>
  );
}
