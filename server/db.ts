import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Usar SEMPRE o banco almox1 (nunca almox2)
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.includes('/almox2')) {
  databaseUrl = databaseUrl.replace('/almox2', '/almox1');
  console.log('✅ Conectando no banco correto: almox1');
}

const sslConfig = databaseUrl?.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });