import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { oauthConnections, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/v1.0/me";

export async function GET(request: NextRequest) {
  const session = await getServerSession(getGlobalAuthOptions());

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Microsoft OAuth error:", error);
    return NextResponse.redirect(
      new URL("/profile?error=oauth_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/profile?error=invalid_request", request.url)
    );
  }

  // CSRF検証
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const storedScopes = cookieStore.get("oauth_scopes")?.value;

  if (state !== storedState) {
    return NextResponse.redirect(
      new URL("/profile?error=invalid_state", request.url)
    );
  }

  // クッキーを削除
  cookieStore.delete("oauth_state");
  cookieStore.delete("oauth_scopes");

  try {
    // アクセストークンを取得
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/connect/microsoft/callback`;
    const tokenResponse = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID || "",
        client_secret: process.env.AZURE_AD_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/profile?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // ユーザー情報を取得
    const userInfoResponse = await fetch(MICROSOFT_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL("/profile?error=userinfo_failed", request.url)
      );
    }

    const userInfo = await userInfoResponse.json();
    const providerAccountId = userInfo.id;
    const providerEmail = userInfo.mail || userInfo.userPrincipalName;

    // DBからユーザーを取得
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email.toLowerCase()),
    });

    if (!dbUser) {
      return NextResponse.redirect(
        new URL("/profile?error=user_not_found", request.url)
      );
    }

    // 既存の連携を確認
    const existingConnection = await db.query.oauthConnections.findFirst({
      where: and(
        eq(oauthConnections.userId, dbUser.id),
        eq(oauthConnections.provider, "microsoft")
      ),
    });

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    if (existingConnection) {
      // 更新
      await db
        .update(oauthConnections)
        .set({
          providerAccountId,
          email: providerEmail,
          accessToken: access_token,
          refreshToken: refresh_token || existingConnection.refreshToken,
          accessTokenExpiresAt: expiresAt,
          scopes: storedScopes || existingConnection.scopes,
          updatedAt: new Date(),
        })
        .where(eq(oauthConnections.id, existingConnection.id));
    } else {
      // 新規作成
      await db.insert(oauthConnections).values({
        userId: dbUser.id,
        provider: "microsoft",
        providerAccountId,
        email: providerEmail,
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: expiresAt,
        scopes: storedScopes || "mail",
      });
    }

    return NextResponse.redirect(
      new URL("/profile?success=microsoft_connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/profile?error=unknown_error", request.url)
    );
  }
}
