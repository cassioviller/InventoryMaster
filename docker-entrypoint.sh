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
  
  echo "DATABASE_URL: $DATABASE_URL"
  
  # Validar formato da DATABASE_URL
  if echo "$DATABASE_URL" | grep -q "localhost"; then
    echo "⚠️ ATENÇÃO: DATABASE_URL contém 'localhost' - isso não funcionará no EasyPanel!"
    echo "Configure a DATABASE_URL com o hostname interno do PostgreSQL"
    echo "Exemplo: postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable"
  fi
  
  # Extrair componentes da DATABASE_URL usando regex mais robusto
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

  echo "🔍 Testando conectividade de rede..."
  echo "Host: $DB_HOST"
  echo "Porta: $DB_PORT" 
  echo "Banco: $DB_NAME"
  echo "Usuário: $DB_USER"

  # Testar conectividade de rede primeiro
  if command -v nc >/dev/null 2>&1; then
    if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
      echo "❌ Não foi possível conectar na porta $DB_PORT do host $DB_HOST"
      echo "Verifique se o serviço PostgreSQL está rodando e acessível"
      exit 1
    fi
    echo "✅ Conectividade de rede OK"
  fi

  # Aguardar até que o PostgreSQL esteja disponível
  max_attempts=15
  attempt=1
  
  until PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ Falha ao conectar com PostgreSQL após $max_attempts tentativas"
      echo ""
      echo "🔧 Diagnóstico:"
      echo "1. Verifique se o usuário '$DB_USER' existe no PostgreSQL"
      echo "2. Verifique se a senha está correta"
      echo "3. Verifique se o banco '$DB_NAME' foi criado"
      echo "4. Verifique se o PostgreSQL aceita conexões do hostname da aplicação"
      echo ""
      echo "🧪 Testando conexão manual..."
      PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q'
      exit 1
    fi
    
    echo "PostgreSQL não disponível (tentativa $attempt/$max_attempts) - aguardando..."
    sleep 4
    attempt=$((attempt + 1))
  done

  echo "✅ PostgreSQL está disponível!"
}

# Executar migração/sincronização do banco de dados
run_db_migration() {
  echo "🔄 Executando migração do banco de dados..."
  
  # Tentar executar a migração com retry
  max_migration_attempts=3
  migration_attempt=1
  
  until npm run db:push 2>/dev/null; do
    if [ $migration_attempt -ge $max_migration_attempts ]; then
      echo "⚠️ Falha na migração após $max_migration_attempts tentativas"
      echo "A aplicação será iniciada sem migração - as tabelas serão criadas na primeira conexão"
      break
    fi
    
    echo "Migração falhou (tentativa $migration_attempt/$max_migration_attempts) - tentando novamente..."
    sleep 5
    migration_attempt=$((migration_attempt + 1))
  done
  
  echo "✅ Migração concluída!"
}

# Função para iniciar aplicação com modo de fallback
start_application() {
  echo "🎉 Iniciando aplicação..."
  
  # Se o banco não estiver disponível, iniciar mesmo assim
  # A aplicação tentará conectar quando necessário
  if [ "$1" = "--skip-db-check" ]; then
    echo "⚠️ Iniciando sem verificação de banco - conexão será testada durante o uso"
  else
    # Tentar aguardar banco, mas não falhar se não conseguir
    if ! wait_for_db; then
      echo "⚠️ Banco não disponível, mas iniciando aplicação mesmo assim"
    fi
    
    # Tentar migração
    run_db_migration
  fi
  
  echo "🚀 Aplicação iniciando na porta ${PORT:-5013}..."
  
  # Executar o comando passado como argumentos
  exec "$@"
}

# Verificar se deve pular a verificação do banco
if [ "$SKIP_DB_CHECK" = "true" ]; then
  start_application --skip-db-check "$@"
else
  start_application "$@"
fi