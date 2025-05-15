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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create schema with proper date handling
export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: z.date().optional(),
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

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;