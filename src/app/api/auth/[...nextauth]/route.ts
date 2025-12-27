import { getGlobalAuthOptions } from "@/lib/auth-global";
import NextAuth from "next-auth";

/**
 * グローバル認証のみを使用
 * テナント固有認証は廃止し、認証は一本化
 */
const authOptions = getGlobalAuthOptions();
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
