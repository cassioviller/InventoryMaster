#!/bin/bash
set -e

echo "🚀 Iniciando Sistema de Gerenciamento de Almoxarifado..."

# Função para aguardar o banco de dados estar disponível
wait_for_db() {
  echo "⏳ Aguardando banco de dados estar disponível..."
  
  # Verificar se DATABASE_URL está definida
  if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está definida!"
    exit 1
  fi
  
  # Extrair componentes da DATABASE_URL usando regex mais robusto
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

  echo "Conectando em: $DB_HOST:$DB_PORT -> $DB_NAME (usuário: $DB_USER)"

  # Aguardar até que o PostgreSQL esteja disponível
  max_attempts=30
  attempt=1
  
  until PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ Falha ao conectar com PostgreSQL após $max_attempts tentativas"
      echo "Verificar se o banco de dados está funcionando e as credenciais estão corretas"
      exit 1
    fi
    
    echo "PostgreSQL não disponível (tentativa $attempt/$max_attempts) - aguardando..."
    sleep 3
    attempt=$((attempt + 1))
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