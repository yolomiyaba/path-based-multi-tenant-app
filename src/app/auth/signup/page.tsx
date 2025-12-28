"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, FormEvent, Suspense } from "react";
import { getUserTenantIds, createUser } from "@/lib/actions/user-actions";

type Step = "choose" | "license" | "otp" | "payment" | "tenant";

function SignupContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 新規アカウント作成用
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  // フロー
  const [step, setStep] = useState<Step>("choose");
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseKeyId, setLicenseKeyId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  // テナント作成用
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // URLパラメータから課金完了を検知
  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");
    if (paymentStatus === "success") {
      setStep("tenant");
      setSuccess("お支払いが完了しました。テナントを作成してください。");
    } else if (paymentStatus === "cancelled") {
      setError("お支払いがキャンセルされました。");
    } else if (paymentStatus === "error") {
      const errorMessage = searchParams?.get("error");
      setError(errorMessage || "お支払い処理中にエラーが発生しました。");
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    // ログイン済みの場合
    if (status === "authenticated" && session?.user?.email) {
      // 既にテナントに所属している場合はリダイレクト
      const checkTenants = async () => {
        const tenants = await getUserTenantIds(session.user!.email!);
        if (tenants.length > 0) {
          router.push("/auth/redirect");
        }
      };
      checkTenants();
    }
  }, [session, status, router]);

  // 新規アカウント作成
  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await createUser(
        registerEmail,
        registerPassword,
        registerName
      );

      if (result.success) {
        if (result.requiresVerification) {
          setSuccess(
            "アカウントを作成しました。メールアドレスに確認メールを送信しました。メール内のリンクをクリックして認証を完了してください。"
          );
        } else {
          const signInResult = await signIn("credentials", {
            email: registerEmail,
            password: registerPassword,
            redirect: false,
          });

          if (signInResult?.ok) {
            router.push("/auth/redirect");
          } else {
            setSuccess(
              "アカウントを作成しました。ログインページからログインしてください。"
            );
          }
        }
      } else {
        setError(result.error || "アカウント作成に失敗しました");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ライセンスキー検証・OTP送信
  const handleLicenseSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: licenseKey }),
      });

      const data = await res.json();

      if (data.success) {
        setLicenseKeyId(data.licenseKeyId);
        setStep("otp");
        setSuccess("認証コードをメールに送信しました");
      } else {
        setError(data.error || "ライセンスキーの検証に失敗しました");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP検証
  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/license/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKeyId, otp }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("tenant");
        setSuccess("認証が完了しました。テナントを作成してください");
      } else {
        setError(data.error || "認証コードの検証に失敗しました");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 課金セッション作成
  const handlePayment = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "standard" }),
      });

      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        // 課金ページへリダイレクト
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "課金セッションの作成に失敗しました");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // テナント作成
  const handleCreateTenant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenantId,
          tenantName: tenantName || tenantId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("テナントを作成しました。ダッシュボードへ移動します...");
        // isLoadingをtrueのまま維持して連打を防止
        window.location.href = `/${data.tenantId}/dashboard`;
      } else {
        setError(data.error || "テナント作成に失敗しました");
        setIsLoading(false);
      }
    } catch (err) {
      setError("エラーが発生しました");
      setIsLoading(false);
    }
  };

  // OTP再送信
  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: licenseKey }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("認証コードを再送信しました");
      } else {
        setError(data.error || "認証コードの送信に失敗しました");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 未ログイン時: 新規アカウント作成画面
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              アカウント作成
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              新しいアカウントを作成してください
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                名前
              </label>
              <input
                id="name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="山田 太郎"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="8文字以上"
                required
                minLength={8}
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "処理中..." : "アカウントを作成"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
                または
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
              Googleで登録
            </button>
            <button
              onClick={() => signIn("azure-ad", { callbackUrl: "/auth/redirect" })}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Microsoftで登録
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/auth/signin")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              既にアカウントをお持ちの方はこちら
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ログイン済み時: テナント作成フロー
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            テナントを作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {session?.user?.email} としてログイン中
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-800 dark:text-green-200">
              {success}
            </div>
          </div>
        )}

        {/* Step: 選択画面 */}
        {step === "choose" && (
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              テナントを作成するには、ライセンスキーまたはお支払いが必要です
            </p>

            <div className="space-y-4">
              {/* ライセンスキー入力 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  ライセンスキーをお持ちの方
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  請求書払いでお申し込みいただいた方はこちら
                </p>
                <button
                  onClick={() => setStep("license")}
                  className="w-full flex justify-center py-2 px-4 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ライセンスキーを入力
                </button>
              </div>

              {/* 課金 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  今すぐ購入
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  クレジットカードでお支払い
                </p>
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "処理中..." : "お支払いへ進む"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: ライセンスキー入力 */}
        {step === "license" && (
          <form onSubmit={handleLicenseSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="licenseKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                ライセンスキー
              </label>
              <input
                id="licenseKey"
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="ライセンスキーを入力"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 font-mono"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                お申し込み時にお送りしたライセンスキーを入力してください
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "確認中..." : "次へ"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                戻る
              </button>
            </div>
          </form>
        )}

        {/* Step: OTP入力 */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                認証コード
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6桁の認証コード"
                required
                maxLength={6}
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 font-mono text-center text-2xl tracking-widest"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                メールに送信された6桁の認証コードを入力してください
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "確認中..." : "認証する"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                認証コードを再送信
              </button>
            </div>
          </form>
        )}

        {/* Step: テナント作成 */}
        {step === "tenant" && (
          <form onSubmit={handleCreateTenant} className="space-y-6">
            <div>
              <label
                htmlFor="tenantId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                テナントID
              </label>
              <input
                id="tenantId"
                type="text"
                value={tenantId}
                onChange={(e) =>
                  setTenantId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="例: my-company"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                URLに使用されます（英小文字、数字、ハイフンのみ）
              </p>
            </div>
            <div>
              <label
                htmlFor="tenantName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                テナント名（任意）
              </label>
              <input
                id="tenantName"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="例: マイカンパニー株式会社"
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                表示用の名前です。空欄の場合はテナントIDが使用されます
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || tenantId.length < 3}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "作成中..." : "テナントを作成"}
            </button>
          </form>
        )}

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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
