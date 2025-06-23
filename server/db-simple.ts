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
    // Create users table first
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
    
    // Create other tables
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL,
        email varchar(255),
        phone varchar(20),
        department varchar(255),
        position varchar(255),
        "isActive" boolean DEFAULT true NOT NULL,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL,
        contact varchar(255),
        email varchar(255),
        phone varchar(20),
        address text,
        "isActive" boolean DEFAULT true NOT NULL,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "thirdParties" (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL,
        contact varchar(255),
        email varchar(255),
        phone varchar(20),
        address text,
        "isActive" boolean DEFAULT true NOT NULL,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "materialMovements" (
        id serial PRIMARY KEY,
        "materialId" integer NOT NULL,
        type varchar(10) NOT NULL,
        quantity integer NOT NULL,
        "unitCost" numeric(10,2),
        "totalCost" numeric(12,2),
        "employeeId" integer,
        "supplierId" integer,
        "thirdPartyId" integer,
        observations text,
        "userId" integer NOT NULL,
        "ownerId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "auditLogs" (
        id serial PRIMARY KEY,
        "tableName" varchar(100) NOT NULL,
        action varchar(20) NOT NULL,
        "recordId" integer,
        "oldValues" text,
        "newValues" text,
        "userId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create indices
    await pool.query('CREATE INDEX IF NOT EXISTS materials_category_idx ON materials ("categoryId")');
    await pool.query('CREATE INDEX IF NOT EXISTS materials_owner_idx ON materials ("ownerId")');
    await pool.query('CREATE INDEX IF NOT EXISTS movements_material_idx ON "materialMovements" ("materialId")');
    await pool.query('CREATE INDEX IF NOT EXISTS movements_owner_idx ON "materialMovements" ("ownerId")');
    
    // Always try to create default users regardless of table creation
    await createDefaultUsers();
    
    console.log('Tables and users ensured successfully');
  } catch (error) {
    console.log('Table creation skipped:', (error as Error).message);
    // Still try to create users even if tables already exist
    await createDefaultUsers();
  }
}

async function createDefaultUsers() {
  try {
    // Check if users already exist
    const existingUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0]?.count > 0) {
      console.log('Default users already exist');
      return;
    }

    const bcrypt = await import('bcrypt');
    console.log('Creating default users...');

    // Super Admin do Sistema (cassio)
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'cassio',
      'cassio@almoxarifado.com',
      await bcrypt.hash('1234', 10),
      'Cassio Admin Sistema',
      'super_admin',
      true,
      null
    ]);

    // Super Admin Empresa (axiomtech)
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'axiomtech',
      'axiomtech@almoxarifado.com',
      await bcrypt.hash('cassio123', 10),
      'AxiomTech',
      'admin',
      true,
      null
    ]);

    // Usuário Padrão (almox)
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'almox',
      'almox@almoxarifado.com',
      await bcrypt.hash('1234', 10),
      'Usuário Almoxarifado',
      'user',
      true,
      2
    ]);

    // Empresa Teste
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'empresa_teste',
      'empresa@teste.com',
      await bcrypt.hash('teste123', 10),
      'Empresa Teste',
      'admin',
      true,
      2
    ]);

    console.log('Default users created successfully');
  } catch (error) {
    console.log('Default users creation skipped:', (error as Error).message);
  }
}