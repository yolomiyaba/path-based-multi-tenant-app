import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGlobalAuthOptions } from "@/lib/auth-global";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

// スコープの定義
const SCOPES = {
  mail: "https://graph.microsoft.com/Mail.Read",
  calendar: "https://graph.microsoft.com/Calendars.Read",
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
  const microsoftScopes: string[] = [
    "openid",
    "email",
    "profile",
    "offline_access", // refresh_tokenを取得
  ];

  for (const scope of requestedScopes) {
    if (scope === "mail" || scope === "calendar") {
      microsoftScopes.push(SCOPES[scope]);
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

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/connect/microsoft/callback`;

  const authUrl = new URL(MICROSOFT_AUTH_URL);
  authUrl.searchParams.set("client_id", process.env.AZURE_AD_CLIENT_ID || "");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", microsoftScopes.join(" "));
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("prompt", "consent"); // 毎回同意画面を表示
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
