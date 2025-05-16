async function migration(db) {
  console.log("[Migration] Starting calendar tables fix");

  try {
    // Check if calendar_events has user_id column, if not add it
    await db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'calendar_events' AND column_name = 'user_id') THEN
          ALTER TABLE calendar_events ADD COLUMN user_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `);
    console.log("[Migration] Checked user_id column in calendar_events");

    // Remove references to updated_at column in calendar_integrations table queries
    await db.execute(`
      ALTER TABLE calendar_integrations 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("[Migration] Added missing updated_at column to calendar_integrations");

    // Add missing columns to calendar_events if needed
    await db.execute(`
      ALTER TABLE calendar_events 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("[Migration] Added missing created_at column to calendar_events");

    console.log("[Migration] Successfully fixed calendar tables");
    return true;
  } catch (error) {
    console.error("[Migration] Failed to fix calendar tables:", error);
    return false;
  }
}

module.exports = migration;