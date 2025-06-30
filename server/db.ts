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

// Garantir SSL para Neon
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl.includes('neon.tech') && !databaseUrl.includes('sslmode')) {
  databaseUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}

console.log('🔧 Configurando conexão PostgreSQL:', databaseUrl.replace(/:[^:]*@/, ':***@'));

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });