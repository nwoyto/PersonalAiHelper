import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Run migrations
export async function runMigrations() {
  try {
    // Add new columns to tasks table
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS people TEXT[],
      ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS recurring_pattern TEXT;
    `);
    
    console.log('[Migration] Successfully added new columns to tasks table');
    
    // Add calendar_integrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        provider VARCHAR(20) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        calendar_id TEXT,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Ensure updated_at column exists in calendar_integrations
    await pool.query(`
      ALTER TABLE calendar_integrations
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    
    console.log('[Migration] Successfully created calendar_integrations table');
    
    // Add calendar_events table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER REFERENCES calendar_integrations(id) ON DELETE CASCADE,
        external_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        all_day BOOLEAN DEFAULT false,
        location TEXT,
        url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('[Migration] Successfully created calendar_events table');
    
    return true;
  } catch (error) {
    console.error('[Migration Error]', error);
    return false;
  }
}