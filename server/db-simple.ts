import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Usar SEMPRE o banco almox1
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.includes('/almox2')) {
  databaseUrl = databaseUrl.replace('/almox2', '/almox1');
  console.log('✅ Conectando no banco correto: almox1');
}

// Simple SSL configuration based on connection string
const sslConfig = databaseUrl.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: databaseUrl,
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
    // Check which users already exist to preserve data
    const existingUsers = await pool.query('SELECT username FROM users WHERE username IN ($1, $2, $3, $4)', [
      'cassio', 'axiomtech', 'almox', 'empresa_teste'
    ]);
    
    const existingUsernames = existingUsers.rows.map(row => row.username);
    console.log('Existing users found:', existingUsernames.length > 0 ? existingUsernames : 'none');
    
    // Only recreate users if FORCE_DB_INIT is true and in production
    if (process.env.FORCE_DB_INIT === 'true' && process.env.NODE_ENV === 'production') {
      console.log('Force DB initialization - updating/creating users...');
    } else if (existingUsernames.length >= 4) {
      console.log('All default users already exist - preserving data');
      return;
    }

    const bcrypt = await import('bcrypt');
    console.log('Creating default users for EasyPanel deployment...');

    // Super Admin do Sistema (cassio) - ID 1
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        "isActive" = EXCLUDED."isActive"
    `, [
      'cassio',
      'cassio@almoxarifado.com',
      await bcrypt.hash('1234', 10),
      'Cassio Admin Sistema',
      'super_admin',
      true,
      null
    ]);

    // Super Admin Empresa (axiomtech) - ID 2
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        "isActive" = EXCLUDED."isActive"
    `, [
      'axiomtech',
      'axiomtech@almoxarifado.com',
      await bcrypt.hash('cassio123', 10),
      'AxiomTech',
      'admin',
      true,
      null
    ]);

    // Usuário Padrão (almox) - ID 3  
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        "isActive" = EXCLUDED."isActive"
    `, [
      'almox',
      'almox@almoxarifado.com',
      await bcrypt.hash('1234', 10),
      'Usuário Almoxarifado',
      'user',
      true,
      2
    ]);

    // Empresa Teste - ID 4
    await pool.query(`
      INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        "isActive" = EXCLUDED."isActive"
    `, [
      'empresa_teste',
      'empresa@teste.com',
      await bcrypt.hash('teste123', 10),
      'Empresa Teste',
      'admin',
      true,
      2
    ]);

    console.log('✅ Default users created/updated successfully for EasyPanel');
    
    // Verify user creation
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users in database: ${userCount.rows[0]?.count}`);
    
  } catch (error) {
    console.error('❌ Error creating default users:', (error as Error).message);
    throw error;
  }
}