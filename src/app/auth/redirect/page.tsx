"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserTenantIds } from "@/lib/users";

export default function AuthRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("認証情報を確認中...");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" || !session?.user?.email) {
      setMessage("認証されていません。ログインページにリダイレクトします...");
      router.push("/auth/signin");
      return;
    }

    const email = session.user.email;
    const tenants = getUserTenantIds(email);

    if (tenants.length === 0) {
      // 未登録ユーザー → 会員登録ページへ
      setMessage("アカウントが見つかりません。登録ページにリダイレクトします...");
      router.push("/auth/signup");
    } else if (tenants.length === 1) {
      // 1つのテナントのみ → そのテナントのダッシュボードへ
      setMessage(`${tenants[0]} にリダイレクトします...`);
      router.push(`/${tenants[0]}/dashboard`);
    } else {
      // 複数テナント → テナント選択ページへ
      setMessage("テナント選択ページにリダイレクトします...");
      router.push("/tenants");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
