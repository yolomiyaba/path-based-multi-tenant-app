import { getValidAccessToken } from "./token-refresh";

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  isAllDay: boolean;
};

/**
 * Google Calendarからイベントを取得
 */
export async function getGoogleCalendarEvents(
  connectionId: string,
  maxResults: number = 10
): Promise<{ events: CalendarEvent[]; error?: string } | { events?: never; error: string }> {
  const tokenResult = await getValidAccessToken(connectionId);
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }

  try {
    const now = new Date().toISOString();
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?maxResults=${maxResults}&timeMin=${now}&orderBy=startTime&singleEvents=true`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to fetch calendar events" };
    }

    const data = await response.json();
    const events: CalendarEvent[] = (data.items || []).map(
      (event: {
        id: string;
        summary: string;
        description?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
        location?: string;
      }) => ({
        id: event.id,
        summary: event.summary || "(no title)",
        description: event.description,
        start: new Date(event.start.dateTime || event.start.date || ""),
        end: new Date(event.end.dateTime || event.end.date || ""),
        location: event.location,
        isAllDay: !event.start.dateTime,
      })
    );

    return { events };
  } catch (error) {
    console.error("Google Calendar API error:", error);
    return { error: "Failed to fetch Google Calendar events" };
  }
}

/**
 * Outlook Calendarからイベントを取得
 */
export async function getOutlookCalendarEvents(
  connectionId: string,
  maxResults: number = 10
): Promise<{ events: CalendarEvent[]; error?: string } | { events?: never; error: string }> {
  const tokenResult = await getValidAccessToken(connectionId);
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }

  try {
    const now = new Date().toISOString();
    const response = await fetch(
      `${GRAPH_API_BASE}/me/calendarView?startDateTime=${now}&endDateTime=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}&$top=${maxResults}&$orderby=start/dateTime&$select=id,subject,bodyPreview,start,end,location,isAllDay`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to fetch calendar events" };
    }

    const data = await response.json();
    const events: CalendarEvent[] = (data.value || []).map(
      (event: {
        id: string;
        subject: string;
        bodyPreview?: string;
        start: { dateTime: string; timeZone: string };
        end: { dateTime: string; timeZone: string };
        location?: { displayName: string };
        isAllDay: boolean;
      }) => ({
        id: event.id,
        summary: event.subject || "(no title)",
        description: event.bodyPreview,
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        location: event.location?.displayName,
        isAllDay: event.isAllDay,
      })
    );

    return { events };
  } catch (error) {
    console.error("Outlook Calendar API error:", error);
    return { error: "Failed to fetch Outlook Calendar events" };
  }
}
