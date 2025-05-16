import { 
  User, UpsertUser as InsertUser, 
  Task, InsertTask, 
  Note, InsertNote, 
  Settings, InsertSettings,
  users, tasks, notes, settings, calendarIntegrations, calendarEvents
} from "@shared/schema";
import type {
  CalendarIntegration, InsertCalendarIntegration,
  CalendarEvent, InsertCalendarEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tasks
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByCategory(userId: number, category: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Notes
  getNotes(userId: number): Promise<Note[]>;
  getNoteById(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;
  
  // Settings
  getSettings(userId: number): Promise<Settings | undefined>;
  updateSettings(userId: number, settings: Partial<Settings>): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  
  // Calendar Integrations
  getCalendarIntegrations(userId: number): Promise<CalendarIntegration[]>;
  getCalendarIntegrationsByProvider(userId: number, provider: string): Promise<CalendarIntegration[]>;
  createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: number, integration: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: number): Promise<boolean>;
  
  // Calendar Events
  getCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  getCalendarEventsByIntegration(integrationId: number): Promise<CalendarEvent[]>;
  getCalendarEventByExternalId(externalId: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  deleteCalendarEventsByIntegration(integrationId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  
  async getTaskById(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getTasksByCategory(userId: number, category: string): Promise<Task[]> {
    return await db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.category, category)
      )
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    // Prepare base task data
    const taskData: any = {
      userId: insertTask.userId,
      title: insertTask.title,
      description: insertTask.description || "",
      completed: insertTask.completed || false,
      category: insertTask.category,
      // Convert any string dates to Date objects
      dueDate: insertTask.dueDate instanceof Date ? insertTask.dueDate : 
               (insertTask.dueDate ? new Date(insertTask.dueDate) : null)
    };
    
    // Add the new fields if they exist in the schema
    try {
      // Use raw query to insert with all fields to handle schema changes gracefully
      const query = `
        INSERT INTO tasks 
        (user_id, title, description, completed, category, due_date, 
         priority, estimated_minutes, location, people, recurring, recurring_pattern)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      // Import pool from db
      const { pool } = await import('./db');
      
      const { rows } = await pool.query(query, [
        insertTask.userId,
        insertTask.title,
        insertTask.description || "",
        insertTask.completed || false,
        insertTask.category,
        insertTask.dueDate instanceof Date ? insertTask.dueDate : 
               (insertTask.dueDate ? new Date(insertTask.dueDate) : null),
        insertTask.priority || "medium",
        insertTask.estimatedMinutes || null,
        insertTask.location || null,
        insertTask.people || null,
        insertTask.recurring || false,
        insertTask.recurringPattern || null
      ]);
      
      // Convert the returned row to a Task object
      return {
        id: rows[0].id,
        userId: rows[0].user_id,
        title: rows[0].title,
        description: rows[0].description,
        completed: rows[0].completed,
        dueDate: rows[0].due_date,
        category: rows[0].category,
        priority: rows[0].priority,
        estimatedMinutes: rows[0].estimated_minutes,
        location: rows[0].location,
        people: rows[0].people,
        recurring: rows[0].recurring,
        recurringPattern: rows[0].recurring_pattern,
        createdAt: rows[0].created_at
      };
    } catch (error) {
      console.error("Error creating task with extended fields, falling back to basic insert:", error);
      
      // Fallback to basic insert if the new columns don't exist yet
      const result = await db.insert(tasks).values(taskData).returning();
      return result[0];
    }
  }
  
  async updateTask(id: number, updatedFields: Partial<Task>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(updatedFields)
      .where(eq(tasks.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
  
  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return await db.select().from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(notes.timestamp);
  }
  
  async getNoteById(id: number): Promise<Note | undefined> {
    const result = await db.select().from(notes).where(eq(notes.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const result = await db.insert(notes).values({
      ...insertNote,
      // Convert any string timestamps to Date objects
      timestamp: insertNote.timestamp instanceof Date ? insertNote.timestamp :
                (insertNote.timestamp ? new Date(insertNote.timestamp) : new Date())
    }).returning();
    return result[0];
  }
  
  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id)).returning();
    return result.length > 0;
  }
  
  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    const result = await db.select().from(settings).where(eq(settings.userId, userId));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async updateSettings(userId: number, updatedFields: Partial<Settings>): Promise<Settings | undefined> {
    const userSettings = await this.getSettings(userId);
    
    if (!userSettings) return undefined;
    
    const result = await db.update(settings)
      .set(updatedFields)
      .where(eq(settings.id, userSettings.id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const result = await db.insert(settings).values(insertSettings).returning();
    return result[0];
  }

  // Initialize the database with sample data
  async initializeWithSampleData() {
    // Check if we already have a user
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return; // Already initialized
    }

    // Create a default user
    const newUser = await this.createUser({
      username: "user",
      password: "password",
      email: "user@example.com"
    });
    
    // Create default settings for the user
    await this.createSettings({
      userId: newUser.id,
      alwaysListening: true,
      wakeWord: "Hey Assistant",
      voiceGender: "female",
      saveConversations: true
    });
    
    // Add sample tasks for the user
    await this.createTask({
      userId: newUser.id,
      title: "Send quarterly report to Jim",
      description: "Complete the Q2 sales report and email it to Jim",
      completed: false,
      dueDate: new Date(Date.now() + 86400000),
      category: "work"
    });
    
    await this.createTask({
      userId: newUser.id,
      title: "Book restaurant for anniversary",
      description: "Make a reservation at Bella Italia for 7:30 PM",
      completed: true,
      dueDate: new Date(),
      category: "personal"
    });
    
    await this.createTask({
      userId: newUser.id,
      title: "Follow up on client proposal",
      description: "Call the client to discuss the proposal details",
      completed: false,
      dueDate: new Date(Date.now() - 172800000),
      category: "urgent"
    });
    
    // Add sample notes
    await this.createNote({
      userId: newUser.id,
      title: "Team Standup",
      content: "Discussed current sprint progress. Michael reported backend API issues that might delay the launch. Sara will prepare updated timeline by EOD.",
      category: "work",
      extractedTasks: 2,
      timestamp: new Date(Date.now() - 3600000)
    });
    
    await this.createNote({
      userId: newUser.id,
      title: "Client Call - Acme Corp",
      content: "Presented phase 1 deliverables. Client requested changes to the dashboard layout. Follow-up meeting scheduled for next Thursday to review revisions.",
      category: "work",
      extractedTasks: 3,
      timestamp: new Date(Date.now() - 7200000)
    });
    
    await this.createNote({
      userId: newUser.id,
      title: "Doctor Appointment",
      content: "Annual checkup completed. Need to schedule blood work follow-up in 3 months. Remember to take vitamin D supplements daily.",
      category: "personal",
      extractedTasks: 1,
      timestamp: new Date(Date.now() - 86400000)
    });
  }
  
  // Calendar Integration methods
  async getCalendarIntegrations(userId: number): Promise<CalendarIntegration[]> {
    return await db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, userId));
  }
  
  async getCalendarIntegrationsByProvider(userId: number, provider: string): Promise<CalendarIntegration[]> {
    return await db
      .select()
      .from(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.userId, userId),
        eq(calendarIntegrations.provider, provider)
      ));
  }
  
  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const [newIntegration] = await db
      .insert(calendarIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }
  
  async updateCalendarIntegration(id: number, integration: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(calendarIntegrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(calendarIntegrations.id, id))
      .returning();
    return updatedIntegration;
  }
  
  async deleteCalendarIntegration(id: number): Promise<boolean> {
    const result = await db
      .delete(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id));
    return result.rowCount > 0;
  }
  
  // Calendar Events methods
  async getCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));
  }
  
  async getCalendarEventsByIntegration(integrationId: number): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.integrationId, integrationId));
  }
  
  async getCalendarEventByExternalId(externalId: string): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.externalId, externalId));
    return event;
  }
  
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return newEvent;
  }
  
  async updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({ ...event, lastSynced: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, id));
    return result.rowCount > 0;
  }
  
  async deleteCalendarEventsByIntegration(integrationId: number): Promise<boolean> {
    const result = await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.integrationId, integrationId));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
