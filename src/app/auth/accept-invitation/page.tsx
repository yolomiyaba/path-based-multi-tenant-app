"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

interface InvitationInfo {
  tenantId: string;
  tenantName: string;
  email: string;
  role: string;
  inviterName: string | null;
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");

  const [pageStatus, setPageStatus] = useState<"loading" | "verify" | "accept" | "success" | "error">("loading");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 招待トークンを検証
  useEffect(() => {
    if (!token) {
      setPageStatus("error");
      setMessage("招待トークンが見つかりません");
      return;
    }

    async function verifyInvitation() {
      try {
        const response = await fetch(`/api/auth/verify-invitation?token=${token}`);
        const data = await response.json();

        if (data.success && data.invitation) {
          setInvitation(data.invitation);
          setPageStatus("verify");
        } else {
          setPageStatus("error");
          setMessage(data.error || "無効な招待です");
        }
      } catch {
        setPageStatus("error");
        setMessage("招待の検証中にエラーが発生しました");
      }
    }

    verifyInvitation();
  }, [token]);

  // ログイン状態が変わったらチェック
  useEffect(() => {
    if (pageStatus !== "verify" || !invitation) return;

    if (status === "authenticated" && session?.user?.email) {
      // ログイン済みの場合、メールアドレスをチェック
      if (session.user.email.toLowerCase() === invitation.email.toLowerCase()) {
        setPageStatus("accept");
      } else {
        setMessage(`この招待は ${invitation.email} 宛てです。正しいアカウントでログインしてください。`);
      }
    }
  }, [status, session, pageStatus, invitation]);

  // 招待を承認
  const handleAccept = async () => {
    if (!token) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setPageStatus("success");
        setMessage("テナントに参加しました！");
        // 3秒後にテナントダッシュボードへリダイレクト
        setTimeout(() => {
          router.push(`/${data.tenantId}/dashboard`);
        }, 2000);
      } else {
        setPageStatus("error");
        setMessage(data.error || "招待の承認に失敗しました");
      }
    } catch {
      setPageStatus("error");
      setMessage("招待の承認中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // ローディング中
  if (pageStatus === "loading") {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900">読み込み中...</h1>
      </div>
    );
  }

  // 招待の検証完了、ログイン待ち
  if (pageStatus === "verify" && invitation) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">テナントへの招待</h1>
        <p className="text-gray-600 mb-2">
          <strong>{invitation.inviterName || "管理者"}</strong>さんから
        </p>
        <p className="text-gray-900 text-lg font-semibold mb-6">
          {invitation.tenantName}
        </p>
        <p className="text-gray-600 mb-6">への招待が届いています。</p>

        {status === "loading" ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        ) : status === "unauthenticated" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              招待を承認するにはログインが必要です
            </p>
            <button
              onClick={() => signIn("credentials", { callbackUrl: window.location.href })}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ログイン
            </button>
            <button
              onClick={() => signIn("google", { callbackUrl: window.location.href })}
              className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleでログイン
            </button>
            <p className="text-sm text-gray-500">
              アカウントをお持ちでない方は
              <Link href={`/auth/signup?redirect=${encodeURIComponent(window.location.href)}`} className="text-blue-600 hover:underline">
                こちら
              </Link>
            </p>
          </div>
        ) : message ? (
          <div className="text-amber-600 mb-4">{message}</div>
        ) : null}
      </div>
    );
  }

  // ログイン済み、承認待ち
  if (pageStatus === "accept" && invitation) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">テナントへの招待</h1>
        <p className="text-gray-600 mb-2">
          <strong>{invitation.inviterName || "管理者"}</strong>さんから
        </p>
        <p className="text-gray-900 text-lg font-semibold mb-2">
          {invitation.tenantName}
        </p>
        <p className="text-gray-600 mb-6">
          への招待を承認しますか？
        </p>
        <p className="text-sm text-gray-500 mb-6">
          ロール: <span className="font-medium">{invitation.role}</span>
        </p>
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "処理中..." : "招待を承認してテナントに参加"}
        </button>
      </div>
    );
  }

  // 成功
  if (pageStatus === "success") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{message}</h1>
        <p className="text-gray-600 mt-2">ダッシュボードへ移動します...</p>
      </div>
    );
  }

  // エラー
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900">招待エラー</h1>
      <p className="text-red-600 mt-2">{message}</p>
      <div className="mt-6">
        <Link href="/auth/signin" className="text-blue-600 hover:underline">
          サインインページへ
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h1 className="text-xl font-semibold text-gray-900">読み込み中...</h1>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <Suspense fallback={<LoadingFallback />}>
          <AcceptInvitationContent />
        </Suspense>
      </div>
    </div>
  );
}
