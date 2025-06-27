#!/bin/bash
set -e

# Verificar se a URL está correta (deve conter almoxarifado)
if ! echo "$DATABASE_URL" | grep -q "almoxarifado:1234@viajey_cassio"; then
  echo "❌ ERRO: DATABASE_URL incorreta ou fallback ativado!"
  echo "URL atual: ${DATABASE_URL//:*@/:***@}"
  echo "Esperado: postgres://almoxarifado:1234@viajey_cassio:5432/almoxarifado"
  exit 1
fi

echo "✅ DATABASE_URL correta detectada"

# Aguardar PostgreSQL
MAX=30
i=0
until pg_isready -d "$DATABASE_URL" > /dev/null 2>&1 || [ $i -ge $MAX ]; do
  echo "Aguardando Postgres… ($i/$MAX)"
  sleep 2
  i=$((i+1))
done

if [ $i -ge $MAX ]; then
  echo "Falha ao conectar ao Postgres"
  exit 1
fi

echo "Postgres pronto!"

# Executar migrações
npm run db:push

# Iniciar aplicação
exec "$@"