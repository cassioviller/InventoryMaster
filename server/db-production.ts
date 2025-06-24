import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Usar sempre a DATABASE_URL do ambiente
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

console.log('🔗 Configurando conexão PostgreSQL...');
console.log('Ambiente:', process.env.NODE_ENV || 'development');

// Parse URL para debug
const dbUrl = new URL(connectionString);
console.log('Database host:', dbUrl.hostname);
console.log('Database name:', dbUrl.pathname.slice(1));

const sslConfig = connectionString.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString,
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
        } catch (error: any) {
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
    
  } catch (error: any) {
    console.error('❌ Erro na verificação de compatibilidade:', error);
    // Try to create basic schema if nothing exists
    try {
      await createCompleteSchema();
    } catch (createError: any) {
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
        contact_person VARCHAR(200),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS third_parties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(200),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS material_movements (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL,
        movement_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        employee_id INTEGER,
        supplier_id INTEGER,
        third_party_id INTEGER,
        description TEXT,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(50),
        record_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        owner_id INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    
    console.log('✅ Schema criado com sucesso');
    await ensureDefaultUsers();
    
  } catch (error: any) {
    console.error('❌ Erro ao criar schema:', error);
    throw error;
  }
}

async function ensureDefaultUsers() {
  try {
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
        email: 'cassio@example.com',
        password: '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8',
        name: 'Cassio Admin',
        role: 'super_admin',
        ownerId: 1
      },
      {
        username: 'almox',
        email: 'almox@example.com', 
        password: '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8',
        name: 'Almoxarife',
        role: 'admin',
        ownerId: 2
      },
      {
        username: 'empresa_teste',
        email: 'empresa@teste.com',
        password: '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8',
        name: 'Empresa Teste',
        role: 'admin',
        ownerId: 3
      }
    ];

    for (const user of defaultUsers) {
      try {
        await pool.query(`
          INSERT INTO users (username, email, password, name, role, "ownerId", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, now())
        `, [user.username, user.email, user.password, user.name, user.role, user.ownerId]);
        
        console.log(`✅ Usuário ${user.username} criado`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`ℹ️ Usuário ${user.username} já existe`);
        } else {
          console.error(`❌ Erro ao criar usuário ${user.username}:`, error.message);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuários padrão:', error);
  }
}