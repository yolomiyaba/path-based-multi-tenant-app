import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { db } from "@/lib/db";
import { oauthConnections, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getServerSession(getGlobalAuthOptions());

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider || !["google", "microsoft"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // DBからユーザーを取得
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email.toLowerCase()),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 連携を削除
    const result = await db
      .delete(oauthConnections)
      .where(
        and(
          eq(oauthConnections.userId, dbUser.id),
          eq(oauthConnections.provider, provider)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
