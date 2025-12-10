"use client";

import { signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        redirect: false,
        callbackUrl: `/${tenantId}/auth/signin`,
      });
      // ログアウト後、ページをリフレッシュ
      router.push(`/${tenantId}/auth/signin`);
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}

