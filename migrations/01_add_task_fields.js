async function migration(db) {
  try {
    // Add new columns to tasks table
    await db.query(`
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
    await db.query(`
      CREATE TABLE IF NOT EXISTS calendar_integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        provider VARCHAR(20) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        calendar_id TEXT,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('[Migration] Successfully created calendar_integrations table');
    
    // Add calendar_events table if it doesn't exist
    await db.query(`
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

module.exports = migration;