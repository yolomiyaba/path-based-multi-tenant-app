"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { getValidTenants } from "@/lib/tenants";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "";

  const validTenants = getValidTenants();

  const handleTenantSelect = (tenantId: string) => {
    const url = callbackUrl
      ? `/${tenantId}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : `/${tenantId}/auth/signin`;
    router.push(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            サインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            テナントを選択してください
          </p>
        </div>

        <div className="space-y-4">
          {validTenants.map((tenantId) => (
            <button
              key={tenantId}
              onClick={() => handleTenantSelect(tenantId)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {tenantId}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  テナントにログイン
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="text-center">
            テナントを選択すると、そのテナントのログイン画面に移動します
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

