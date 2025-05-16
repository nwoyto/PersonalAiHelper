import { pgTable, text, serial, boolean, timestamp, varchar, date, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  dueDate: date("due_date"),
  category: varchar("category", { length: 20 }).notNull(),
  priority: varchar("priority", { length: 10 }).default("medium"),
  estimatedMinutes: integer("estimated_minutes"),
  location: text("location"),
  people: text("people").array(),
  recurring: boolean("recurring").default(false),
  recurringPattern: text("recurring_pattern"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create schema with proper date handling
export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: z.date().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  estimatedMinutes: z.number().positive().optional(),
  location: z.string().optional(),
  people: z.array(z.string()).optional(),
  recurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Notes table (for conversation history)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  extractedTasks: serial("extracted_tasks").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Create schema with proper date handling
export const insertNoteSchema = createInsertSchema(notes, {
  timestamp: z.date().optional(),
}).omit({
  id: true,
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  alwaysListening: boolean("always_listening").notNull().default(true),
  wakeWord: text("wake_word").notNull().default("Hey Assistant"),
  voiceGender: varchar("voice_gender", { length: 10 }).notNull().default("female"),
  saveConversations: boolean("save_conversations").notNull().default(true),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Calendar Integrations table
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  provider: varchar("provider", { length: 20 }).notNull(), // "google", "outlook", "apple"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  calendarId: text("calendar_id"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calendar Events table (for caching external events)
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  integrationId: integer("integration_id").references(() => calendarIntegrations.id),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  allDay: boolean("all_day").default(false),
  location: text("location"),
  url: text("url"),
  lastSynced: timestamp("last_synced").notNull().defaultNow(),
});

// Insert schemas
export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations, {
  tokenExpiry: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents, {
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  lastSynced: z.date().optional(),
}).omit({
  id: true,
  lastSynced: true,
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Calendar types
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;