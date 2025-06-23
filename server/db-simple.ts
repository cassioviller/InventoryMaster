import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Simple SSL configuration based on connection string
const sslConfig = process.env.DATABASE_URL.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });

// Simple table creation without retry loops
export async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        username varchar(50) UNIQUE NOT NULL,
        email varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        role varchar(20) DEFAULT 'user' NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "ownerId" integer,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        "categoryId" integer NOT NULL,
        unit varchar(50) NOT NULL,
        "currentStock" integer DEFAULT 0 NOT NULL,
        "minimumStock" integer DEFAULT 0 NOT NULL,
        "unitCost" numeric(10,2) DEFAULT 0 NOT NULL,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);
    
    console.log('Tables ensured successfully');
  } catch (error) {
    console.log('Table creation skipped:', (error as Error).message);
  }
}