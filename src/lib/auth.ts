import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { isUserBelongsToTenant } from "./users";

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
                    const validCredentials =
                        credentials.email === "admin@example.com" ||
                        credentials.email === "devleadxaid@gmail.com" ||
                        credentials.email === "user1@example.com" ||
                        credentials.email === "user2@example.com" ||
                        credentials.email === "user3@example.com";

                    // devleadxaid@gmail.com will belong to tenant1 as well as any other assigned tenants in isUserBelongsToTenant
                    if (validCredentials && credentials.password === "password") {
                        // ユーザーがこのテナントに所属しているかチェック
                        if (!isUserBelongsToTenant(credentials.email, tenantId)) {
                            // このテナントに所属していない場合は認証を拒否
                            return null;
                        }

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
                            // devleadxaid@gmail.com is explicitly added to tenant1 for demonstration
                            id = "5";
                            name = "Dev Lead";
                        } else {
                            id = "4";
                            name = "User 3";
                        }

                        return {
                            id,
                            email: credentials.email,
                            name,
                            tenantId: tenantId,
                        };
                    }

                    return null;
                },
            }),
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID || "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
                // Google Workspaceの場合、特定のドメインを制限する場合は以下をコメントアウト
                // authorization: {
                //     params: {
                //         hd: "your-workspace-domain.com", // 特定のドメインのみ許可
                //     },
                // },
            }),
            AzureADProvider({
                clientId: process.env.AZURE_AD_CLIENT_ID || "",
                clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
                tenantId: process.env.AZURE_AD_TENANT_ID || "common",
                // "common" を指定すると、任意のMicrosoftアカウント（個人/組織）でログイン可能
                // 特定のテナントのみ許可する場合は、Azure ADのテナントIDを指定
            }),
        ],
        callbacks: {
            async signIn({ user, account }) {
                // OAuth認証の場合、テナント所属チェック
                if (
                    (account?.provider === "google" ||
                        account?.provider === "azure-ad") &&
                    user.email
                ) {
                    // ユーザーがこのテナントに所属しているかチェック
                    if (!isUserBelongsToTenant(user.email, tenantId)) {
                        // このテナントに所属していない場合は認証を拒否
                        return false;
                    }
                }
                return true;
            },
            async jwt({ token, user, account }) {
                // セッションにテナントIDを含める
                if (user) {
                    token.tenantId = tenantId;
                    token.id = user.id;
                    // OAuth認証の場合、メールアドレスを保存
                    if (
                        (account?.provider === "google" ||
                            account?.provider === "azure-ad") &&
                        user.email
                    ) {
                        token.email = user.email;
                    }
                }
                return token;
            },
            async session({ session, token }) {
                // セッションオブジェクトにテナントIDを追加
                if (session.user) {
                    session.user.tenantId = token.tenantId as string;
                    session.user.id = token.id as string;
                    // Google認証の場合、メールアドレスを確実に設定
                    if (token.email) {
                        session.user.email = token.email as string;
                    }
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
        // App Router用の設定
        // @ts-ignore - NextAuth v4の型定義に含まれていない可能性がある
        basePath: `/${tenantId}/api/auth`,
    };
}

