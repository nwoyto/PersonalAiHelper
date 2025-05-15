export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  category: "work" | "personal" | "urgent";
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category: "work" | "personal";
  extractedTasks: number;
  timestamp: string;
}

export interface Settings {
  id: number;
  username: string;
  email: string;
  alwaysListening: boolean;
  wakeWord: string;
  voiceGender: "female" | "male" | "neutral";
  saveConversations: boolean;
}

export type InsertTask = Omit<Task, "id" | "createdAt">;
export type InsertNote = Omit<Note, "id">;
export type InsertSettings = Omit<Settings, "id">;

export interface TranscriptionResult {
  text: string;
  tasks: {
    title: string;
    dueDate?: string;
    category: "work" | "personal" | "urgent";
  }[];
}

export interface ExternalCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  provider: "google" | "outlook" | "apple";
  externalId: string;
  url?: string;
}

export interface CalendarIntegrationState {
  google: boolean;
  outlook: boolean;
  apple: boolean;
}
