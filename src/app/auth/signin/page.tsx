"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, FormEvent, Suspense, useEffect } from "react";

/**
 * callbackUrl をクッキーに保存
 * 認証後のリダイレクト先として使用
 */
function saveCallbackUrl(callbackUrl: string | null) {
  if (callbackUrl) {
    document.cookie = `auth_callback_url=${encodeURIComponent(callbackUrl)}; path=/; max-age=1800; SameSite=Lax`;
  } else {
    document.cookie = "auth_callback_url=; path=/; max-age=0; SameSite=Lax";
  }
}

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl");

  // ページ読み込み時にcallbackUrlを保存
  useEffect(() => {
    saveCallbackUrl(callbackUrl);
  }, [callbackUrl]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      // redirect: false を使用して手動でリダイレクト
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("メールアドレスまたはパスワードが正しくありません");
        setIsLoading(false);
      } else if (result?.ok) {
        // 認証成功 → ハードリダイレクトでセッションを確実に反映
        window.location.href = "/auth/redirect";
      }
    } catch (err) {
      setFormError("ログイン中にエラーが発生しました");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsLoading(true);

    try {
      await signIn("google", {
        callbackUrl: "/auth/redirect",
        redirect: true,
      });
    } catch (err) {
      setFormError("Google認証中にエラーが発生しました");
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setFormError(null);
    setIsLoading(true);

    try {
      await signIn("azure-ad", {
        callbackUrl: "/auth/redirect",
        redirect: true,
      });
    } catch (err) {
      setFormError("Microsoft認証中にエラーが発生しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            サインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            アカウントにログインしてください
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(formError || error) && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-800 dark:text-red-200">
                {formError || (error === "CredentialsSignin" ? "メールアドレスまたはパスワードが正しくありません" : error)}
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "ログイン中..." : "メールアドレスでサインイン"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  または
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでサインイン
            </button>

            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Microsoftでサインイン
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="text-center">
              デモ用の認証情報:
            </p>
            <p className="text-center font-mono text-xs mt-1">
              Email: admin@example.com / Password: password
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
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
      <SignInContent />
    </Suspense>
  );
}
