import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔧 Configurando conexão PostgreSQL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

// Configuração SSL para Neon
const client = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('neon.tech') ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

export const db = drizzle(client, { schema });