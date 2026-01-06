import { getValidAccessToken } from "./token-refresh";

const GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1";
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

export type EmailMessage = {
  id: string;
  subject: string;
  from: string;
  date: Date;
  snippet: string;
  isRead: boolean;
};

/**
 * Gmailからメールを取得
 */
export async function getGmailMessages(
  connectionId: string,
  maxResults: number = 10
): Promise<{ messages: EmailMessage[]; error?: string } | { messages?: never; error: string }> {
  const tokenResult = await getValidAccessToken(connectionId);
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }

  try {
    // メッセージ一覧を取得
    const listResponse = await fetch(
      `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      return { error: "Failed to fetch messages" };
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    // 各メッセージの詳細を取得
    const messages: EmailMessage[] = await Promise.all(
      messageIds.slice(0, maxResults).map(async (msg: { id: string }) => {
        const detailResponse = await fetch(
          `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
            },
          }
        );

        if (!detailResponse.ok) {
          return null;
        }

        const detail = await detailResponse.json();
        const headers = detail.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h: { name: string; value: string }) => h.name === name)?.value || "";

        return {
          id: detail.id,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          date: new Date(getHeader("Date")),
          snippet: detail.snippet || "",
          isRead: !detail.labelIds?.includes("UNREAD"),
        };
      })
    );

    return { messages: messages.filter((m): m is EmailMessage => m !== null) };
  } catch (error) {
    console.error("Gmail API error:", error);
    return { error: "Failed to fetch Gmail messages" };
  }
}

/**
 * Outlook/Microsoft 365からメールを取得
 */
export async function getOutlookMessages(
  connectionId: string,
  maxResults: number = 10
): Promise<{ messages: EmailMessage[]; error?: string } | { messages?: never; error: string }> {
  const tokenResult = await getValidAccessToken(connectionId);
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to fetch messages" };
    }

    const data = await response.json();
    const messages: EmailMessage[] = (data.value || []).map(
      (msg: {
        id: string;
        subject: string;
        from: { emailAddress: { name: string; address: string } };
        receivedDateTime: string;
        bodyPreview: string;
        isRead: boolean;
      }) => ({
        id: msg.id,
        subject: msg.subject || "(no subject)",
        from: msg.from?.emailAddress
          ? `${msg.from.emailAddress.name} <${msg.from.emailAddress.address}>`
          : "",
        date: new Date(msg.receivedDateTime),
        snippet: msg.bodyPreview || "",
        isRead: msg.isRead,
      })
    );

    return { messages };
  } catch (error) {
    console.error("Microsoft Graph API error:", error);
    return { error: "Failed to fetch Outlook messages" };
  }
}
