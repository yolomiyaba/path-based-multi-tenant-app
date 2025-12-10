"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantId = params?.tenantId as string;
  const error = searchParams?.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "認証設定に問題があります。";
      case "AccessDenied":
        return "アクセスが拒否されました。";
      case "Verification":
        return "認証トークンの検証に失敗しました。";
      default:
        return "認証中にエラーが発生しました。";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            認証エラー
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            テナント: <span className="font-mono font-semibold">{tenantId}</span>
          </p>
        </div>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-800 dark:text-red-200">
            {getErrorMessage(error)}
          </div>
        </div>
        <div className="text-center">
          <Link
            href={`/${tenantId}/auth/signin`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            サインインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

