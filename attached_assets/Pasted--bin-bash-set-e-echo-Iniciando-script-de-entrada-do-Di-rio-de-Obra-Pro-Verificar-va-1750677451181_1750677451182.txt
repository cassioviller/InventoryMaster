#!/bin/bash
set -e

echo ">>> Iniciando script de entrada do Diário de Obra Pro <<<"

# Verificar variáveis de ambiente
echo "Verificando variáveis de ambiente..."
: "${DATABASE_URL:?Variável DATABASE_URL não está configurada}"
: "${NODE_ENV:?Variável NODE_ENV não está configurada}"
: "${PORT:?Variável PORT não está configurada}"

# Verificar se o PostgreSQL está acessível
echo "Aguardando inicialização do PostgreSQL..."
MAX_ATTEMPTS=30
ATTEMPTS=0

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if pg_isready -d "$DATABASE_URL"; then
    echo "PostgreSQL está pronto!"
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "PostgreSQL não está pronto ainda - tentativa $ATTEMPTS de $MAX_ATTEMPTS - esperando..."
  sleep 2
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "Não foi possível conectar ao PostgreSQL após $MAX_ATTEMPTS tentativas. Verifique a conexão."
  exit 1
fi

echo "Verificando se a tabela 'users' existe..."
if psql "$DATABASE_URL" -c "SELECT to_regclass('public.users');" | grep -q "users"; then
  echo "Tabela 'users' já existe, pulando migração."
else
  echo "Tabela 'users' não existe. Executando migração inicial..."
  # Executar migrações do Drizzle
  NODE_ENV=production npm run db:push
  
  # Verificar se a migração foi bem-sucedida
  if psql "$DATABASE_URL" -c "SELECT to_regclass('public.users');" | grep -q "users"; then
    echo "Migração concluída com sucesso!"
  else
    echo "ERRO: Falha ao criar tabelas. Tentando novamente com mais detalhes..."
    # Tenta executar a migração com mais logs
    NODE_ENV=production DEBUG=drizzle* npm run db:push
    
    # Verifica se as tabelas existem
    if psql "$DATABASE_URL" -c "SELECT to_regclass('public.users');" | grep -q "users"; then
      echo "Migração finalmente concluída com sucesso!"
    else
      echo "ERRO CRÍTICO: Não foi possível criar as tabelas no banco de dados."
      echo "Tentando criar manualmente a partir do schema..."
      
      # Exportar o schema para SQL e executá-lo diretamente
      # Isso é uma solução de emergência caso o drizzle falhe
      NODE_ENV=production npx drizzle-kit generate:pg
      
      if [ -f "./drizzle/schema.sql" ]; then
        echo "Aplicando schema SQL manualmente..."
        psql "$DATABASE_URL" -f "./drizzle/schema.sql"
      else
        echo "ERRO FATAL: Não foi possível gerar ou encontrar schema SQL."
        exit 1
      fi
    fi
  fi
fi

echo ">>> Configuração do banco de dados concluída <<<"

# Executar o comando fornecido (geralmente npm run start)
echo "Iniciando aplicação na porta $PORT..."
exec "$@"