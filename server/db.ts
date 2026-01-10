import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return url;
}

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: getDatabaseUrl() });
  }
  return _pool;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

export async function initializeDatabase(): Promise<void> {
  const database = getDb();
  
  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CLIENT',
      onboarding_completed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS locations (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS availability_blocks (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      branch_id VARCHAR(36) NOT NULL REFERENCES locations(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 90,
      booking_type TEXT NOT NULL DEFAULT 'app',
      branch_id VARCHAR(36) NOT NULL REFERENCES locations(id),
      branch_name TEXT NOT NULL,
      user_id VARCHAR(36) REFERENCES users(id),
      user_name TEXT,
      manual_client_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS meal_preferences (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id),
      likes TEXT NOT NULL DEFAULT '',
      dislikes TEXT NOT NULL DEFAULT '',
      meals_per_day INTEGER NOT NULL DEFAULT 3,
      goals TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_notes (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id),
      note TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS trainer_meal_plans (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id),
      content TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'text',
      file_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await database.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT,
      body TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'all',
      date_filter TEXT,
      week_filter BOOLEAN DEFAULT false,
      location_id VARCHAR(36),
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      recipient_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log("Database tables initialized");
}
