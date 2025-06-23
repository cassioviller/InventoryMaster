#!/bin/bash
set -e

echo "=== EasyPanel Build Script - Sistema de Almoxarifado ==="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "Erro: package.json não encontrado"
  exit 1
fi

# Mostrar informações do ambiente
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# Instalar TODAS as dependências (incluindo devDependencies para o build)
echo "=== Instalando dependências completas ==="
npm ci --include=dev

# Verificar se o Vite está disponível
echo "=== Verificando Vite ==="
if ! npx vite --version > /dev/null 2>&1; then
  echo "Instalando Vite globalmente..."
  npm install -g vite
fi

# Executar build de produção
echo "=== Executando build de produção ==="
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
  echo "ERRO: Diretório dist não foi criado"
  exit 1
fi

# Criar diretórios necessários
echo "=== Preparando estrutura de diretórios ==="
mkdir -p uploads

# Mostrar arquivos gerados
echo "=== Arquivos de build gerados ==="
ls -la dist/ || echo "Diretório dist vazio"

echo "=== Build EasyPanel concluído com sucesso ==="