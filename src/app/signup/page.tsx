"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { getUserTenantIds } from "@/lib/users";

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invite" | "create">("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    // 未認証の場合はログインページへ
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // 既にテナントに所属している場合はリダイレクト
    if (session?.user?.email) {
      const tenants = getUserTenantIds(session.user.email);
      if (tenants.length > 0) {
        router.push("/auth/redirect");
      }
    }
  }, [session, status, router]);

  const handleInviteSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // TODO: 招待コードの検証APIを呼び出す
      // 現在はデモのため、特定のコードのみ受け付ける
      if (inviteCode === "DEMO-INVITE-CODE") {
        // 成功した場合はテナントに追加してリダイレクト
        setError("デモモードです。実際の招待機能は未実装です。");
      } else {
        setError("無効な招待コードです");
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // TODO: テナント作成APIを呼び出す
      if (newTenantName.length < 3) {
        setError("テナント名は3文字以上で入力してください");
      } else {
        // デモのため、エラーメッセージを表示
        setError("デモモードです。実際のテナント作成機能は未実装です。");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            アカウント登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {session?.user?.email} としてログイン中
          </p>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-500">
            テナントに参加するか、新しく作成してください
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "invite"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            招待コードで参加
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "create"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            テナントを作成
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        {/* 招待コードタブ */}
        {activeTab === "invite" && (
          <form onSubmit={handleInviteSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                招待コード
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="招待コードを入力"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                テナント管理者から受け取った招待コードを入力してください
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "処理中..." : "テナントに参加"}
            </button>
          </form>
        )}

        {/* テナント作成タブ */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="tenantName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                テナント名
              </label>
              <input
                id="tenantName"
                type="text"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="例: my-company"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                URLに使用されます（英数字とハイフンのみ）
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "処理中..." : "テナントを作成"}
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
