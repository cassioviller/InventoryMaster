import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Detectar se estamos em produção
const isProduction = process.env.NODE_ENV === 'production';

// Usar sempre DATABASE_URL sem fallback
const url = process.env.DATABASE_URL;

if (!url) throw new Error('DATABASE_URL não definida');

console.log(`Conectando ao banco: ${url.replace(/:[^:@]*@/,':***@')}`);

const sql = postgres(url, {
  ssl: url.includes('sslmode=require') || url.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  max: 10,
  connect_timeout: 10,
  idle_timeout: 30,
});

export const db = drizzle(sql, { schema });

// Função para detectar estrutura do banco e fazer migração se necessário
async function checkAndMigrateDatabaseSchema() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // Verificar se a tabela users existe e qual estrutura ela tem
    const columnsResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const columns = columnsResult.map(row => row.column_name);
    console.log('Colunas encontradas na tabela users:', columns);
    
    // Se encontrarmos createdAt (camelCase), significa que precisamos migrar
    if (columns.includes('createdAt') && !columns.includes('created_at')) {
      console.log('⚡ Detectada estrutura camelCase, migrando para snake_case...');
      await migrateCamelCaseToSnakeCase();
    } else if (columns.includes('created_at')) {
      console.log('✅ Estrutura snake_case já presente');
    } else {
      console.log('⚠️ Estrutura de tabela não reconhecida');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao verificar estrutura do banco:', err);
    return false;
  }
}

// Função para migrar de camelCase para snake_case
async function migrateCamelCaseToSnakeCase() {
  try {
    console.log('🔄 Iniciando migração de schema...');
    
    // Renomear colunas da tabela users
    await sql`ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;`;
    console.log('✅ users.createdAt → created_at');
    
    // Verificar e migrar outras tabelas se necessário
    const tables = ['categories', 'materials', 'suppliers', 'employees', 'third_parties', 'material_movements', 'audit_logs'];
    
    for (const table of tables) {
      try {
        const tableColumns = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table};
        `;
        
        const columnNames = tableColumns.map(row => row.column_name);
        
        if (columnNames.includes('createdAt')) {
          await sql`ALTER TABLE ${sql(table)} RENAME COLUMN "createdAt" TO created_at;`;
          console.log(`✅ ${table}.createdAt → created_at`);
        }
        
        if (columnNames.includes('ownerId')) {
          await sql`ALTER TABLE ${sql(table)} RENAME COLUMN "ownerId" TO owner_id;`;
          console.log(`✅ ${table}.ownerId → owner_id`);
        }
        
        // Migrar outras colunas específicas conforme necessário
        const columnMappings: Record<string, string> = {
          'categoryId': 'category_id',
          'currentStock': 'current_stock',
          'minimumStock': 'minimum_stock',
          'unitPrice': 'unit_price',
          'lastSupplierId': 'last_supplier_id',
          'isActive': 'is_active',
          'userId': 'user_id',
          'entityId': 'entity_id',
          'ipAddress': 'ip_address',
          'userAgent': 'user_agent'
        };
        
        for (const [oldName, newName] of Object.entries(columnMappings)) {
          if (columnNames.includes(oldName) && !columnNames.includes(newName)) {
            try {
              await sql`ALTER TABLE ${sql(table)} RENAME COLUMN ${sql(oldName)} TO ${sql(newName)};`;
              console.log(`✅ ${table}.${oldName} → ${newName}`);
            } catch (err) {
              console.log(`⚠️ Erro ao renomear ${table}.${oldName}:`, err);
            }
          }
        }
        
      } catch (tableErr) {
        console.log(`⚠️ Tabela ${table} não encontrada ou erro na migração:`, tableErr);
      }
    }
    
    console.log('✅ Migração de schema concluída com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro durante migração de schema:', err);
    throw err;
  }
}

// Função para verificar conexão
async function testDatabaseConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Em produção, verificar e migrar schema se necessário
    if (isProduction) {
      await checkAndMigrateDatabaseSchema();
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    return false;
  }
}

// Iniciar verificação
testDatabaseConnection();