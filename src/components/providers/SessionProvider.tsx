"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  tenantId?: string;
}

/**
 * テナント対応のセッションプロバイダー
 * NextAuthのSessionProviderをラップして、テナントIDを考慮します
 */
export function SessionProvider({ children, tenantId }: SessionProviderProps) {
  // 共通のAPIルートを使用（全テナント共通のリダイレクトURIのため）
  // テナントIDはクッキーで管理される
  return (
    <NextAuthSessionProvider basePath="/api/auth">
      {children}
    </NextAuthSessionProvider>
  );
}

