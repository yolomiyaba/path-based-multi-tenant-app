"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "サーバーの設定に問題があります。管理者にお問い合わせください。";
      case "AccessDenied":
        return "アクセスが拒否されました。このテナントへのアクセス権限がありません。";
      case "Verification":
        return "認証リンクの有効期限が切れているか、既に使用されています。";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "OAuthAccountNotLinked":
        return "OAuth認証中にエラーが発生しました。別の方法でログインしてください。";
      case "EmailCreateAccount":
      case "EmailSignin":
        return "メールでのログイン中にエラーが発生しました。";
      case "CredentialsSignin":
        return "メールアドレスまたはパスワードが正しくありません。";
      case "SessionRequired":
        return "このページにアクセスするにはログインが必要です。";
      default:
        return "認証中にエラーが発生しました。もう一度お試しください。";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            認証エラー
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {getErrorMessage(error)}
          </p>
          {error && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              エラーコード: {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ログインページに戻る
          </Link>
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-pulse text-gray-600 dark:text-gray-400">
            読み込み中...
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
