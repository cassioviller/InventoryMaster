#!/bin/bash
set -e

echo "=== Iniciando script de build personalizado para EasyPanel ==="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "Erro: package.json não encontrado, verifique o diretório de trabalho"
  exit 1
fi

# Exibir informações do ambiente
echo "Node.js $(node --version)"
echo "npm $(npm --version)"

# Instalar todas as dependências incluindo as de desenvolvimento
echo "=== Instalando dependências ==="
npm ci

# Verificar se a instalação foi bem-sucedida
if [ $? -ne 0 ]; then
  echo "Erro durante a instalação de dependências"
  exit 1
fi

# Verificar disponibilidade do vite
echo "=== Verificando instalação do vite ==="
if ! npx vite --version; then
  echo "Vite não encontrado! Instalando globalmente..."
  npm install -g vite
fi

# Gerar build de produção
echo "=== Gerando build de produção ==="
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
  echo "Erro durante o build"
  exit 1
fi

# Preparar estrutura de diretórios
echo "=== Preparando diretórios ==="
mkdir -p uploads

# Verificar se o diretório dist existe
if [ ! -d "dist" ]; then
  echo "Erro: diretório dist não foi criado durante o build"
  exit 1
fi

# Listar arquivos gerados
echo "=== Arquivos gerados no build ==="
ls -la dist/

echo "=== Build concluído com sucesso! ==="