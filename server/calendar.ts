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
    // In a real implementation, this would:
    // 1. Refresh the access token if expired
    // 2. Call the Google Calendar API with the access token
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
        externalId: `google-event-1-${integration.id}`,
        title: "Team Weekly Sync",
        description: "Regular team check-in to discuss progress and blockers",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0),
        location: "Google Meet",
        url: "https://meet.google.com/mock-link"
      },
      {
        userId,
        integrationId: integration.id,
        externalId: `google-event-2-${integration.id}`,
        title: "Product Review",
        description: "Monthly product review with stakeholders",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 15, 30),
        location: "Conference Room A",
        url: "https://calendar.google.com/mock-link"
      },
      {
        userId,
        integrationId: integration.id,
        externalId: `google-event-3-${integration.id}`,
        title: "All-day Company Event",
        description: "Annual company retreat",
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        allDay: true,
        location: "Central Park"
      }
    ];
    
    // Save mock events to database
    for (const event of mockEvents) {
      await storage.createCalendarEvent(event);
    }
    
    return mockEvents.length;
  } catch (error) {
    console.error("Failed to sync Google Calendar:", error);
    throw error;
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