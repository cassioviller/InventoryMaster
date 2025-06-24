// Correção universal da DATABASE_URL
// Este arquivo garante que qualquer conexão use o banco correto (almox1)

export function fixDatabaseUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  
  // Corrigir almox2 para almox1 (problema identificado em produção)
  if (originalUrl.includes('/almox2?')) {
    const correctedUrl = originalUrl.replace('/almox2?', '/almox1?');
    console.log('🔧 DATABASE_URL corrigida automaticamente: almox2 → almox1');
    return correctedUrl;
  }
  
  return originalUrl;
}

// Aplicar correção globalmente
if (process.env.DATABASE_URL) {
  const correctedUrl = fixDatabaseUrl(process.env.DATABASE_URL);
  if (correctedUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = correctedUrl;
  }
}