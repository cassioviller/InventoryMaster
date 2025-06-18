#!/bin/bash
set -e

echo "🚀 Iniciando Sistema de Gerenciamento de Almoxarifado..."

# Função para aguardar o banco de dados estar disponível
wait_for_db() {
  echo "⏳ Aguardando banco de dados estar disponível..."
  
  # Extrair componentes da DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')
  DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
  DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
  DB_USER=$(echo $DATABASE_URL | sed 's/.*\/\/\([^:]*\):.*/\1/')
  DB_PASS=$(echo $DATABASE_URL | sed 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/')

  # Aguardar até que o PostgreSQL esteja disponível
  until PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
    echo "PostgreSQL ainda não está disponível - aguardando..."
    sleep 2
  done

  echo "✅ PostgreSQL está disponível!"
}

# Executar migração/sincronização do banco de dados
run_db_migration() {
  echo "🔄 Executando migração do banco de dados..."
  
  # Usar o comando drizzle para sincronizar o schema
  npm run db:push
  
  echo "✅ Migração do banco de dados concluída!"
}

# Aguardar banco de dados
wait_for_db

# Executar migração
run_db_migration

echo "🎉 Inicialização concluída! Iniciando aplicação..."

# Executar o comando passado como argumentos
exec "$@"