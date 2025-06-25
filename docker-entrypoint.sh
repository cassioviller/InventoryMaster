#!/bin/bash
set -e

echo ">>> Iniciando Sistema de Gerenciamento de Almoxarifado <<<"

# Validar e corrigir DATABASE_URL para prevenir erro EasyPanel
echo "Verificando configuração do banco de dados..."

# Executar validação crítica
if [ -f "validate-database-url.sh" ]; then
    chmod +x validate-database-url.sh
    ./validate-database-url.sh
    if [ $? -ne 0 ]; then
        echo "ERRO: Validação de DATABASE_URL falhou"
        exit 1
    fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL não definida - configurando automaticamente..."
  
  # CONFIGURAÇÃO CORRETA PARA EASYPANEL conforme credenciais fornecidas
  POSTGRES_USER="${POSTGRES_USER:-cassio}"
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-123}"
  POSTGRES_HOST="${POSTGRES_HOST:-viajey_almo}"
  POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  # USAR banco "axiom" conforme configuração do EasyPanel
  POSTGRES_DB="axiom"
  
  # Construir DATABASE_URL
  DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB?sslmode=disable"
  export DATABASE_URL
  
  echo "DATABASE_URL configurada: postgres://$POSTGRES_USER:***@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
  echo "IMPORTANTE: Usando credenciais corretas do EasyPanel - banco 'axiom'"
fi

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