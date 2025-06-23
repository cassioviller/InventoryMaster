#!/usr/bin/env node
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set for EasyPanel initialization");
  process.exit(1);
}

const sslConfig = process.env.DATABASE_URL.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

async function initializeEasyPanelDatabase() {
  try {
    console.log('🚀 Iniciando configuração completa para EasyPanel...');
    
    // Create database if it doesn't exist
    try {
      await pool.query('CREATE DATABASE almoxarifado');
      console.log('✅ Banco de dados "almoxarifado" criado');
    } catch (error) {
      console.log('ℹ️ Banco de dados já existe ou erro esperado:', error.message);
    }

    // Create all tables with complete schema
    await createAllTables();
    
    // Fix column names for compatibility
    await fixColumnNames();
    
    // Create default users
    await createDefaultUsers();
    
    // Create sample data for testing
    await createSampleData();
    
    console.log('✅ Inicialização EasyPanel concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização EasyPanel:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createAllTables() {
  console.log('📋 Criando todas as tabelas...');
  
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      username varchar(100) UNIQUE NOT NULL,
      email varchar(150) UNIQUE NOT NULL,
      password varchar(255) NOT NULL,
      name varchar(255) NOT NULL DEFAULT 'User',
      role varchar(20) NOT NULL DEFAULT 'user',
      "isActive" boolean NOT NULL DEFAULT true,
      "ownerId" integer,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Categories table
    `CREATE TABLE IF NOT EXISTS categories (
      id serial PRIMARY KEY,
      name varchar(100) NOT NULL,
      description text,
      "ownerId" integer NOT NULL DEFAULT 2,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Materials table
    `CREATE TABLE IF NOT EXISTS materials (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      description text,
      "categoryId" integer NOT NULL,
      unit varchar(20) NOT NULL DEFAULT 'UN',
      "currentStock" integer NOT NULL DEFAULT 0,
      "minStock" integer NOT NULL DEFAULT 0,
      "unitPrice" decimal(10,2) NOT NULL DEFAULT 0,
      location varchar(100),
      "ownerId" integer NOT NULL DEFAULT 2,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Employees table
    `CREATE TABLE IF NOT EXISTS employees (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      department varchar(100),
      email varchar(100),
      phone varchar(20),
      "isActive" boolean NOT NULL DEFAULT true,
      "ownerId" integer NOT NULL DEFAULT 2,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Suppliers table
    `CREATE TABLE IF NOT EXISTS suppliers (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      cnpj varchar(18),
      email varchar(100),
      phone varchar(20),
      address text,
      notes text,
      "isActive" boolean NOT NULL DEFAULT true,
      "ownerId" integer NOT NULL DEFAULT 2,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Third parties table
    `CREATE TABLE IF NOT EXISTS third_parties (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      document varchar(20),
      document_type varchar(10) DEFAULT 'CPF',
      email varchar(100),
      phone varchar(20),
      address text,
      "isActive" boolean NOT NULL DEFAULT true,
      "ownerId" integer NOT NULL DEFAULT 2,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Material movements table
    `CREATE TABLE IF NOT EXISTS material_movements (
      id serial PRIMARY KEY,
      "materialId" integer NOT NULL,
      "userId" integer NOT NULL,
      "ownerId" integer NOT NULL,
      quantity integer NOT NULL,
      "movementType" varchar(10) NOT NULL,
      "originType" varchar(50),
      "originId" integer,
      "destinationType" varchar(50),
      "destinationId" integer,
      notes text,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`,
    
    // Movement items table
    `CREATE TABLE IF NOT EXISTS movement_items (
      id serial PRIMARY KEY,
      "movementId" integer NOT NULL,
      "materialId" integer NOT NULL,
      quantity integer NOT NULL,
      "unitPrice" decimal(10,2) NOT NULL DEFAULT 0
    )`,
    
    // Audit log table
    `CREATE TABLE IF NOT EXISTS audit_log (
      id serial PRIMARY KEY,
      "userId" integer NOT NULL,
      action varchar(50) NOT NULL,
      "tableName" varchar(50),
      "recordId" integer,
      "oldValues" jsonb,
      "newValues" jsonb,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`
  ];

  for (const table of tables) {
    try {
      await pool.query(table);
    } catch (error) {
      console.log(`⚠️ Erro ao criar tabela:`, error.message);
    }
  }
  
  console.log('✅ Todas as tabelas criadas/verificadas');
}

async function fixColumnNames() {
  console.log('🔧 Corrigindo nomes de colunas...');
  
  const fixes = [
    'ALTER TABLE users RENAME COLUMN created_at TO "createdAt"',
    'ALTER TABLE users RENAME COLUMN is_active TO "isActive"',
    'ALTER TABLE users RENAME COLUMN owner_id TO "ownerId"',
    'ALTER TABLE categories RENAME COLUMN created_at TO "createdAt"',
    'ALTER TABLE categories RENAME COLUMN owner_id TO "ownerId"',
    'ALTER TABLE materials RENAME COLUMN created_at TO "createdAt"',
    'ALTER TABLE materials RENAME COLUMN owner_id TO "ownerId"',
    'ALTER TABLE materials RENAME COLUMN category_id TO "categoryId"',
    'ALTER TABLE materials RENAME COLUMN current_stock TO "currentStock"',
    'ALTER TABLE materials RENAME COLUMN min_stock TO "minStock"',
    'ALTER TABLE materials RENAME COLUMN unit_price TO "unitPrice"',
  ];

  for (const fix of fixes) {
    try {
      await pool.query(fix);
    } catch (error) {
      // Ignore column already exists errors
    }
  }
  
  console.log('✅ Nomes de colunas corrigidos');
}

async function createDefaultUsers() {
  console.log('👥 Criando usuários padrão...');
  
  const defaultUsers = [
    {
      username: 'cassio',
      email: 'cassio@sistema.com',
      password: await bcrypt.hash('1234', 10),
      name: 'Cássio - Super Admin',
      role: 'super_admin',
      isActive: true,
      ownerId: null
    },
    {
      username: 'axiomtech',
      email: 'admin@axiomtech.com',
      password: await bcrypt.hash('cassio123', 10),
      name: 'AxiomTech Admin',
      role: 'admin',
      isActive: true,
      ownerId: null
    },
    {
      username: 'almox',
      email: 'almox@empresa.com',
      password: await bcrypt.hash('1234', 10),
      name: 'Operador Almoxarifado',
      role: 'user',
      isActive: true,
      ownerId: 2
    },
    {
      username: 'empresa_teste',
      email: 'teste@empresa.com',
      password: await bcrypt.hash('teste123', 10),
      name: 'Empresa Teste',
      role: 'admin',
      isActive: true,
      ownerId: null
    }
  ];

  for (const user of defaultUsers) {
    try {
      await pool.query(`
        INSERT INTO users (username, email, password, name, role, "isActive", "ownerId")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (username) DO UPDATE SET
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          "isActive" = EXCLUDED."isActive"
      `, [user.username, user.email, user.password, user.name, user.role, user.isActive, user.ownerId]);
      
      console.log(`✅ Usuário ${user.username} criado/atualizado`);
    } catch (error) {
      console.log(`⚠️ Erro ao criar usuário ${user.username}:`, error.message);
    }
  }
}

async function createSampleData() {
  console.log('📊 Criando dados de exemplo...');
  
  // Create categories
  const categories = [
    { name: 'Ferramentas', description: 'Ferramentas e equipamentos' },
    { name: 'Materiais Elétricos', description: 'Componentes elétricos' },
    { name: 'Parafusos e Fixadores', description: 'Elementos de fixação' },
    { name: 'Produtos Químicos', description: 'Produtos químicos e solventes' }
  ];

  for (const category of categories) {
    try {
      await pool.query(`
        INSERT INTO categories (name, description, "ownerId")
        VALUES ($1, $2, 2)
        ON CONFLICT DO NOTHING
      `, [category.name, category.description]);
    } catch (error) {
      console.log(`⚠️ Erro ao criar categoria ${category.name}:`, error.message);
    }
  }

  // Create employees
  const employees = [
    { name: 'João Silva', department: 'Manutenção', email: 'joao@empresa.com', phone: '(11) 99999-1111' },
    { name: 'Maria Santos', department: 'Almoxarifado', email: 'maria@empresa.com', phone: '(11) 99999-2222' },
    { name: 'Pedro Costa', department: 'Produção', email: 'pedro@empresa.com', phone: '(11) 99999-3333' }
  ];

  for (const employee of employees) {
    try {
      await pool.query(`
        INSERT INTO employees (name, department, email, phone, "ownerId")
        VALUES ($1, $2, $3, $4, 2)
        ON CONFLICT DO NOTHING
      `, [employee.name, employee.department, employee.email, employee.phone]);
    } catch (error) {
      console.log(`⚠️ Erro ao criar funcionário ${employee.name}:`, error.message);
    }
  }

  console.log('✅ Dados de exemplo criados');
}

// Execute initialization
initializeEasyPanelDatabase().catch((error) => {
  console.error('❌ Falha na inicialização:', error);
  process.exit(1);
});