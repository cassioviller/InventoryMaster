import { Pool } from 'pg';

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log('🔧 Inicializando banco de dados...');

  try {
    // Usar SEMPRE o banco almox1
    let databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && databaseUrl.includes('/almox2')) {
      databaseUrl = databaseUrl.replace('/almox2', '/almox1');
      console.log('✅ Conectando no banco correto: almox1');
    }

    // Primeiro, conectar ao banco postgres padrão para criar o banco almoxarifado
    const baseUrl = databaseUrl.replace(/\/[^\/]+(\?|$)/, '/postgres$1');
    const basePool = new Pool({ 
      connectionString: baseUrl,
      ssl: baseUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
    });
    
    try {
      // Tentar criar o banco almoxarifado
      await basePool.query('CREATE DATABASE almoxarifado');
      console.log('✅ Banco "almoxarifado" criado com sucesso');
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('✅ Banco "almoxarifado" já existe');
      } else {
        console.warn('⚠️  Erro ao criar banco:', error.message);
      }
    } finally {
      await basePool.end();
    }

    // Agora conectar ao banco almoxarifado para criar as tabelas
    const almoxUrl = databaseUrl.replace(/\/[^\/]+(\?|$)/, '/almoxarifado$1');
    const pool = new Pool({ 
      connectionString: almoxUrl,
      ssl: almoxUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
    });

    // Verificar se as tabelas já existem
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    if (tablesQuery.rows.length === 0) {
      console.log('🔄 Criando tabelas...');
      
      // Criar todas as tabelas usando SQL direto
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "username" varchar(50) NOT NULL,
          "email" varchar(255) NOT NULL,
          "password" varchar(255) NOT NULL,
          "name" varchar(255) NOT NULL,
          "role" varchar(20) DEFAULT 'user' NOT NULL,
          "isActive" boolean DEFAULT true NOT NULL,
          "ownerId" integer,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "users_username_unique" UNIQUE("username"),
          CONSTRAINT "users_email_unique" UNIQUE("email")
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "materials" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text,
          "categoryId" integer NOT NULL,
          "unit" varchar(50) NOT NULL,
          "currentStock" integer DEFAULT 0 NOT NULL,
          "minimumStock" integer DEFAULT 0 NOT NULL,
          "unitCost" numeric(10,2) DEFAULT '0' NOT NULL,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "employees" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "email" varchar(255),
          "phone" varchar(20),
          "department" varchar(255),
          "position" varchar(255),
          "isActive" boolean DEFAULT true NOT NULL,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "suppliers" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "contact" varchar(255),
          "email" varchar(255),
          "phone" varchar(20),
          "address" text,
          "isActive" boolean DEFAULT true NOT NULL,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "thirdParties" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar(255) NOT NULL,
          "contact" varchar(255),
          "email" varchar(255),
          "phone" varchar(20),
          "address" text,
          "isActive" boolean DEFAULT true NOT NULL,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "materialMovements" (
          "id" serial PRIMARY KEY NOT NULL,
          "materialId" integer NOT NULL,
          "type" varchar(10) NOT NULL,
          "quantity" integer NOT NULL,
          "unitCost" numeric(10,2),
          "totalCost" numeric(12,2),
          "employeeId" integer,
          "supplierId" integer,
          "thirdPartyId" integer,
          "observations" text,
          "userId" integer NOT NULL,
          "ownerId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "auditLogs" (
          "id" serial PRIMARY KEY NOT NULL,
          "tableName" varchar(100) NOT NULL,
          "action" varchar(20) NOT NULL,
          "recordId" integer,
          "oldValues" text,
          "newValues" text,
          "userId" integer NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )
      `);

      // Criar índices importantes
      await pool.query('CREATE INDEX IF NOT EXISTS "materials_category_idx" ON "materials" ("categoryId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "materials_owner_idx" ON "materials" ("ownerId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "movements_material_idx" ON "materialMovements" ("materialId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "movements_owner_idx" ON "materialMovements" ("ownerId")');

      console.log('✅ Tabelas criadas com sucesso');

      // Criar usuários padrão
      await createDefaultUsers(pool);
    } else {
      console.log('✅ Tabelas já existem');
    }

    await pool.end();
    
    // Atualizar a DATABASE_URL para apontar para o banco almoxarifado
    process.env.DATABASE_URL = almoxUrl;
    
    console.log('✅ Banco de dados inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

async function createDefaultUsers(pool: Pool) {
  try {
    const bcrypt = await import('bcrypt');
    
    // Verificar se já existem usuários
    const existingUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0]?.count > 0) {
      console.log('✅ Usuários já existem');
      return;
    }

    // Criar usuários padrão
    const users = [
      {
        username: 'cassio',
        email: 'cassio@admin.com',
        password: await bcrypt.hash('1234', 10),
        name: 'Super Administrador',
        role: 'system_super_admin',
        isActive: true,
        ownerId: null
      },
      {
        username: 'axiomtech',
        email: 'axiomtech@admin.com', 
        password: await bcrypt.hash('cassio123', 10),
        name: 'Administrador Axiom',
        role: 'super_admin',
        isActive: true,
        ownerId: null
      },
      {
        username: 'almox',
        email: 'almox@teste.com',
        password: await bcrypt.hash('1234', 10),
        name: 'Usuário Teste',
        role: 'admin',
        isActive: true,
        ownerId: 2
      },
      {
        username: 'empresa_teste',
        email: 'empresa@teste.com',
        password: await bcrypt.hash('teste123', 10),
        name: 'Empresa Teste',
        role: 'admin', 
        isActive: true,
        ownerId: 2
      }
    ];

    for (const user of users) {
      await pool.query(`
        INSERT INTO users (username, email, password, name, role, "isActive", "ownerId", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [user.username, user.email, user.password, user.name, user.role, user.isActive, user.ownerId]);
    }

    console.log('✅ Usuários padrão criados');
  } catch (error) {
    console.error('❌ Erro ao criar usuários padrão:', error);
  }
}