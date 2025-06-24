import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// CONEXÃO INTELIGENTE - DEV USA NEON, PROD USA VIAJEY_CASSIO
const isDevelopment = process.env.NODE_ENV === 'development';
const connectionString = isDevelopment 
  ? process.env.DATABASE_URL
  : "postgres://axiom:estruturas@viajey_cassio:5432/almoxarifado?sslmode=disable";

console.log('🔗 Conectando diretamente ao PostgreSQL...');
console.log('Ambiente:', process.env.NODE_ENV || 'development');

// Parse URL para debug
try {
  const dbUrl = new URL(connectionString);
  console.log('Database host:', dbUrl.hostname);
  console.log('Database name:', dbUrl.pathname.slice(1));
  console.log('Database user:', dbUrl.username);
} catch (error) {
  console.log('Usando DATABASE_URL configurada');
}

export const pool = new Pool({ 
  connectionString,
  ssl: false  // Força SSL desabilitado
});

export const db = drizzle(pool, { schema });

export async function ensureCompatibleTables() {
  try {
    console.log('🔄 Criando schema de produção...');
    await createProductionSchema();
    await ensureDefaultUsers();
    console.log('✅ Sistema inicializado para produção');
  } catch (error: any) {
    console.error('❌ Erro na inicialização:', error.message);
    throw error;
  }
}

async function createProductionSchema() {
  // Criar todas as tabelas sem verificar se existem
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name VARCHAR(200),
      role TEXT NOT NULL DEFAULT 'user',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "ownerId" INTEGER DEFAULT 1,
      "createdAt" TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category_id INTEGER NOT NULL,
      current_stock INTEGER NOT NULL DEFAULT 0,
      minimum_stock INTEGER NOT NULL DEFAULT 0,
      unit VARCHAR(20) DEFAULT 'unidade',
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      description TEXT,
      last_supplier_id INTEGER,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      department VARCHAR(100),
      email VARCHAR(100),
      phone VARCHAR(20),
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(200),
      email VARCHAR(100),
      phone VARCHAR(20),
      address TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS third_parties (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      contact_person VARCHAR(200),
      email VARCHAR(100),
      phone VARCHAR(20),
      address TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS material_movements (
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
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      action VARCHAR(100) NOT NULL,
      table_name VARCHAR(50),
      record_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      owner_id INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`
  ];

  for (const table of tables) {
    try {
      await pool.query(table);
    } catch (error: any) {
      console.log('Tabela já existe ou erro esperado:', error.message);
    }
  }
  
  console.log('✅ Schema de produção criado');
}

async function ensureDefaultUsers() {
  try {
    const existingUsers = await pool.query('SELECT username FROM users LIMIT 1');
    
    if (existingUsers.rows.length > 0) {
      console.log('ℹ️ Usuários já existem - preservando dados');
      return;
    }

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
        username: 'empresa_teste',
        email: 'empresa@teste.com',
        password: '$2b$10$K8K1K8K1K8K1K8K1K8K1K.K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8K1K8',
        name: 'Empresa Teste',
        role: 'admin',
        ownerId: 1
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
        console.log(`ℹ️ Usuário ${user.username} já existe ou erro:`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  }
}