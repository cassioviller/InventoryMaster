import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Only throw error at runtime, not during build
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'build') {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection only if DATABASE_URL is available
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  const sslConfig = process.env.DATABASE_URL.includes('sslmode=disable') 
    ? false 
    : { rejectUnauthorized: false };

  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  });
  db = drizzle(pool, { schema });
}

export { pool, db };