import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Corrigir DATABASE_URL se estiver apontando para banco errado
let correctedDatabaseUrl = process.env.DATABASE_URL;
if (correctedDatabaseUrl && correctedDatabaseUrl.includes('/almox2?')) {
  correctedDatabaseUrl = correctedDatabaseUrl.replace('/almox2?', '/almox1?');
  console.log('🔧 DATABASE_URL corrigida de almox2 para almox1');
}

const sslConfig = correctedDatabaseUrl?.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: correctedDatabaseUrl,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });