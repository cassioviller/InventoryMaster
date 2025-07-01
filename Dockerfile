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

# Definir variáveis de ambiente com valores padrão
ENV DATABASE_URL=${DATABASE_URL:-postgres://almoxa:almoxa@viajey_almoxa:5432/almoxa?sslmode=disable}
ENV NODE_ENV=${NODE_ENV:-production}
ENV PORT=${PORT:-80}
ENV SESSION_SECRET=${SESSION_SECRET:-almoxarifado-secret-2024}

# Health check para verificar se a aplicação está funcionando
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

# Expor a porta utilizada pelo aplicativo
EXPOSE 80



# Usar o script de entrada para inicialização
ENTRYPOINT ["./docker-entrypoint.sh"]

# Comando para iniciar a aplicação após o script de entrada
CMD ["npm", "run", "start"]