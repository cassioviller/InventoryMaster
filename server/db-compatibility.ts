import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

console.log('🔗 Configurando conexão PostgreSQL...');
console.log('Database URL configurada:', process.env.DATABASE_URL ? 'Sim' : 'Não');

// Usar DATABASE_URL do ambiente (Neon em desenvolvimento)
let databaseUrl = process.env.DATABASE_URL;

// Parse the database URL to get individual components
const dbUrl = new URL(databaseUrl);
console.log('Database host:', dbUrl.hostname);
console.log('Database name:', dbUrl.pathname.slice(1));

const sslConfig = databaseUrl.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });

export async function ensureCompatibleTables() {
  try {
    console.log('🔄 Verificando compatibilidade do schema...');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('⚠️ Tabela users não existe, criando schema completo...');
      await createCompleteSchema();
      return;
    }
    
    // Check current column structure
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY column_name
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('Colunas existentes na tabela users:', existingColumns);
    
    // Add missing columns if they don't exist
    const requiredColumns = [
      { name: 'createdAt', type: 'timestamp', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now()' },
      { name: 'name', type: 'varchar(255)', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(255)' },
      { name: 'ownerId', type: 'integer', sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS "ownerId" integer' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Adicionando coluna ${column.name}...`);
        try {
          await pool.query(column.sql);
        } catch (error) {
          console.log(`Coluna ${column.name} já existe ou erro ao adicionar:`, error.message);
        }
      }
    }
    
    // Update existing records
    await pool.query(`UPDATE users SET "createdAt" = now() WHERE "createdAt" IS NULL`);
    await pool.query(`UPDATE users SET name = username WHERE name IS NULL OR name = ''`);
    
    console.log('✅ Schema verificado e atualizado');
    
    // Ensure default users exist
    await ensureDefaultUsers();
    
  } catch (error) {
    console.error('❌ Erro na verificação de compatibilidade:', error);
    // Try to create basic schema if nothing exists
    try {
      await createCompleteSchema();
    } catch (createError) {
      console.error('❌ Erro ao criar schema:', createError);
    }
  }
}

async function createCompleteSchema() {
  console.log('🔧 Criando schema completo do banco de dados...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name VARCHAR(200),
        role TEXT NOT NULL DEFAULT 'user',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "ownerId" INTEGER,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    // Create other essential tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category_id INTEGER NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'unidade',
        unit_price DECIMAL(10,2) DEFAULT 0.00,
        description TEXT,
        last_supplier_id INTEGER,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        department VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        contact_name VARCHAR(200),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    console.log('✅ Schema completo criado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao criar schema completo:', error);
    throw error;
  }
}

async function ensureDefaultUsers() {
  try {
    const bcrypt = await import('bcrypt');
    
    // Check existing users
    const existingUsers = await pool.query('SELECT username FROM users');
    const usernames = existingUsers.rows.map(row => row.username);
    
    console.log('Existing users found:', usernames);
    
    if (usernames.length > 0) {
      console.log('All default users already exist - preserving data');
      return;
    }
    
    // Create default users only if none exist
    const defaultUsers = [
      {
        username: 'cassio',
        email: 'cassio@superadmin.com',
        password: await bcrypt.hash('1234', 10),
        name: 'Cassio Super Admin',
        role: 'super_admin',
        isActive: true,
        ownerId: null
      },
      {
        username: 'almox',
        email: 'cassiovillerlm@gmail.com',
        password: await bcrypt.hash('almoxa@2024', 10),
        name: 'Almoxarifado Admin',
        role: 'admin',
        isActive: true,
        ownerId: null
      }
    ];
    
    for (const user of defaultUsers) {
      await pool.query(`
        INSERT INTO users (username, email, password, name, role, "isActive", "ownerId")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (username) DO NOTHING
      `, [user.username, user.email, user.password, user.name, user.role, user.isActive, user.ownerId]);
    }
    
    console.log('✅ Default users created successfully');
    
  } catch (error) {
    console.error('❌ Error creating default users:', error);
    // Don't throw - continue without default users
  }
}