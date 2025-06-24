// DATABASE_URL deve usar SEMPRE o banco almox1
// Usuário: almox2, Senha: almox3, Banco: almox1

export function ensureCorrectDatabase(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  
  // Garantir que sempre use o banco almox1 (nunca almox2)
  if (originalUrl.includes('/almox2?') || originalUrl.includes('/almox2$')) {
    const correctedUrl = originalUrl.replace(/\/almox2([?$])/, '/almox1$1');
    console.log('✅ Usando banco correto: almox1');
    return correctedUrl;
  }
  
  return originalUrl;
}

// Aplicar correção globalmente
if (process.env.DATABASE_URL) {
  const correctedUrl = ensureCorrectDatabase(process.env.DATABASE_URL);
  if (correctedUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = correctedUrl;
  }
}