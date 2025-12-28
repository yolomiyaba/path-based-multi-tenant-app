"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const redirectUrl = searchParams.get("redirect");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("認証トークンが見つかりません");
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("メールアドレスが確認されました");
          // 3秒後にリダイレクト（redirectUrlがあればそこへ、なければサインインページへ）
          setTimeout(() => {
            window.location.href = redirectUrl || "/auth/signin";
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "認証に失敗しました");
        }
      } catch {
        setStatus("error");
        setMessage("認証処理中にエラーが発生しました");
      }
    }

    verify();
  }, [token, redirectUrl]);

  return (
    <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
      {status === "loading" && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900">確認中...</h1>
          <p className="text-gray-600 mt-2">メールアドレスを確認しています</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{message}</h1>
          <p className="text-gray-600 mt-2">
            3秒後にサインインページへ移動します...
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            今すぐサインインページへ
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">認証エラー</h1>
          <p className="text-red-600 mt-2">{message}</p>
          <div className="mt-6 space-y-2">
            <Link
              href="/auth/signup"
              className="block text-blue-600 hover:text-blue-800"
            >
              新規登録ページへ
            </Link>
            <Link
              href="/auth/signin"
              className="block text-blue-600 hover:text-blue-800"
            >
              サインインページへ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h1 className="text-xl font-semibold text-gray-900">読み込み中...</h1>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<LoadingFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
