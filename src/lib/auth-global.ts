import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { getUserTenantIds, isRegisteredUser } from "./users";

/**
 * テナント非指定のNextAuth設定を生成する関数
 * 認証後にテナントを判定してリダイレクトする
 */
export function getGlobalAuthOptions(): NextAuthOptions {
  return {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // デモ用の簡単な認証（本番環境では適切な認証を実装してください）
          const validCredentials =
            credentials.email === "admin@example.com" ||
            credentials.email === "devleadxaid@gmail.com" ||
            credentials.email === "user1@example.com" ||
            credentials.email === "user2@example.com" ||
            credentials.email === "user3@example.com";

          if (validCredentials && credentials.password === "password") {
            let id: string, name: string;
            if (credentials.email === "admin@example.com") {
              id = "1";
              name = "Admin User";
            } else if (credentials.email === "user1@example.com") {
              id = "2";
              name = "User 1";
            } else if (credentials.email === "user2@example.com") {
              id = "3";
              name = "User 2";
            } else if (credentials.email === "devleadxaid@gmail.com") {
              id = "5";
              name = "Dev Lead";
            } else {
              id = "4";
              name = "User 3";
            }

            // テナントIDは後で判定するため、ここでは設定しない
            return {
              id,
              email: credentials.email,
              name,
            };
          }

          return null;
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID || "",
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
        tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      }),
    ],
    callbacks: {
      async signIn({ user }) {
        // 認証自体は許可（テナントチェックしない）
        // 未登録ユーザーも認証を許可し、後で/signupにリダイレクト
        return true;
      },
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          // グローバル認証フラグを設定
          token.globalAuth = true;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          if (token.email) {
            session.user.email = token.email as string;
          }
          // グローバル認証の場合、テナントIDは設定しない
          // リダイレクト先で判定する
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        // 認証後のリダイレクト先を /auth/redirect に設定
        // ここでテナント判定を行う
        if (url.includes("/api/auth/callback")) {
          return `${baseUrl}/auth/redirect`;
        }
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        if (new URL(url).origin === baseUrl) {
          return url;
        }
        return `${baseUrl}/auth/redirect`;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}
