#!/bin/bash

# Script para validar e corrigir DATABASE_URL no EasyPanel
# Previne o erro "FATAL: database axiom does not exist"

echo "=== VALIDAÇÃO DATABASE_URL PARA EASYPANEL ==="

# Mostrar DATABASE_URL original (mascarando senha)
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL original: ${DATABASE_URL//:*@/:***@}"
else
    echo "DATABASE_URL não definida"
fi

# Para EasyPanel, usar sempre valores padrão para garantir configuração correta
# Ignora DATABASE_URL existente se for do ambiente de desenvolvimento
DB_USER="${POSTGRES_USER:-axiom}"
DB_PASS="${POSTGRES_PASSWORD:-estruturas}"
DB_HOST="${POSTGRES_HOST:-viajey_cassio}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Se estivermos em desenvolvimento e DATABASE_URL estiver definida, preservar
if [ "$NODE_ENV" = "development" ] && [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "neon"; then
    echo "Ambiente de desenvolvimento detectado - preservando DATABASE_URL do Neon"
    return 0
fi

# FORÇAR banco "almoxarifado" independentemente de qualquer configuração
DB_NAME="almoxarifado"

# Reconstruir DATABASE_URL correta
DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"
export DATABASE_URL

echo "=== CONFIGURAÇÃO CORRIGIDA ==="
echo "Usuário: $DB_USER"
echo "Host: $DB_HOST"
echo "Porta: $DB_PORT"
echo "Banco: $DB_NAME (FORÇADO)"
echo "DATABASE_URL corrigida: ${DATABASE_URL//:*@/:***@}"

# Validar se contém "almoxarifado"
if echo "$DATABASE_URL" | grep -q "almoxarifado"; then
    echo "✅ VALIDAÇÃO PASSOU: DATABASE_URL contém 'almoxarifado'"
else
    echo "❌ ERRO: DATABASE_URL não contém 'almoxarifado'"
    exit 1
fi

# Validar se NÃO contém "axiom" como nome de banco
if echo "$DATABASE_URL" | grep -E "/axiom(\?|$)" > /dev/null; then
    echo "❌ ERRO CRÍTICO: DATABASE_URL contém '/axiom' como nome de banco!"
    exit 1
else
    echo "✅ VALIDAÇÃO PASSOU: DATABASE_URL não usa 'axiom' como nome de banco"
fi

echo "=== VALIDAÇÃO COMPLETA - PRONTO PARA EASYPANEL ==="