FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache postgresql-client curl

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build da aplicação (set NODE_ENV=build to skip database checks)
RUN NODE_ENV=build npm run build

# Criar diretório para uploads
RUN mkdir -p /app/uploads

# Expor porta
EXPOSE 5013

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=5013

# Comando de inicialização
CMD ["npm", "start"]