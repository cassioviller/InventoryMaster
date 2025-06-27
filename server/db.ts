import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

const url = process.env.DATABASE_URL!;
if (!url) throw new Error('DATABASE_URL não definida');

console.log(`Conectando ao banco: ${url.replace(/:[^:@]*@/,':***@')}`);

const sql = postgres(url, {
  ssl: url.includes('sslmode=require'),
  max: 10,
  connect_timeout: 10,
  idle_timeout: 30,
});

export const db = drizzle(sql, { schema });

// Função para verificar conexão
async function testDatabaseConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    return false;
  }
}

// Iniciar verificação, mas não bloqueie a inicialização do servidor
testDatabaseConnection();