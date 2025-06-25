#!/bin/bash
set -e

echo "=== Iniciando Sistema de Gerenciamento de Almoxarifado em modo: ${NODE_ENV:-production} ==="

# Configuração do ambiente
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5013}

# Verificar se DATABASE_URL está definida (abordagem robusta)
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: Variável DATABASE_URL não está definida!"
  echo "Configure DATABASE_URL no ambiente de execução."
  exit 1
fi

echo "DATABASE_URL encontrada: ${DATABASE_URL//:*@/:***@}"

# Extrair informações de conexão da DATABASE_URL para logs
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
  PGUSER="${BASH_REMATCH[1]}"
  PGHOST="${BASH_REMATCH[3]}"
  PGPORT="${BASH_REMATCH[4]}"
  PGDATABASE="${BASH_REMATCH[5]}"
  
  echo "Configuração extraída da DATABASE_URL:"
  echo "- Usuário: $PGUSER"
  echo "- Host: $PGHOST"
  echo "- Porta: $PGPORT"
  echo "- Banco: $PGDATABASE"
else
  echo "Aviso: Não foi possível extrair componentes da DATABASE_URL"
fi

# Verificar se o banco de dados está acessível
echo "Verificando conexão com o banco de dados..."
MAX_ATTEMPTS=30
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