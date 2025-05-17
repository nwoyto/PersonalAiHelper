import express, { type Express, Request, Response, NextFunction } from "express";
import { authenticate, login, AuthRequest } from "./auth";
import bcrypt from "bcryptjs";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertNoteSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { analyzeTranscription } from "./openai";
import calendarRoutes from "./routes/calendar";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Auth endpoints
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      console.log('Login route called with body:', req.body);
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const result = await login(username, password);
      console.log('Login successful, returning token');
      res.json(result);
    } catch (error: any) {
      console.log('Login failed with error:', error.message);
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
  
  apiRouter.get("/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      if (!authReq.user || !authReq.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(authReq.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // User endpoints
  apiRouter.get("/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });
  
  // Task endpoints
  apiRouter.get("/tasks", async (_req: Request, res: Response) => {
    // For now, we'll use the default user (id: 1)
    const userId = 1;
    const tasks = await storage.getTasks(userId);
    return res.json(tasks);
  });
  
  apiRouter.get("/tasks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    
    const task = await storage.getTaskById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    return res.json(task);
  });
  
  apiRouter.post("/tasks", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Create task
      const newTask = await storage.createTask(validatedData);
      return res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  apiRouter.patch("/tasks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    
    try {
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(id, req.body);
      return res.json(updatedTask);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  apiRouter.delete("/tasks/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    
    const success = await storage.deleteTask(id);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    return res.status(204).send();
  });
  
  // Note endpoints
  apiRouter.get("/notes", async (_req: Request, res: Response) => {
    // For now, we'll use the default user (id: 1)
    const userId = 1;
    const notes = await storage.getNotes(userId);
    return res.json(notes);
  });
  
  apiRouter.get("/notes/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }
    
    const note = await storage.getNoteById(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    return res.json(note);
  });
  
  apiRouter.post("/notes", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertNoteSchema.parse(req.body);
      
      // Create note
      const newNote = await storage.createNote(validatedData);
      return res.status(201).json(newNote);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to create note" });
    }
  });
  
  apiRouter.delete("/notes/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }
    
    const success = await storage.deleteNote(id);
    if (!success) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    return res.status(204).send();
  });
  
  // Settings endpoints
  apiRouter.get("/settings", async (_req: Request, res: Response) => {
    // For now, we'll use the default user (id: 1)
    const userId = 1;
    const settings = await storage.getSettings(userId);
    
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    
    return res.json(settings);
  });
  
  apiRouter.patch("/settings", async (req: Request, res: Response) => {
    // For now, we'll use the default user (id: 1)
    const userId = 1;
    
    try {
      const settings = await storage.getSettings(userId);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      
      // Update settings
      const updatedSettings = await storage.updateSettings(userId, req.body);
      return res.json(updatedSettings);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update settings" });
    }
  });
  
  // Voice transcription and task extraction endpoint
  apiRouter.post("/transcribe", async (req: Request, res: Response) => {
    try {
      const transcriptionSchema = z.object({
        text: z.string().min(1, "Transcription text is required"),
      });
      
      const { text } = transcriptionSchema.parse(req.body);
      
      // Process the transcription with OpenAI to extract tasks
      const result = await analyzeTranscription(text);
      
      // For now, always associate with default user (id: 1)
      const userId = 1;
      
      // Create a note for the transcription
      const noteTitle = result.title || "Transcribed Conversation";
      
      const note = await storage.createNote({
        userId,
        title: noteTitle,
        content: text,
        category: "work", // Default category
        extractedTasks: result.tasks.length,
        timestamp: new Date(),
      });
      
      // Create tasks from extracted tasks
      const createdTasks = [];
      for (const taskInfo of result.tasks) {
        const task = await storage.createTask({
          userId,
          title: taskInfo.title,
          description: taskInfo.description || "",
          completed: false,
          dueDate: taskInfo.dueDate ? new Date(taskInfo.dueDate) : undefined,
          category: taskInfo.category || "work",
          priority: taskInfo.priority || "medium",
          estimatedMinutes: taskInfo.estimatedMinutes,
          location: taskInfo.location,
          people: taskInfo.people,
          recurring: taskInfo.recurring || false,
          recurringPattern: taskInfo.recurringPattern,
        });
        createdTasks.push(task);
      }
      
      return res.status(201).json({
        note,
        tasks: createdTasks,
        analysis: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid transcription data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to process transcription" });
    }
  });
  
  // Calendar integration endpoints
  apiRouter.get("/calendar/integrations", async (req: Request, res: Response) => {
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
  
  apiRouter.post("/calendar/connect", async (req: Request, res: Response) => {
    // For now, we'll use the default user (id: 1)
    const userId = 1;
    
    try {
      const { providers } = req.body;
      
      if (!providers || !Array.isArray(providers)) {
        return res.status(400).json({ message: "Invalid providers list" });
      }
      
      // In a real implementation, we would:
      // 1. Initiate OAuth flows for each provider
      // 2. Store tokens securely
      // 3. Set up webhook subscriptions for calendar updates
      
      // For demonstration purposes, we'll create mock integrations
      const results = [];
      
      for (const provider of providers) {
        if (!["google", "outlook", "apple"].includes(provider)) {
          continue;
        }
        
        // Check if integration already exists
        const existingIntegrations = await storage.getCalendarIntegrationsByProvider(userId, provider);
        
        let integration;
        let status: "updated" | "connected" = "connected";
        
        if (existingIntegrations.length > 0) {
          // Update existing integration
          integration = await storage.updateCalendarIntegration(
            existingIntegrations[0].id,
            { enabled: true }
          );
          status = "updated";
        } else {
          // Mock integration - in a real app, these values would come from OAuth
          integration = await storage.createCalendarIntegration({
            userId,
            provider,
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
            calendarId: `primary-${provider}`,
            enabled: true
          });
        }
        
        if (integration) {
          // Sync calendar events
          let eventCount = 0;
          
          if (provider === "google") {
            eventCount = await syncGoogleCalendar(integration);
          } else if (provider === "outlook") {
            eventCount = await syncOutlookCalendar(integration);
          }
          
          results.push({
            provider,
            status,
            id: integration.id,
            eventCount
          });
        }
      }
      
      return res.json({ success: true, connections: results });
    } catch (error) {
      console.error("Failed to connect calendar:", error);
      return res.status(500).json({ message: "Failed to connect calendar" });
    }
  });
  
  apiRouter.get("/calendar/events", async (req: Request, res: Response) => {
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
  
  apiRouter.delete("/calendar/integrations/:id", async (req: Request, res: Response) => {
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
  
  // We'll keep this route here for compatibility, but it will redirect to the new calendar routes
  apiRouter.get("/calendar/integration-status", async (req: Request, res: Response) => {
    res.redirect(307, "/api/calendar/integration-status");
  });
  
  // Register calendar routes first to handle specific paths
  app.use("/api/calendar", calendarRoutes);
  
  // Register all other API routes with /api prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
