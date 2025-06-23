import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sslConfig = process.env.DATABASE_URL.includes('sslmode=disable') 
  ? false 
  : { rejectUnauthorized: false };

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });

export async function ensureCompatibleTables() {
  try {
    console.log('🔄 Verificando compatibilidade do schema...');
    
    // Check if createdAt column exists in users table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'createdAt'
    `);
    
    const hasCreatedAt = columnCheck.rows.length > 0;
    
    if (!hasCreatedAt) {
      console.log('⚠️ Schema antigo detectado, adicionando colunas necessárias...');
      
      // Add missing columns
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT now()');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(255)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "ownerId" integer');
        
        // Update existing records
        await pool.query('UPDATE users SET "createdAt" = now() WHERE "createdAt" IS NULL');
        await pool.query('UPDATE users SET name = username WHERE name IS NULL OR name = \'\'');
        
        console.log('✅ Schema atualizado com sucesso');
      } catch (error) {
        console.log('ℹ️ Algumas colunas já existem ou não puderam ser adicionadas');
      }
    } else {
      console.log('✅ Schema já está compatível');
    }
    
    // Ensure default users exist
    await ensureDefaultUsers();
    
  } catch (error) {
    console.error('❌ Erro na verificação de compatibilidade:', error);
    // Don't throw - continue with existing schema
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