import { db } from "@/lib/db";
import { oauthConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

// トークンの有効期限のバッファ（5分前にリフレッシュ）
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

type OAuthConnection = typeof oauthConnections.$inferSelect;

type TokenResult =
  | { accessToken: string; error?: undefined }
  | { accessToken?: undefined; error: string };

/**
 * アクセストークンを取得（必要に応じてリフレッシュ）
 */
export async function getValidAccessToken(
  connectionId: string
): Promise<TokenResult> {
  const connection = await db.query.oauthConnections.findFirst({
    where: eq(oauthConnections.id, connectionId),
  });

  if (!connection) {
    return { error: "Connection not found" };
  }

  // トークンの有効期限を確認
  const now = Date.now();
  const expiresAt = connection.accessTokenExpiresAt?.getTime() || 0;

  if (expiresAt - TOKEN_EXPIRY_BUFFER_MS > now) {
    // まだ有効なのでそのまま返す
    return { accessToken: connection.accessToken };
  }

  // リフレッシュが必要
  if (!connection.refreshToken) {
    return { error: "No refresh token available" };
  }

  const refreshResult = await refreshAccessToken(connection);
  if (refreshResult.error) {
    return refreshResult;
  }

  return refreshResult;
}

/**
 * アクセストークンをリフレッシュ
 */
async function refreshAccessToken(
  connection: OAuthConnection
): Promise<TokenResult> {
  const isGoogle = connection.provider === "google";
  const tokenUrl = isGoogle ? GOOGLE_TOKEN_URL : MICROSOFT_TOKEN_URL;

  const clientId = isGoogle
    ? process.env.GOOGLE_CLIENT_ID
    : process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = isGoogle
    ? process.env.GOOGLE_CLIENT_SECRET
    : process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "Missing OAuth credentials" };
  }

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Token refresh failed for ${connection.provider}:`, errorData);

      // リフレッシュトークンが無効になった場合は連携を削除
      if (response.status === 400 || response.status === 401) {
        await db.delete(oauthConnections).where(eq(oauthConnections.id, connection.id));
        return { error: "Refresh token expired. Please reconnect." };
      }

      return { error: "Failed to refresh token" };
    }

    const tokenData = await response.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // DBを更新
    await db
      .update(oauthConnections)
      .set({
        accessToken: access_token,
        refreshToken: refresh_token || connection.refreshToken, // Googleは新しいrefresh_tokenを返さないことがある
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(oauthConnections.id, connection.id));

    return { accessToken: access_token };
  } catch (error) {
    console.error("Token refresh error:", error);
    return { error: "Token refresh failed" };
  }
}

/**
 * ユーザーIDでOAuth連携を取得
 */
export async function getUserOAuthConnections(userId: string) {
  return db.query.oauthConnections.findMany({
    where: eq(oauthConnections.userId, userId),
  });
}

/**
 * 特定のプロバイダーの連携を取得
 */
export async function getUserOAuthConnection(userId: string, provider: "google" | "microsoft") {
  const { and } = await import("drizzle-orm");
  return db.query.oauthConnections.findFirst({
    where: and(
      eq(oauthConnections.userId, userId),
      eq(oauthConnections.provider, provider)
    ),
  });
}
