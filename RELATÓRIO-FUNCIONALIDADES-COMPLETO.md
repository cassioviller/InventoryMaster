# RELATÓRIO COMPLETO DE FUNCIONALIDADES - SISTEMA DE GERENCIAMENTO DE ALMOXARIFADO

## VISÃO GERAL DO SISTEMA
Sistema web completo de gerenciamento de almoxarifado desenvolvido como SaaS multi-tenant com autenticação, controle de estoque, relatórios financeiros e gestão de fornecedores.

## ARQUITETURA TÉCNICA

### Backend (Node.js + Express + TypeScript)
- **Framework**: Express.js com TypeScript
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: JWT (JSON Web Tokens)
- **API**: RESTful com validação Zod
- **ORM**: Drizzle com migrations automáticas
- **Storage**: Interface DatabaseStorage para PostgreSQL

### Frontend (React + TypeScript)
- **Framework**: React 18 com TypeScript
- **Roteamento**: Wouter (roteador leve)
- **Estado Global**: TanStack Query (React Query) para cache
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Formulários**: React Hook Form + Zod validation
- **Autenticação**: Context provider com JWT

### Banco de Dados
- **SGBD**: PostgreSQL
- **Schema**: Multi-tenant com isolamento por ownerId
- **Migrações**: Automáticas via Drizzle

## ENTIDADES DO SISTEMA

### 1. USUÁRIOS (users)
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(100) UNIQUE  
- password: TEXT (hash bcrypt)
- name: VARCHAR(200)
- role: TEXT (user, admin, super_admin)
- isActive: BOOLEAN
- ownerId: INTEGER (multi-tenant)
- createdAt: TIMESTAMP
```

### 2. CATEGORIAS (categories)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100)
- description: TEXT
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 3. MATERIAIS (materials)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(200)
- category_id: INTEGER (FK categories)
- current_stock: INTEGER
- minimum_stock: INTEGER
- unit: VARCHAR(20) (unidade, kg, metros, etc.)
- unit_price: DECIMAL(10,2)
- description: TEXT
- last_supplier_id: INTEGER (FK suppliers)
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 4. FUNCIONÁRIOS (employees)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(200)
- department: VARCHAR(100)
- email: VARCHAR(100)
- phone: VARCHAR(20)
- isActive: BOOLEAN
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 5. FORNECEDORES (suppliers)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(200)
- cnpj: VARCHAR(18)
- email: VARCHAR(100)
- phone: VARCHAR(20)
- address: TEXT
- notes: TEXT
- is_active: BOOLEAN
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 6. TERCEIROS (third_parties)
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(200)
- document: VARCHAR(20)
- document_type: VARCHAR(10) (CPF/CNPJ)
- email: VARCHAR(100)
- phone: VARCHAR(20)
- address: TEXT
- is_active: BOOLEAN
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 7. MOVIMENTAÇÕES (material_movements)
```sql
- id: SERIAL PRIMARY KEY
- type: ENUM (entry, exit)
- date: TIMESTAMP
- user_id: INTEGER (FK users)
- origin_type: ENUM (supplier, employee_return, third_party_return)
- destination_type: ENUM (employee, third_party)
- supplier_id: INTEGER (FK suppliers)
- employee_id: INTEGER (FK employees)
- third_party_id: INTEGER (FK third_parties)
- items: JSONB (array de itens)
- description: TEXT
- total_value: DECIMAL(12,2)
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

