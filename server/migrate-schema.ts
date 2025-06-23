import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sslConfig = process.env.DATABASE_URL.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

async function migrateSchema() {
  try {
    console.log('🔄 Verificando e corrigindo schema do banco...');
    
    // Add missing columns if they don't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now()');
      console.log('✅ Coluna createdAt adicionada à tabela users');
    } catch (error) {
      console.log('ℹ️ Coluna createdAt já existe ou não pôde ser adicionada');
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(255) DEFAULT \'User\'');
      console.log('✅ Coluna name adicionada à tabela users');
    } catch (error) {
      console.log('ℹ️ Coluna name já existe ou não pôde ser adicionada');
    }

    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "ownerId" integer');
      console.log('✅ Coluna ownerId adicionada à tabela users');
    } catch (error) {
      console.log('ℹ️ Coluna ownerId já existe ou não pôde ser adicionada');
    }

    // Update existing users without createdAt
    await pool.query(`
      UPDATE users 
      SET "createdAt" = now() 
      WHERE "createdAt" IS NULL
    `);

    // Update existing users without name
    await pool.query(`
      UPDATE users 
      SET name = username 
      WHERE name IS NULL OR name = ''
    `);

    console.log('✅ Schema migrado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateSchema().catch(console.error);