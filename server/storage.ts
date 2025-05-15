import { 
  User, InsertUser, 
  Task, InsertTask, 
  Note, InsertNote, 
  Settings, InsertSettings 
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private notes: Map<number, Note>;
  private settings: Map<number, Settings>;
  currentUserId: number;
  currentTaskId: number;
  currentNoteId: number;
  currentSettingsId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.notes = new Map();
    this.settings = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentNoteId = 1;
    this.currentSettingsId = 1;
    
    // Create a default user
    this.createUser({
      username: "user",
      password: "password",
      email: "user@example.com"
    });
    
    // Create default settings for the user
    this.createSettings({
      userId: 1,
      alwaysListening: true,
      wakeWord: "Hey Assistant",
      voiceGender: "female",
      saveConversations: true
    });
    
    // Add sample tasks for the user
    this.createTask({
      userId: 1,
      title: "Send quarterly report to Jim",
      description: "Complete the Q2 sales report and email it to Jim",
      completed: false,
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      category: "work"
    });
    
    this.createTask({
      userId: 1,
      title: "Book restaurant for anniversary",
      description: "Make a reservation at Bella Italia for 7:30 PM",
      completed: true,
      dueDate: new Date().toISOString(),
      category: "personal"
    });
    
    this.createTask({
      userId: 1,
      title: "Follow up on client proposal",
      description: "Call the client to discuss the proposal details",
      completed: false,
      dueDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      category: "urgent"
    });
    
    // Add sample notes
    this.createNote({
      userId: 1,
      title: "Team Standup",
      content: "Discussed current sprint progress. Michael reported backend API issues that might delay the launch. Sara will prepare updated timeline by EOD.",
      category: "work",
      extractedTasks: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    });
    
    this.createNote({
      userId: 1,
      title: "Client Call - Acme Corp",
      content: "Presented phase 1 deliverables. Client requested changes to the dashboard layout. Follow-up meeting scheduled for next Thursday to review revisions.",
      category: "work",
      extractedTasks: 3,
      timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    });
    
    this.createNote({
      userId: 1,
      title: "Doctor Appointment",
      content: "Annual checkup completed. Need to schedule blood work follow-up in 3 months. Remember to take vitamin D supplements daily.",
      category: "personal",
      extractedTasks: 1,
      timestamp: new Date(Date.now() - 86400000).toISOString() // Yesterday
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }
  
  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByCategory(userId: number, category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId && task.category === category,
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date().toISOString();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updatedFields: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updatedFields };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Note methods
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter((note) => note.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getNoteById(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { ...insertNote, id };
    this.notes.set(id, note);
    return note;
  }
  
  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }
  
  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(
      (settings) => settings.userId === userId,
    );
  }
  
  async updateSettings(userId: number, updatedFields: Partial<Settings>): Promise<Settings | undefined> {
    const userSettings = Array.from(this.settings.values()).find(
      (settings) => settings.userId === userId,
    );
    
    if (!userSettings) return undefined;
    
    const updatedSettings = { ...userSettings, ...updatedFields };
    this.settings.set(userSettings.id, updatedSettings);
    return updatedSettings;
  }
  
  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = this.currentSettingsId++;
    const settings: Settings = { ...insertSettings, id };
    this.settings.set(id, settings);
    return settings;
  }
}

export const storage = new MemStorage();
