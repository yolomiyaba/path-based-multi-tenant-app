"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Connection = {
  id: string;
  provider: string;
  email: string;
  scopes: string;
  createdAt: string;
  updatedAt: string;
};

type ServiceType = "mail" | "calendar";

export function OAuthConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();

  const fetchConnections = useCallback(async () => {
    try {
      const response = await fetch("/api/oauth/connections");
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_connected") {
      setMessage({ type: "success", text: "Googleアカウントを連携しました" });
      fetchConnections();
    } else if (success === "microsoft_connected") {
      setMessage({ type: "success", text: "Microsoftアカウントを連携しました" });
      fetchConnections();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: "連携がキャンセルされました",
        invalid_request: "無効なリクエストです",
        invalid_state: "セッションが無効です。もう一度お試しください",
        token_exchange_failed: "認証に失敗しました",
        userinfo_failed: "ユーザー情報の取得に失敗しました",
        user_not_found: "ユーザーが見つかりません",
        unknown_error: "エラーが発生しました",
      };
      setMessage({ type: "error", text: errorMessages[error] || "エラーが発生しました" });
    }

    // URLからパラメータを削除
    if (success || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, fetchConnections]);

  const handleConnect = (provider: "google" | "microsoft", service: ServiceType) => {
    window.location.href = `/api/oauth/connect/${provider}?scope=${service}`;
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`${provider === "google" ? "Google" : "Microsoft"}との連携を解除しますか？`)) {
      return;
    }

    setDisconnecting(provider);
    try {
      const response = await fetch("/api/oauth/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "連携を解除しました" });
        fetchConnections();
      } else {
        setMessage({ type: "error", text: "連携の解除に失敗しました" });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      setMessage({ type: "error", text: "エラーが発生しました" });
    } finally {
      setDisconnecting(null);
    }
  };

  const getConnection = (provider: string) => {
    return connections.find((c) => c.provider === provider);
  };

  const hasScope = (connection: Connection | undefined, scope: ServiceType) => {
    if (!connection) return false;
    return connection.scopes.split(",").includes(scope);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          連携サービス
        </h3>
        <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const googleConnection = getConnection("google");
  const microsoftConnection = getConnection("microsoft");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        連携サービス
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        メールやカレンダーと連携して、情報を取得できます
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* メール連携 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            メール
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gmail */}
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <GoogleIcon />
                <span className="font-medium text-gray-900 dark:text-white">Gmail</span>
              </div>
              {hasScope(googleConnection, "mail") ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    連携済み: {googleConnection?.email}
                  </p>
                  <button
                    onClick={() => handleDisconnect("google")}
                    disabled={disconnecting === "google"}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {disconnecting === "google" ? "解除中..." : "連携解除"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("google", "mail")}
                  className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  連携する
                </button>
              )}
            </div>

            {/* Outlook */}
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <MicrosoftIcon />
                <span className="font-medium text-gray-900 dark:text-white">Outlook</span>
              </div>
              {hasScope(microsoftConnection, "mail") ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    連携済み: {microsoftConnection?.email}
                  </p>
                  <button
                    onClick={() => handleDisconnect("microsoft")}
                    disabled={disconnecting === "microsoft"}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {disconnecting === "microsoft" ? "解除中..." : "連携解除"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("microsoft", "mail")}
                  className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  連携する
                </button>
              )}
            </div>
          </div>
        </div>

        {/* カレンダー連携 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            カレンダー
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Calendar */}
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <GoogleIcon />
                <span className="font-medium text-gray-900 dark:text-white">
                  Google カレンダー
                </span>
              </div>
              {hasScope(googleConnection, "calendar") ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    連携済み: {googleConnection?.email}
                  </p>
                  <button
                    onClick={() => handleDisconnect("google")}
                    disabled={disconnecting === "google"}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {disconnecting === "google" ? "解除中..." : "連携解除"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("google", "calendar")}
                  className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  連携する
                </button>
              )}
            </div>

            {/* Outlook Calendar */}
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <MicrosoftIcon />
                <span className="font-medium text-gray-900 dark:text-white">
                  Outlook カレンダー
                </span>
              </div>
              {hasScope(microsoftConnection, "calendar") ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    連携済み: {microsoftConnection?.email}
                  </p>
                  <button
                    onClick={() => handleDisconnect("microsoft")}
                    disabled={disconnecting === "microsoft"}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  >
                    {disconnecting === "microsoft" ? "解除中..." : "連携解除"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("microsoft", "calendar")}
                  className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  連携する
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
