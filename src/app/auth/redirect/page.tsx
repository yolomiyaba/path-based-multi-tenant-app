"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getUserTenantIds, isUserBelongsToTenant } from "@/lib/users";

/**
 * クッキーからcallbackUrlを取得してクリア
 */
function getAndClearCallbackUrl(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "auth_callback_url" && value) {
      // クッキーをクリア
      document.cookie = "auth_callback_url=; path=/; max-age=0; SameSite=Lax";
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * callbackUrlからテナントIDを抽出
 */
function extractTenantFromCallback(callbackUrl: string): string | null {
  const match = callbackUrl.match(/^\/([^\/]+)/);
  if (match && match[1] && !["auth", "tenants", "api"].includes(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * ハードナビゲーションでリダイレクト
 * router.pushだとクライアントサイドのセッションが古いままになる問題を回避
 */
function hardRedirect(url: string) {
  window.location.href = url;
}

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("認証情報を確認中...");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" || !session?.user?.email) {
      setMessage("認証されていません。ログインページにリダイレクトします...");
      hardRedirect("/auth/signin");
      return;
    }

    const email = session.user.email;
    const tenants = getUserTenantIds(email);
    const callbackUrl = getAndClearCallbackUrl();

    // callbackUrlがある場合、そのテナントへのアクセス権があればリダイレクト
    if (callbackUrl) {
      const targetTenant = extractTenantFromCallback(callbackUrl);
      if (targetTenant && isUserBelongsToTenant(email, targetTenant)) {
        setMessage(`${callbackUrl} にリダイレクトします...`);
        hardRedirect(callbackUrl);
        return;
      }
    }

    // callbackUrlがない、または無効な場合は通常のフロー
    if (tenants.length === 0) {
      // 未登録ユーザー → 会員登録ページへ
      setMessage("アカウントが見つかりません。登録ページにリダイレクトします...");
      hardRedirect("/auth/signup");
    } else if (tenants.length === 1) {
      // 1つのテナントのみ → そのテナントのダッシュボードへ
      setMessage(`${tenants[0]} にリダイレクトします...`);
      hardRedirect(`/${tenants[0]}/dashboard`);
    } else {
      // 複数テナント → テナント選択ページへ
      setMessage("テナント選択ページにリダイレクトします...");
      hardRedirect("/tenants");
    }
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
