import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { getUserByEmail } from "./users";
import { verifyPassword } from "./auth/password";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

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

          // DBからユーザーを取得
          const user = await getUserByEmail(credentials.email);
          if (!user || !user.passwordHash) {
            // ユーザーが存在しない、またはパスワード未設定（OAuth専用）
            return null;
          }

          // パスワード検証
          const isValid = await verifyPassword(
            credentials.password,
            user.passwordHash
          );
          if (!isValid) {
            return null;
          }

          // メール認証チェック
          if (!user.emailVerified) {
            throw new Error("メールアドレスが認証されていません。確認メールをご確認ください。");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
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
      async signIn({ user, account }) {
        // OAuth認証の場合、ユーザーをDBに作成/更新
        if (account?.provider && account.provider !== "credentials" && user.email) {
          const existingUser = await getUserByEmail(user.email);
          if (existingUser) {
            // 既存ユーザーのメール認証を更新
            if (!existingUser.emailVerified) {
              await db
                .update(users)
                .set({ emailVerified: new Date() })
                .where(eq(users.email, user.email.toLowerCase()));
            }
          } else {
            // 新規OAuthユーザーをDBに作成（メール認証済みとして）
            await db.insert(users).values({
              email: user.email.toLowerCase(),
              name: user.name || null,
              emailVerified: new Date(),
            });
          }
        }
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
        console.log("[NextAuth Global] redirect callback - url:", url, "baseUrl:", baseUrl);

        // 招待承認ページへのcallbackUrlの場合はそのまま戻す
        if (url.includes("/auth/accept-invitation")) {
          return url;
        }

        // その他の場合は /auth/redirect へリダイレクト（テナント判定はそこで行う）
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
