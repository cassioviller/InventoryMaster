import { Pool } from 'pg';

export async function simpleInitDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set, skipping database initialization');
    return;
  }

  console.log('🔧 Inicializando banco de dados...');

  try {
    // Connect directly to the existing database
    const ssl = process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false };
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: ssl
    });

    // Check if tables exist
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    if (tablesQuery.rows.length === 0) {
      console.log('🔄 Criando tabelas...');
      
      // Create all tables using direct SQL
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

      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS "materials_category_idx" ON "materials" ("categoryId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "materials_owner_idx" ON "materials" ("ownerId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "movements_material_idx" ON "materialMovements" ("materialId")');
      await pool.query('CREATE INDEX IF NOT EXISTS "movements_owner_idx" ON "materialMovements" ("ownerId")');

      console.log('✅ Tabelas criadas com sucesso');

      // Create default users
      await createDefaultUsers(pool);
    } else {
      console.log('✅ Tabelas já existem');
    }

    await pool.end();
    console.log('✅ Banco de dados inicializado com sucesso');
    
  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    throw error;
  }
}

async function createDefaultUsers(pool: Pool) {
  try {
    const bcrypt = await import('bcrypt');
    
    // Check if users already exist
    const existingUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0]?.count > 0) {
      console.log('✅ Usuários já existem');
      return;
    }

    console.log('🔄 Criando usuários padrão...');

    const users = [
      {
        username: 'cassio',
        email: 'cassio@almoxarifado.com',
        password: await bcrypt.hash('1234', 10),
        name: 'Cassio Admin',
        role: 'super_admin',
        isActive: true,
        ownerId: null
      },
      {
        username: 'axiomtech',
        email: 'axiomtech@almoxarifado.com',
        password: await bcrypt.hash('cassio123', 10),
        name: 'AxiomTech',
        role: 'admin',
        isActive: true,
        ownerId: null
      },
      {
        username: 'almox',
        email: 'almox@almoxarifado.com',
        password: await bcrypt.hash('1234', 10),
        name: 'Usuário Almoxarifado',
        role: 'user',
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

    console.log('✅ Usuários padrão criados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error.message);
    throw error;
  }
}