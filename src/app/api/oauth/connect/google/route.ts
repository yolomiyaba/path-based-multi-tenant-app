import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// スコープの定義
const SCOPES = {
  mail: "https://www.googleapis.com/auth/gmail.readonly",
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(getGlobalAuthOptions());

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const scopeParam = searchParams.get("scope"); // mail, calendar, or mail,calendar

  if (!scopeParam) {
    return NextResponse.json({ error: "scope parameter required" }, { status: 400 });
  }

  const requestedScopes = scopeParam.split(",");
  const googleScopes: string[] = [
    "openid",
    "email",
    "profile",
  ];

  for (const scope of requestedScopes) {
    if (scope === "mail" || scope === "calendar") {
      googleScopes.push(SCOPES[scope]);
    }
  }

  // CSRF対策用のstateを生成
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10分
    path: "/",
  });

  // リクエストしたスコープを保存
  cookieStore.set("oauth_scopes", scopeParam, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/connect/google/callback`;

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", googleScopes.join(" "));
  authUrl.searchParams.set("access_type", "offline"); // refresh_tokenを取得
  authUrl.searchParams.set("prompt", "consent"); // 毎回同意画面を表示（refresh_token取得のため）
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
