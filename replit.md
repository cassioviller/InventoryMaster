# Sistema de Gerenciamento de Almoxarifado - SaaS

## Visão Geral do Projeto
Sistema completo de gestão de almoxarifado desenvolvido como SaaS multi-tenant com isolamento completo de dados, relatórios financeiros, rastreamento de materiais, gestão de fornecedores e configurado para deploy Docker no EasyPanel.

## Estado Atual
- **Status**: Sistema funcional em desenvolvimento e produção
- **Ambiente de Desenvolvimento**: Replit com PostgreSQL Neon
- **Ambiente de Produção**: EasyPanel com PostgreSQL (banco: almox1, usuário: almox2, host: viajey_almox)
- **Autenticação**: JWT implementado e funcionando
- **Banco de Dados**: Sistema de compatibilidade PostgreSQL implementado

## Problemas Recentes Resolvidos
- ✅ Conectividade PostgreSQL entre Replit e EasyPanel
- ✅ Incompatibilidades de schema (created_at vs createdAt)
- ✅ Preservação de dados durante migrações
- ✅ Autenticação JWT e gerenciamento de usuários
- ✅ Correção de tipos TypeScript nos endpoints
- ✅ Implementação completa de CRUD para todas entidades

## Problemas Resolvidos (24/06/2025)
- ✅ Endpoint de funcionários corrigido e funcionando
- ✅ Frontend corrigido - erro "employees?.map" resolvido
- ✅ Funcionalidades de exclusão implementadas para todas entidades
- ✅ Endpoints de relatórios implementados e funcionando
- ✅ Relatório financeiro corrigido com validação JSON
- ✅ Correções de deploy - TypeError d.map resolvidas
- ✅ Sistema de autenticação padronizado (token)
- ✅ Error handling melhorado para compatibilidade de deploy
- ✅ Validação de arrays em todas as páginas implementada
- ✅ Configuração de banco corrigida (almox1 em vez de almox2)

## Arquitetura do Projeto

### Backend (Express + TypeScript)
- **Autenticação**: JWT com middleware personalizado
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Storage**: Interface DatabaseStorage implementada
- **API**: RESTful com validação Zod
- **Compatibilidade**: Sistema automático de migração de schema

### Frontend (React + TypeScript)
- **Roteamento**: Wouter
- **Estado**: TanStack Query para cache
- **UI**: Shadcn/ui + Tailwind CSS
- **Formulários**: React Hook Form + Zod
- **Autenticação**: Context provider com JWT

### Banco de Dados
- **Desenvolvimento**: PostgreSQL Neon via DATABASE_URL
- **Produção**: PostgreSQL EasyPanel (almox1/almox2)
- **Schema**: Multi-tenant com isolamento por ownerId
- **Migrações**: Sistema automático de compatibilidade

## Entidades Principais
1. **Users**: Gerenciamento de usuários com roles
2. **Categories**: Categorização de materiais
3. **Materials**: Inventário de materiais
4. **Employees**: Gestão de funcionários
5. **Suppliers**: Fornecedores
6. **ThirdParties**: Terceiros
7. **MaterialMovements**: Movimentações de estoque
8. **AuditLogs**: Logs de auditoria

## Deploy e Infraestrutura
- **Plataforma**: EasyPanel com Docker
- **Build**: Script automatizado (easypanel-build.sh)
- **Banco**: PostgreSQL com preservação de dados
- **Domínio**: Configurável via EasyPanel

## Preferências do Usuário
- **Linguagem**: Português brasileiro
- **Preservação de Dados**: Crítica - nunca perder dados existentes
- **Ambiente**: Desenvolvimento no Replit, produção no EasyPanel
- **Banco de Produção**: DATABASE_URL correta é postgres://almox2:almox3@viajey_almox:5432/almox1

## Mudanças Recentes (24/06/2025)
- Correção de tipos TypeScript nos endpoints da API
- Implementação de tratamento de erros para funcionários
- Adição de endpoints CRUD completos para todas entidades
- Correção de problemas no frontend com arrays undefined
- Melhoramento na validação de dados de entrada

## Configuração de Deploy Corrigida (24/06/2025)
- DATABASE_URL correta: postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable
- Problema identificado: sistema tentava conectar em "almox2" em vez de "almox1"
- Arquivo EASYPANEL-CONFIG.txt criado com configurações corretas
- Sistema pronto para deploy com todas as funcionalidades operacionais

## Status Atual  
✅ Sistema completo funcionando em desenvolvimento
🔧 CORREÇÃO APLICADA: Sistema automaticamente corrige DATABASE_URL de almox2 para almox1
✅ Todas as funcionalidades validadas (CRUD, relatórios, exclusões)
✅ Pronto para produção no EasyPanel com correção automática de banco

## Problema Identificado e Corrigido
- Sistema tentava conectar em banco "almox2" (não existe)
- Adicionada correção automática para banco "almox1" (existe)
- Correção aplicada em todos os arquivos de conexão (db.ts, db-compatibility.ts, db-simple.ts)