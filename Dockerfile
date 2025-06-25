# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Instalar ferramentas necessárias (inclui postgresql-client para scripts de inicialização)
RUN apt-get update && apt-get install -y postgresql-client wget curl && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante dos arquivos do projeto
COPY . .

# Tornar o script de entrada executável
RUN chmod +x docker-entrypoint.sh

# Executar o build da aplicação
RUN npm run build

# Expor a porta utilizada pelo aplicativo
EXPOSE 5013

# Valores padrão para variáveis de ambiente
ENV NODE_ENV=${NODE_ENV:-production}
ENV PORT=${PORT:-5013}

# Script para construir DATABASE_URL automaticamente
COPY build-database-url.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/build-database-url.sh

# Usar o script de entrada para inicialização
ENTRYPOINT ["./docker-entrypoint.sh"]

# O comando start está integrado no entrypoint
CMD []