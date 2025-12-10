import NextAuth, { type NextAuthOptions } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

interface RouteContext {
    params: Promise<{
        tenantId: string;
    }>;
}

async function handler(req: NextRequest, context: RouteContext) {
    const { tenantId } = await context.params;
    const authOptions = getAuthOptions(tenantId);

    // NextAuthのハンドラーを作成
    const nextAuthHandler = NextAuth(authOptions);

    // リクエストをNextAuthハンドラーに渡す
    return nextAuthHandler(req as any, context as any);
}

export { handler as GET, handler as POST };

