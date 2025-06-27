import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// Em desenvolvimento usar Neon, em produção usar EasyPanel
const url = process.env.NODE_ENV === 'production' 
  ? process.env.DATABASE_URL!
  : process.env.DATABASE_URL || 'postgresql://neondb_owner:7YPEYyLMlk1d@ep-fancy-wave-a5f1svp6.us-east-2.aws.neon.tech/neondb?sslmode=require';

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