### 8. LOGS DE AUDITORIA (audit_logs)
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK users)
- action: VARCHAR(100)
- table_name: VARCHAR(50)
- record_id: INTEGER
- old_values: JSONB
- new_values: JSONB
- owner_id: INTEGER (multi-tenant)
- created_at: TIMESTAMP
```

## FUNCIONALIDADES PRINCIPAIS

### 1. AUTENTICAÇÃO E AUTORIZAÇÃO
- **Login/Logout**: Sistema JWT com tokens seguros
- **Níveis de Acesso**: user, admin, super_admin
- **Proteção de Rotas**: Middleware de autenticação
- **Sessão Persistente**: Token armazenado localmente

### 2. GESTÃO DE MATERIAIS
- **CRUD Completo**: Criar, listar, editar, excluir materiais
- **Categorização**: Organização por categorias
- **Controle de Estoque**: Estoque atual vs. estoque mínimo
- **Unidades de Medida**: kg, metros, unidades, litros, etc.
- **Preços**: Controle de preço unitário
- **Fornecedor**: Associação com último fornecedor

### 3. MOVIMENTAÇÕES DE ESTOQUE
- **Tipos de Movimento**:
  - Entrada: Compras, devoluções
  - Saída: Vendas, transferências, uso interno
  - Ajuste: Correções de inventário
- **Rastreabilidade**: Quem, quando, quanto, por que
- **Cálculos Automáticos**: Atualização automática do estoque
- **Histórico Completo**: Todas as movimentações registradas

### 4. GESTÃO DE FORNECEDORES
- **Cadastro Completo**: Nome, CNPJ, contato, email, telefone, endereço
- **Status**: Ativo/Inativo
- **Histórico**: Materiais fornecidos
- **Relatórios**: Análise por fornecedor

### 5. GESTÃO DE FUNCIONÁRIOS
- **Cadastro**: Nome, departamento, contatos
- **Controle de Acesso**: Funcionários vs. usuários do sistema
- **Rastreamento**: Quais movimentações cada funcionário realizou
- **Departamentos**: Organização por setor

### 6. GESTÃO DE TERCEIROS
- **Empresas Externas**: Prestadores de serviço, parceiros
- **Contratos**: Movimentações envolvendo terceiros
- **Documentação**: CPF/CNPJ, endereço e contatos completos

### 7. RELATÓRIOS E DASHBOARD
- **Dashboard Principal**: Visão geral do sistema
- **Relatório Financeiro**: 
  - Total de entradas/saídas
  - Valor do estoque atual
  - Análise por período
- **Relatório de Estoque**:
  - Materiais em estoque baixo
  - Valor total do inventário
  - Análise por categoria
- **Relatórios de Movimento**:
  - Histórico completo
  - Filtros por período, tipo, material
- **Exportação**: PDF e Excel

### 8. MULTI-TENANCY
- **Isolamento de Dados**: Cada empresa (ownerId) vê apenas seus dados
- **Segurança**: Queries automáticas com filtro de ownerId
- **Escalabilidade**: Suporte a múltiplas empresas

## API ENDPOINTS PRINCIPAIS

### Autenticação
- `POST /api/auth/login` - Login com usuário/senha
- `POST /api/auth/logout` - Logout 
- `GET /api/auth/me` - Dados do usuário autenticado

### Materiais
- `GET /api/materials` - Listar materiais
- `POST /api/materials` - Criar material
- `PUT /api/materials/:id` - Atualizar material
- `DELETE /api/materials/:id` - Excluir material
- `GET /api/materials/:id` - Detalhes do material

### Movimentações
- `GET /api/movements` - Listar movimentações
- `POST /api/movements` - Criar movimentação
- `GET /api/movements/material/:id` - Movimentações por material

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Excluir categoria

### Fornecedores
- `GET /api/suppliers` - Listar fornecedores
- `POST /api/suppliers` - Criar fornecedor
- `PUT /api/suppliers/:id` - Atualizar fornecedor
- `DELETE /api/suppliers/:id` - Excluir fornecedor

### Funcionários
- `GET /api/employees` - Listar funcionários
- `POST /api/employees` - Criar funcionário
- `PUT /api/employees/:id` - Atualizar funcionário
- `DELETE /api/employees/:id` - Excluir funcionário

### Terceiros
- `GET /api/third-parties` - Listar terceiros
- `POST /api/third-parties` - Criar terceiro
- `PUT /api/third-parties/:id` - Atualizar terceiro
- `DELETE /api/third-parties/:id` - Excluir terceiro

### Relatórios
- `GET /api/reports/financial` - Relatório financeiro
- `GET /api/reports/inventory` - Relatório de estoque
- `GET /api/reports/movements` - Relatório de movimentações
- `GET /api/reports/dashboard` - Dados do dashboard

## RECURSOS TÉCNICOS AVANÇADOS

### 1. VALIDAÇÃO DE DADOS
- **Frontend**: React Hook Form + Zod schemas
- **Backend**: Validação Zod em todas as rotas
- **Tipos TypeScript**: Sincronização entre frontend/backend

### 2. CACHE E PERFORMANCE
- **TanStack Query**: Cache inteligente de dados
- **Invalidação**: Cache atualizado após mutações
- **Loading States**: Estados de carregamento em todas as telas

### 3. UI/UX PROFISSIONAL
- **Design System**: Shadcn/ui components
- **Responsivo**: Layout adaptativo para mobile/desktop
- **Dark Mode**: Suporte a tema escuro
- **Animations**: Transições suaves com Framer Motion

### 4. EXPORTAÇÃO DE DADOS
- **PDF**: Relatórios em PDF com jsPDF
- **Excel**: Exportação para planilhas com XLSX
- **Impressão**: Layouts otimizados para impressão

### 5. AUDITORIA COMPLETA
- **Logs Automáticos**: Todas as ações registradas
- **Histórico**: Valores antigos vs. novos
- **Rastreabilidade**: Quem fez o que e quando

## TELAS DO SISTEMA

### 1. AUTENTICAÇÃO
- **Login**: Usuário/senha com validação
- **Dashboard**: Página inicial após login

### 2. MATERIAIS
- **Lista de Materiais**: Tabela com busca e filtros
- **Cadastro/Edição**: Formulário completo de material
- **Visualização**: Detalhes do material e histórico

### 3. MOVIMENTAÇÕES
- **Nova Movimentação**: Entrada/Saída com validações
- **Histórico**: Lista de todas as movimentações
- **Relatórios**: Análise de movimentações

### 4. CADASTROS
- **Categorias**: CRUD de categorias
- **Fornecedores**: Gestão completa de fornecedores
- **Funcionários**: Cadastro de funcionários
- **Terceiros**: Gestão de empresas terceiras

### 5. RELATÓRIOS
- **Dashboard**: Métricas principais
- **Relatório Financeiro**: Análise financeira
- **Estoque**: Status do inventário
- **Movimentações**: Histórico detalhado

## CONFIGURAÇÃO DE DEPLOY

### 1. DESENVOLVIMENTO
- **Ambiente**: Replit com PostgreSQL Neon
- **Hot Reload**: Desenvolvimento com tsx
- **Debug**: Logs detalhados

### 2. PRODUÇÃO
- **Platform**: EasyPanel com Docker
- **Database**: PostgreSQL dedicado
- **Build**: Vite + esbuild otimizado
- **Monitoring**: Logs de aplicação

### 3. VARIÁVEIS DE AMBIENTE
```
NODE_ENV=production
PORT=5013
DATABASE_URL=postgres://cassio:123@viajey_almo:5432/axiom?sslmode=disable
SESSION_SECRET=almoxarifado-secret-2024
```

## CREDENCIAIS PADRÃO
- **Usuário Admin**: cassio / senha: 1234
- **Usuário Teste**: empresa_teste / senha: 1234

## SCRIPTS PRINCIPAIS
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "node dist/index.js",
  "db:push": "drizzle-kit push"
}
```

