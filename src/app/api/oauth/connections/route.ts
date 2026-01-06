import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { db } from "@/lib/db";
import { oauthConnections, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(getGlobalAuthOptions());

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // DBからユーザーを取得
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email.toLowerCase()),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 連携情報を取得
    const connections = await db.query.oauthConnections.findMany({
      where: eq(oauthConnections.userId, dbUser.id),
    });

    // アクセストークンは返さない
    const safeConnections = connections.map((conn) => ({
      id: conn.id,
      provider: conn.provider,
      email: conn.email,
      scopes: conn.scopes,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
    }));

    return NextResponse.json({ connections: safeConnections });
  } catch (error) {
    console.error("Get connections error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
