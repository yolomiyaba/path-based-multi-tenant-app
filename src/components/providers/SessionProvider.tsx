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
  // テナント配下でない場合は通常のSessionProviderを使用
  if (!tenantId) {
    return (
      <NextAuthSessionProvider>
        {children}
      </NextAuthSessionProvider>
    );
  }

  // テナント配下の場合は、basePathを設定
  return (
    <NextAuthSessionProvider
      basePath={`/${tenantId}/api/auth`}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

