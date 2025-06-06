import { google } from 'googleapis';
import { InsertCalendarEvent, CalendarIntegration } from '@shared/schema';
import { storage } from '../storage';

// Google OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/calendar/callback/google`
);

// Generate authorization URL
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force to get refresh_token every time
  });
}

// Get tokens from code received after authentication
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh token if expired
export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error: any) {
    console.error('Error refreshing access token:', error);
    throw new Error(`Failed to refresh token: ${error.message || 'Unknown error'}`);
  }
}

// Set up client with existing tokens
function setupClient(accessToken: string, refreshToken: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Fetch events from Google Calendar
export async function fetchCalendarEvents(integration: CalendarIntegration) {
  try {
    // Set up Google Calendar client with the integration's tokens
    const calendar = setupClient(integration.accessToken, integration.refreshToken || '');
    
    // Default to primary calendar if not specified
    const calendarId = integration.calendarId || 'primary';
    
    // Get events for the next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    
    // If token expired, try to refresh and retry once
    if (error.response?.status === 401 && integration.refreshToken) {
      try {
        const newCredentials = await refreshAccessToken(integration.refreshToken);
        
        // Update integration with new tokens
        if (newCredentials.access_token) {
          await storage.updateCalendarIntegration(integration.id, {
            accessToken: newCredentials.access_token,
            tokenExpiry: newCredentials.expiry_date ? new Date(newCredentials.expiry_date) : undefined
          });
          
          // Retry with new token
          const calendar = setupClient(newCredentials.access_token, integration.refreshToken);
          const calendarId = integration.calendarId || 'primary';
          
          const now = new Date();
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(now.getDate() + 30);
          
          const response = await calendar.events.list({
            calendarId,
            timeMin: now.toISOString(),
            timeMax: thirtyDaysLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });
          
          return response.data.items || [];
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
}

// Convert Google Calendar events to our internal format
export function convertGoogleEvents(events: any[], integrationId: number): InsertCalendarEvent[] {
  return events.map(event => {
    const startDateTime = event.start?.dateTime || event.start?.date;
    const endDateTime = event.end?.dateTime || event.end?.date;
    
    return {
      integrationId,
      externalId: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || undefined,
      startTime: startDateTime ? new Date(startDateTime) : undefined,
      endTime: endDateTime ? new Date(endDateTime) : undefined,
      allDay: !event.start?.dateTime, // If no dateTime, it's an all-day event
      location: event.location || undefined,
      url: event.htmlLink || undefined
    };
  });
}

// Synchronize Google Calendar events for a user
export async function syncGoogleCalendar(integration: CalendarIntegration): Promise<number> {
  try {
    // First, delete existing events for this integration so we start fresh
    await storage.deleteCalendarEventsByIntegration(integration.id);
    
    // Fetch real events from Google Calendar API
    const googleEvents = await fetchCalendarEvents(integration);
    
    // Convert to our internal format
    const calendarEvents = convertGoogleEvents(googleEvents, integration.id);
    
    // Process each event from Google
    let addedEventsCount = 0;
    
    for (const event of calendarEvents) {
      // Add userId from the integration
      const eventWithUser = {
        ...event,
        userId: integration.userId
      };
      
      // Create event in our database
      await storage.createCalendarEvent(eventWithUser);
      addedEventsCount++;
    }
    
    console.log(`Synchronized ${addedEventsCount} events from Google Calendar for integration ${integration.id}`);
    return addedEventsCount;
  } catch (error: any) {
    console.error('Error syncing Google Calendar:', error);
    throw new Error(`Failed to sync Google Calendar: ${error.message || 'Unknown error'}`);
  }
}