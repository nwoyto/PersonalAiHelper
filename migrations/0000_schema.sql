CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "email" TEXT
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "due_date" DATE,
  "category" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" VARCHAR(20) NOT NULL,
  "extracted_tasks" INTEGER NOT NULL DEFAULT 0,
  "timestamp" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "settings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "users"("id") UNIQUE,
  "always_listening" BOOLEAN NOT NULL DEFAULT true,
  "wake_word" TEXT NOT NULL DEFAULT 'Hey Assistant',
  "voice_gender" VARCHAR(10) NOT NULL DEFAULT 'female',
  "save_conversations" BOOLEAN NOT NULL DEFAULT true
);