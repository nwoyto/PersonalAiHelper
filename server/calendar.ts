import { CalendarIntegration, CalendarEvent, InsertCalendarEvent } from "@shared/schema";
import { storage } from "./storage";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  htmlLink?: string;
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName?: string;
  };
  webLink?: string;
  isAllDay?: boolean;
}

/**
 * Synchronize Google Calendar events for a user
 */
export async function syncGoogleCalendar(integration: CalendarIntegration): Promise<number> {
  try {
    // Get Google API client
    const { google } = await import('googleapis');
    const { OAuth2 } = google.auth;
    
    const oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/calendar/callback/google`
    );
    
    // Set up credentials
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });
    
    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Clear existing events for this integration
    await storage.deleteCalendarEventsByIntegration(integration.id);
    
    try {
      // Get events from primary calendar for next 30 days
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: thirtyDaysLater.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      // Convert events to our format
      const events = response.data.items || [];
      console.log(`Retrieved ${events.length} real events from Google Calendar`);
      
      const calendarEvents = convertGoogleEvents(events as GoogleCalendarEvent[]);
      
      // Save events to database
      let counter = 0;
      for (const event of calendarEvents) {
        await storage.createCalendarEvent({
          ...event,
          userId: integration.userId,
          integrationId: integration.id
        });
        counter++;
      }
      
      return counter;
    } catch (apiError: any) {
      // If token expired, try to refresh
      if (apiError.code === 401 && integration.refreshToken) {
        // Create new OAuth client for refresh
        const refreshClient = new OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        
        refreshClient.setCredentials({
          refresh_token: integration.refreshToken
        });
        
        try {
          const response = await refreshClient.getAccessToken();
          const tokens = response.tokens;
          
          // Update tokens in database
          if (tokens.access_token) {
            await storage.updateCalendarIntegration(integration.id, {
              accessToken: tokens.access_token,
              tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
            });
            
            // Recursively try again with new token
            const updatedIntegration = await storage.getCalendarIntegrationById(integration.id);
            if (updatedIntegration) {
              return syncGoogleCalendar(updatedIntegration);
            }
          }
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
        }
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error("Failed to sync Google Calendar:", error);
    throw new Error(`Failed to sync calendar: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Synchronize Outlook Calendar events for a user
 */
export async function syncOutlookCalendar(integration: CalendarIntegration): Promise<number> {
  try {
    // In a real implementation, this would:
    // 1. Refresh the access token if expired
    // 2. Call the Microsoft Graph API with the access token
    // 3. Process the results and update our local database
    
    // For demonstration purposes, we'll create synthetic events
    const now = new Date();
    const userId = integration.userId;
    
    // Clear existing events for this integration
    await storage.deleteCalendarEventsByIntegration(integration.id);
    
    // Create mock events
    const mockEvents: InsertCalendarEvent[] = [
      {
        userId,
        integrationId: integration.id,
        externalId: `outlook-event-1-${integration.id}`,
        title: "Monthly Department Update",
        description: "Review department KPIs and upcoming initiatives",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 13, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0),
        location: "Microsoft Teams",
        url: "https://teams.microsoft.com/mock-link"
      },
      {
        userId,
        integrationId: integration.id,
        externalId: `outlook-event-2-${integration.id}`,
        title: "Client Presentation",
        description: "Final presentation for the Q2 project",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 15, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 16, 0),
        location: "Client HQ",
        url: "https://outlook.office.com/mock-link"
      },
      {
        userId,
        integrationId: integration.id,
        externalId: `outlook-event-3-${integration.id}`,
        title: "Office Closure",
        description: "Office closed for maintenance",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
        allDay: true
      }
    ];
    
    // Save mock events to database
    for (const event of mockEvents) {
      await storage.createCalendarEvent(event);
    }
    
    return mockEvents.length;
  } catch (error) {
    console.error("Failed to sync Outlook Calendar:", error);
    throw error;
  }
}

/**
 * Synchronize Apple Calendar events for a user
 */
export async function syncAppleCalendar(integration: CalendarIntegration): Promise<number> {
  try {
    // Import the Apple Calendar integration module
    const appleCalendar = await import('./integrations/apple-calendar');
    
    // Use the module to synchronize events
    return await appleCalendar.syncAppleCalendar(integration);
  } catch (error: any) {
    console.error("Failed to sync Apple Calendar:", error);
    throw new Error(`Apple Calendar sync failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Convert Google Calendar events to our internal format
 */
export function convertGoogleEvents(googleEvents: GoogleCalendarEvent[]): InsertCalendarEvent[] {
  return googleEvents.map(event => {
    const isAllDay = !event.start.dateTime && !!event.start.date;
    
    return {
      externalId: event.id,
      title: event.summary,
      description: event.description,
      startTime: isAllDay 
        ? new Date(event.start.date!)
        : new Date(event.start.dateTime!),
      endTime: isAllDay 
        ? new Date(event.end.date!)
        : new Date(event.end.dateTime!),
      allDay: isAllDay,
      location: event.location,
      url: event.htmlLink,
      userId: 0, // This will be set when storing the event
      integrationId: 0 // This will be set when storing the event
    };
  });
}

/**
 * Convert Outlook Calendar events to our internal format
 */
export function convertOutlookEvents(outlookEvents: OutlookCalendarEvent[]): InsertCalendarEvent[] {
  return outlookEvents.map(event => {
    return {
      externalId: event.id,
      title: event.subject,
      description: event.bodyPreview,
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      allDay: event.isAllDay || false,
      location: event.location?.displayName,
      url: event.webLink,
      userId: 0, // This will be set when storing the event
      integrationId: 0 // This will be set when storing the event
    };
  });
}