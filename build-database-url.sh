#!/bin/bash

# Script para construir DATABASE_URL automaticamente no EasyPanel
# Detecta variáveis de ambiente padrão e constrói a URL de conexão

build_database_url() {
    # Se DATABASE_URL já está definida e não é localhost, usar ela
    if [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -q "localhost"; then
        echo "DATABASE_URL já configurada: $DATABASE_URL"
        return 0
    fi

    # Detectar variáveis de ambiente do EasyPanel para PostgreSQL
    # Estas são as variáveis padrão que o EasyPanel cria automaticamente
    
    # Tentar diferentes padrões de nomes de variáveis
    DB_USER=""
    DB_PASS=""
    DB_HOST=""
    DB_PORT="5432"
    DB_NAME=""

    # Padrões comuns de variáveis do EasyPanel
    if [ -n "$POSTGRES_USER" ]; then
        DB_USER="$POSTGRES_USER"
    elif [ -n "$POSTGRESQL_USER" ]; then
        DB_USER="$POSTGRESQL_USER"
    elif [ -n "$DB_USER" ]; then
        DB_USER="$DB_USER"
    fi

    if [ -n "$POSTGRES_PASSWORD" ]; then
        DB_PASS="$POSTGRES_PASSWORD"
    elif [ -n "$POSTGRESQL_PASSWORD" ]; then
        DB_PASS="$POSTGRESQL_PASSWORD"
    elif [ -n "$DB_PASSWORD" ]; then
        DB_PASS="$DB_PASSWORD"
    fi

    if [ -n "$POSTGRES_HOST" ]; then
        DB_HOST="$POSTGRES_HOST"
    elif [ -n "$POSTGRESQL_HOST" ]; then
        DB_HOST="$POSTGRESQL_HOST"
    elif [ -n "$DB_HOST" ]; then
        DB_HOST="$DB_HOST"
    fi

    if [ -n "$POSTGRES_PORT" ]; then
        DB_PORT="$POSTGRES_PORT"
    elif [ -n "$POSTGRESQL_PORT" ]; then
        DB_PORT="$POSTGRESQL_PORT"
    elif [ -n "$DB_PORT" ]; then
        DB_PORT="$DB_PORT"
    fi

    if [ -n "$POSTGRES_DB" ]; then
        DB_NAME="$POSTGRES_DB"
    elif [ -n "$POSTGRESQL_DATABASE" ]; then
        DB_NAME="$POSTGRESQL_DATABASE"
    elif [ -n "$DB_NAME" ]; then
        DB_NAME="$DB_NAME"
    fi

    # Se conseguiu detectar as variáveis, construir a URL
    if [ -n "$DB_USER" ] && [ -n "$DB_PASS" ] && [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
        export DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"
        echo "DATABASE_URL construída automaticamente: $DATABASE_URL"
        return 0
    fi

    # Fallback para o PostgreSQL padrão do viajey
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="postgres://viajey:viajey@viajey_viajey:5432/almoxarifado?sslmode=disable"
        echo "Usando PostgreSQL padrão do viajey: $DATABASE_URL"
        echo "Banco 'almoxarifado' será criado automaticamente se não existir"
    fi
}

# Executar a função
build_database_url