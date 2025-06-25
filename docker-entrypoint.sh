#!/bin/bash
set -e

echo ">>> Iniciando Sistema de Gerenciamento de Almoxarifado <<<"

# CORREÇÃO CRÍTICA: Limpar variáveis PostgreSQL conflitantes do EasyPanel
echo "Verificando configuração do banco de dados..."

# Limpar variáveis que podem causar confusão
echo "Limpando variáveis PostgreSQL conflitantes..."
unset PGDATABASE
unset PGUSER  
unset PGHOST
unset PGPORT
unset PGPASSWORD

echo "Variáveis PostgreSQL limpas para evitar conflitos"

# FORÇAR DATABASE_URL correta para EasyPanel, ignorando variáveis conflitantes
echo "Configurando DATABASE_URL para EasyPanel..."

# CONFIGURAÇÃO FORÇADA - ignorar qualquer variável externa
DATABASE_URL="postgres://cassio:123@viajey_almo:5432/axiom?sslmode=disable"
export DATABASE_URL

echo "DATABASE_URL FORÇADA: postgres://cassio:***@viajey_almo:5432/axiom"
echo "IMPORTANTE: Ignorando variáveis PGDATABASE/PGUSER para prevenir conflitos"

# Verificar outras variáveis essenciais
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-5013}"

echo "Configuração:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- DATABASE_URL: ${DATABASE_URL//:*@/:***@}"

# Aguardar PostgreSQL estar pronto com timeout mais robusto
echo "Aguardando inicialização do PostgreSQL..."
MAX_ATTEMPTS=60
ATTEMPTS=0

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if timeout 10 node -e "
    const { Pool } = require('pg');
    // Usar DATABASE_URL do ambiente
    let dbUrl = process.env.DATABASE_URL;
    const ssl = dbUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false };
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: ssl
    });
    pool.query('SELECT 1').then(() => {
      console.log('PostgreSQL conectado com sucesso');
      process.exit(0);
    }).catch((err) => {
      console.log('Erro de conexão:', err.message);
      process.exit(1);
    });
  " 2>/dev/null; then
    echo "PostgreSQL está pronto!"
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "PostgreSQL não está pronto - tentativa $ATTEMPTS de $MAX_ATTEMPTS - aguardando..."
  sleep 3
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "AVISO: Não foi possível verificar PostgreSQL após $MAX_ATTEMPTS tentativas."
  echo "Iniciando aplicação - a inicialização automática do banco será feita pela aplicação."
fi

echo ">>> Sistema configurado com sucesso! <<<"
echo "Iniciando aplicação na porta $PORT..."

# Verificar se é ambiente de produção e fazer build se necessário
if [ "$NODE_ENV" = "production" ] && [ ! -f "dist/index.js" ]; then
  echo "Build não encontrado, executando build de produção..."
  npm run build 2>/dev/null || echo "Build falhou, tentando iniciar mesmo assim..."
fi

# A aplicação Node.js fará toda a inicialização automática do banco de dados
# incluindo criação do banco 'almoxarifado', tabelas e usuários padrão

# Iniciar a aplicação Node.js
echo "Executando: npm start"
npm start

# Fallback para argumentos adicionais do Docker
exec "$@"