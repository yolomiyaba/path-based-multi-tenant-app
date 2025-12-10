import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * NextAuth設定を生成する関数
 * テナントIDを受け取り、テナント固有の設定を返す
 */
export function getAuthOptions(tenantId: string): NextAuthOptions {
    return {
        providers: [
            CredentialsProvider({
                name: "Credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" },
                },
                async authorize(credentials) {
                    // TODO: 実際の認証ロジックを実装
                    // ここではテナントIDと認証情報を検証する必要があります
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    // デモ用の簡単な認証（本番環境では適切な認証を実装してください）
                    // 実際には、データベースでテナントIDとユーザー情報を検証します
                    if (
                        credentials.email === "admin@example.com" &&
                        credentials.password === "password"
                    ) {
                        return {
                            id: "1",
                            email: credentials.email,
                            name: "Admin User",
                            tenantId: tenantId,
                        };
                    }

                    return null;
                },
            }),
        ],
        callbacks: {
            async jwt({ token, user }) {
                // セッションにテナントIDを含める
                if (user) {
                    token.tenantId = tenantId;
                    token.id = user.id;
                }
                return token;
            },
            async session({ session, token }) {
                // セッションオブジェクトにテナントIDを追加
                if (session.user) {
                    session.user.tenantId = token.tenantId as string;
                    session.user.id = token.id as string;
                }
                return session;
            },
        },
        pages: {
            signIn: `/${tenantId}/auth/signin`,
            error: `/${tenantId}/auth/error`,
        },
        session: {
            strategy: "jwt",
        },
        secret: process.env.NEXTAUTH_SECRET,
    };
}

