#!/bin/bash

echo "🚀 EXECUTANDO CORREÇÃO DE PRODUÇÃO - ALMOXARIFADO"
echo "=================================================="
echo ""

# Verificar se estamos em produção
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  ATENÇÃO: Este script deve ser executado em produção"
    echo "NODE_ENV atual: $NODE_ENV"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🔧 Executando correção do schema de produção..."
node fix-production-schema.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORREÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "1. Reinicie a aplicação se necessário"
    echo "2. Teste login: estruturas/1234 ou cassio/1234"
    echo "3. Acesse /cost-centers para verificar"
    echo "4. Teste entradas e saídas de material"
    echo ""
    echo "💾 DADOS INCLUÍDOS:"
    echo "- Centros de custo: MANUT001, PROD001, ADM001"
    echo "- Schema atualizado para snake_case"
    echo "- Foreign keys configuradas"
    echo ""
    echo "🎉 PRODUÇÃO SINCRONIZADA COM DESENVOLVIMENTO!"
else
    echo ""
    echo "❌ ERRO NA CORREÇÃO"
    echo ""
    echo "🔧 SOLUÇÕES ALTERNATIVAS:"
    echo "1. Verifique se DATABASE_URL está correta"
    echo "2. Execute manualmente: psql < production-migration.sql"
    echo "3. Verifique conectividade PostgreSQL"
    echo ""
    exit 1
fi