## DEPENDÊNCIAS PRINCIPAIS

### Backend Core
```json
{
  "express": "^4.19.2",
  "drizzle-orm": "^0.36.4",
  "pg": "^8.13.1",
  "@neondatabase/serverless": "^0.10.4",
  "bcrypt": "^6.0.0",
  "jsonwebtoken": "^9.0.9",
  "zod": "^3.23.8"
}
```

### Frontend Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "wouter": "^3.3.5",
  "@tanstack/react-query": "^5.60.5",
  "react-hook-form": "^7.53.2",
  "@hookform/resolvers": "^3.10.0"
}
```

### UI Components (Shadcn/ui + Radix)
```json
{
  "@radix-ui/react-dialog": "^1.1.7",
  "@radix-ui/react-dropdown-menu": "^2.1.7",
  "@radix-ui/react-select": "^2.1.7",
  "@radix-ui/react-toast": "^1.2.7",
  "@radix-ui/react-tabs": "^1.1.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4",
  "tailwindcss": "^3.4.1"
}
```

### Styling
```json
{
  "tailwindcss": "^3.4.1",
  "tailwindcss-animate": "^1.0.7",
  "@tailwindcss/typography": "^0.5.15",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.49"
}
```

### Development Tools
```json
{
  "typescript": "^5.7.3",
  "tsx": "^4.19.2",
  "vite": "^5.4.14",
  "@vitejs/plugin-react": "^4.3.4",
  "drizzle-kit": "^0.29.1",
  "esbuild": "^0.24.2"
}
```

### Utilities
```json
{
  "lucide-react": "^0.468.0",
  "date-fns": "^4.1.0",
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4",
  "xlsx": "^0.18.5"
}
```

## ESTRUTURA DE ARQUIVOS PRINCIPAL

```
projeto/
├── client/src/
│   ├── components/
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── auth/         # Autenticação
│   │   └── layout/       # Header, Navigation
│   ├── pages/            # Páginas principais
│   ├── hooks/            # Custom hooks
│   └── lib/              # QueryClient, utils
├── server/
│   ├── routes.ts         # API routes
│   ├── db-production-only.ts  # Database connection
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Express server
├── shared/
│   └── schema.ts         # Drizzle schema + Zod validation
├── Dockerfile            # Container configuration
├── docker-entrypoint.sh  # Entry script
└── package.json          # Dependencies
```

## CONFIGURAÇÃO STEP-BY-STEP PARA REPLICAÇÃO

### 1. Inicialização do Projeto
```bash
npm init -y
npm install [dependências acima]
```

### 2. Configuração TypeScript
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### 3. Vite Configuration
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  root: 'client',
  build: {
    outDir: '../dist/client',
  },
})
```

### 4. Drizzle Configuration
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 5. Tailwind CSS
```javascript
module.exports = {
  content: ['./client/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'neutral-bg': '#f8fafc',
        'primary': '#3b82f6',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

Este relatório fornece uma visão completa do sistema para replicação em outro ambiente.