import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import * as googleCalendar from '../integrations/google-calendar';
import { syncOutlookCalendar } from '../calendar';

const router = Router();

// Get all calendar integrations for the current user
router.get("/integrations", async (req: Request, res: Response) => {
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  try {
    const integrations = await storage.getCalendarIntegrations(userId);
    
    // Create a sanitized response that doesn't include tokens
    const safeIntegrations = integrations.map(integration => ({
      id: integration.id,
      provider: integration.provider,
      enabled: integration.enabled,
      createdAt: integration.createdAt
    }));
    
    return res.json(safeIntegrations);
  } catch (error) {
    console.error("Failed to fetch calendar integrations:", error);
    return res.status(500).json({ message: "Failed to fetch calendar integrations" });
  }
});

// Connect to a calendar provider
router.post("/connect", async (req: Request, res: Response) => {
  const { provider } = req.body;
  
  if (!provider || !["google", "outlook", "apple"].includes(provider)) {
    return res.status(400).json({ message: "Invalid calendar provider" });
  }
  
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  try {
    // Handle different providers with appropriate authentication flows
    if (provider === "google") {
      // Generate Google OAuth URL for the client to redirect to
      const authUrl = googleCalendar.getAuthUrl();
      return res.json({ 
        success: true,
        authUrl,
        message: "Please open this URL to authenticate with Google Calendar"
      });
    } else if (provider === "outlook") {
      // Outlook calendar is not fully implemented yet
      return res.status(501).json({ 
        success: false,
        message: "Outlook calendar integration is not yet fully implemented" 
      });
    } else if (provider === "apple") {
      // Apple calendar integration is not implemented yet
      return res.status(501).json({ 
        success: false,
        message: "Apple calendar integration is not yet implemented" 
      });
    }
    
    // If we reach here, something went wrong
    return res.status(400).json({ message: "Failed to connect calendar provider" });
  } catch (error) {
    console.error(`Failed to connect ${provider} calendar:`, error);
    return res.status(500).json({ message: `Failed to connect ${provider} calendar` });
  }
});

// Google OAuth callback endpoint
router.get("/callback/google", async (req: Request, res: Response) => {
  const { code, error } = req.query;
  
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
    return res.redirect("/#/calendar?error=auth_rejected");
  }
  
  if (!code || typeof code !== 'string') {
    return res.redirect("/#/calendar?error=missing_code");
  }
  
  try {
    // Exchange the authorization code for tokens
    const tokens = await googleCalendar.getTokensFromCode(code);
    
    if (!tokens.access_token) {
      return res.redirect("/#/calendar?error=invalid_token");
    }
    
    // Check if integration already exists
    const existingIntegrations = await storage.getCalendarIntegrationsByProvider(userId, "google");
    
    let integration;
    
    if (existingIntegrations.length > 0) {
      // Update existing integration
      integration = await storage.updateCalendarIntegration(
        existingIntegrations[0].id,
        { 
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingIntegrations[0].refreshToken,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          enabled: true
        }
      );
    } else {
      // Create new integration
      integration = await storage.createCalendarIntegration({
        userId,
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        calendarId: "primary", // Default to primary calendar
        enabled: true
      });
    }
    
    if (integration) {
      // Sync Google Calendar events
      const eventCount = await googleCalendar.syncGoogleCalendar(integration);
      return res.redirect(`/#/calendar?success=true&provider=google&events=${eventCount}`);
    } else {
      return res.redirect("/#/calendar?error=integration_failed");
    }
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.redirect("/#/calendar?error=server_error");
  }
});

// Get all calendar events for the current user
router.get("/events", async (req: Request, res: Response) => {
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  try {
    const events = await storage.getCalendarEvents(userId);
    
    // Format events for frontend consumption
    const formattedEvents = events.map(event => ({
      id: event.id.toString(),
      title: event.title,
      description: event.description || undefined,
      startTime: event.startTime?.toISOString() || undefined,
      endTime: event.endTime?.toISOString() || undefined,
      allDay: event.allDay || false,
      location: event.location || undefined,
      provider: "google", // This should come from the integration lookup in a real implementation
      externalId: event.externalId,
      url: event.url || undefined
    }));
    
    return res.json(formattedEvents);
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return res.status(500).json({ message: "Failed to fetch calendar events" });
  }
});

// Delete a calendar integration
router.delete("/integrations/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid integration ID" });
  }
  
  try {
    // Delete all events associated with this integration
    await storage.deleteCalendarEventsByIntegration(id);
    
    // Delete the integration
    const success = await storage.deleteCalendarIntegration(id);
    if (!success) {
      return res.status(404).json({ message: "Calendar integration not found" });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete calendar integration:", error);
    return res.status(500).json({ message: "Failed to delete calendar integration" });
  }
});

// Get integration status for all providers
router.get("/integration-status", async (req: Request, res: Response) => {
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  try {
    const integrations = await storage.getCalendarIntegrations(userId);
    
    // Create a map of provider to enabled status
    const statusMap = {
      google: false,
      outlook: false,
      apple: false
    };
    
    integrations.forEach(integration => {
      if (["google", "outlook", "apple"].includes(integration.provider)) {
        statusMap[integration.provider as keyof typeof statusMap] = integration.enabled;
      }
    });
    
    return res.json(statusMap);
  } catch (error) {
    console.error("Failed to fetch integration status:", error);
    return res.status(500).json({ message: "Failed to fetch integration status" });
  }
});

// Manually trigger a calendar sync
router.post("/sync/:provider", async (req: Request, res: Response) => {
  const { provider } = req.params;
  
  if (!provider || !["google", "outlook", "apple"].includes(provider)) {
    return res.status(400).json({ message: "Invalid calendar provider" });
  }
  
  // For now, we'll use the default user (id: 1)
  const userId = 1;
  
  try {
    // Find the integration for this provider
    const integrations = await storage.getCalendarIntegrationsByProvider(userId, provider);
    
    if (integrations.length === 0) {
      return res.status(404).json({ message: `No ${provider} calendar integration found` });
    }
    
    const integration = integrations[0];
    
    // Sync the calendar
    let eventCount = 0;
    
    if (provider === "google") {
      eventCount = await googleCalendar.syncGoogleCalendar(integration);
    } else if (provider === "outlook") {
      eventCount = await syncOutlookCalendar(integration);
    }
    
    return res.json({
      success: true,
      provider,
      eventsImported: eventCount
    });
  } catch (error) {
    console.error(`Failed to sync ${provider} calendar:`, error);
    return res.status(500).json({ message: `Failed to sync ${provider} calendar` });
  }
});

export default router;