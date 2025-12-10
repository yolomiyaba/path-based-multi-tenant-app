import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

interface RouteContext {
    params: Promise<{
        tenantId: string;
    }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
    const { tenantId } = await context.params;
    const authOptions = getAuthOptions(tenantId);
    const handlers = NextAuth(authOptions);
    return handlers.GET(req as any);
}

export async function POST(req: NextRequest, context: RouteContext) {
    const { tenantId } = await context.params;
    const authOptions = getAuthOptions(tenantId);
    const handlers = NextAuth(authOptions);
    return handlers.POST(req as any);
}

