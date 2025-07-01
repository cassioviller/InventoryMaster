#!/bin/bash
set -e

echo ">>> Iniciando script de entrada do Sistema de Almoxarifado <<<"

# 1. Validar Variáveis de Ambiente Essenciais
: "${DATABASE_URL:?Variável DATABASE_URL não está configurada. Verifique as variáveis secretas do EasyPanel.}"
: "${NODE_ENV:?Variável NODE_ENV não está configurada}"
: "${PORT:?Variável PORT não está configurada}"

echo "🔧 Configurando conexão PostgreSQL..."

# 2. Desdefinir variáveis PG* para evitar conflitos com DATABASE_URL
# CRÍTICO: O EasyPanel pode injetar variáveis PG* que conflitam com DATABASE_URL
unset PGDATABASE
unset PGUSER  
unset PGPASSWORD
unset PGHOST
unset PGPORT
unset POSTGRES_DB
unset POSTGRES_USER
unset POSTGRES_PASSWORD
unset POSTGRES_HOST
unset POSTGRES_PORT

echo "🔧 Variáveis PG* removidas para evitar conflitos"

# 3. Extrair componentes da DATABASE_URL para pg_isready
PGHOST=$(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):.*/\1/' 2>/dev/null || echo "localhost")
PGPORT=$(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+).*/\1/' 2>/dev/null || echo "5432")
PGUSER=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/([^:]+):.*/\1/' 2>/dev/null || echo "postgres")

echo "🔧 Parâmetros extraídos - Host: $PGHOST, Port: $PGPORT, User: $PGUSER"

# 4. Aguardar o Banco de Dados Estar Pronto
echo "Aguardando inicialização do PostgreSQL..."
MAX_ATTEMPTS=30
ATTEMPTS=0

check_db_connection() {
  pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1
  return $?
}

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if check_db_connection; then
    echo "✅ PostgreSQL está pronto!"
    break
  fi
  ATTEMPTS=$((ATTEMPTS+1))
  echo "PostgreSQL não está pronto ainda - tentativa $ATTEMPTS de $MAX_ATTEMPTS - esperando..."
  sleep 2
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "❌ Não foi possível conectar ao PostgreSQL após $MAX_ATTEMPTS tentativas"
  echo "Verifique a conexão e a DATABASE_URL"
  exit 1
fi

echo "✅ Banco de dados conectado com sucesso!"

# 5. Executar Migrações e Correções do Schema
echo "🔧 Verificando se as tabelas do banco de dados existem..."

# Verificar se as tabelas principais existem
if psql "$DATABASE_URL" -c "SELECT to_regclass('public.users');" | grep -q "users"; then
  echo "✅ Tabela 'users' já existe"
  
  # Verificar especificamente se cost_centers existe (funcionalidade crítica)
  if psql "$DATABASE_URL" -c "SELECT to_regclass('public.cost_centers');" | grep -q "cost_centers"; then
    echo "✅ Tabela 'cost_centers' já existe"
  else
    echo "⚠️  Tabela 'cost_centers' não existe - executando correção do schema..."
    # Executar script de correção do schema de produção
    if [ -f "fix-production-schema.js" ]; then
      echo "🔧 Executando fix-production-schema.js..."
      NODE_ENV=production node fix-production-schema.js
    else
      echo "❌ Script fix-production-schema.js não encontrado - executando migração padrão"
      NODE_ENV=production npm run db:push
    fi
  fi
  
  # Verificar se material_movements tem cost_center_id (correção snake_case)
  if psql "$DATABASE_URL" -c "\d material_movements" | grep -q "cost_center_id"; then
    echo "✅ Coluna 'cost_center_id' já existe em material_movements"
  else
    echo "⚠️  Coluna 'cost_center_id' não existe - executando correção do schema..."
    if [ -f "fix-production-schema.js" ]; then
      echo "🔧 Executando fix-production-schema.js para correções de schema..."
      NODE_ENV=production node fix-production-schema.js
    fi
  fi
  
else
  echo "⚠️  Tabela 'users' não existe. Executando migração inicial..."
  NODE_ENV=production npm run db:push
  
  # Após migração inicial, executar correção do schema para garantir compatibilidade
  echo "🔧 Executando correção do schema após migração inicial..."
  if [ -f "fix-production-schema.js" ]; then
    echo "🔧 Aplicando correções específicas do schema de produção..."
    NODE_ENV=production node fix-production-schema.js
  fi
fi

echo ">>> Configuração do banco de dados concluída <<<"

# 6. Criar usuários padrão se em produção e não existirem
if [ "$NODE_ENV" = "production" ]; then
  echo "🔧 Verificando usuários padrão em produção..."
  # Verificar se usuário cassio existe
  if psql "$DATABASE_URL" -c "SELECT username FROM users WHERE username='cassio';" | grep -q "cassio"; then
    echo "✅ Usuário cassio já existe"
  else
    echo "🔧 Criando usuários padrão..."
    if [ -f "create-default-users.js" ]; then
      NODE_ENV=production node create-default-users.js
    fi
  fi
fi

# 7. Validação Final do Schema
echo "🔧 Validação final do schema..."
SCHEMA_OK=true

# Verificar tabelas críticas
for table in users categories materials employees suppliers third_parties material_movements cost_centers audit_logs; do
  if ! psql "$DATABASE_URL" -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
    echo "❌ Tabela '$table' não encontrada"
    SCHEMA_OK=false
  fi
done

# Verificar colunas críticas
if ! psql "$DATABASE_URL" -c "\d material_movements" | grep -q "cost_center_id"; then
  echo "❌ Coluna 'cost_center_id' não encontrada em material_movements"
  SCHEMA_OK=false
fi

if [ "$SCHEMA_OK" = "true" ]; then
  echo "✅ Schema validado com sucesso!"
else
  echo "❌ Schema incompleto - pode haver problemas de funcionamento"
fi

# 8. Iniciar a Aplicação
echo "🚀 Iniciando aplicação na porta $PORT..."
echo "✅ Sistema inicializado"

# O 'exec "$@"' garante que o comando CMD do Dockerfile seja executado
exec "$@"