import { 
  User, InsertUser, 
  Task, InsertTask, 
  Note, InsertNote, 
  Settings, InsertSettings,
  users, tasks, notes, settings
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
    const result = await db.insert(tasks).values(insertTask).returning();
    return result[0];
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
    const result = await db.insert(notes).values(insertNote).returning();
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
}

export const storage = new DatabaseStorage();
