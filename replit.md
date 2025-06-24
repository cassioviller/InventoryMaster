# Sistema de Gerenciamento de Almoxarifado - SaaS

## Visão Geral do Projeto
Sistema completo de gestão de almoxarifado desenvolvido como SaaS multi-tenant com isolamento completo de dados, relatórios financeiros, rastreamento de materiais, gestão de fornecedores e configurado para deploy Docker no EasyPanel.

## Estado Atual
- **Status**: Sistema funcional em desenvolvimento e produção
- **Ambiente de Desenvolvimento**: Replit com PostgreSQL Neon
- **Ambiente de Produção**: EasyPanel com PostgreSQL configurado via DATABASE_URL
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
- ✅ Configuração de banco simplificada e estabilizada

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
- **Produção**: PostgreSQL EasyPanel via DATABASE_URL
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
- **Banco de Produção**: Configurado via variável DATABASE_URL do ambiente

## Mudanças Recentes (24/06/2025)
- Correção de tipos TypeScript nos endpoints da API
- Implementação de tratamento de erros para funcionários
- Adição de endpoints CRUD completos para todas entidades
- Correção de problemas no frontend com arrays undefined
- Melhoramento na validação de dados de entrada

## Sistema Reconstruído (24/06/2025)
- Conexão de banco de dados completamente refeita
- Sistema usa apenas DATABASE_URL do ambiente
- Eliminadas todas as referências problemáticas
- Código limpo e estável para desenvolvimento e produção

## Status Atual  
✅ Sistema completo funcionando em desenvolvimento
✅ Conexão de banco de dados reconstruída e estável
✅ Todas as funcionalidades validadas (CRUD, relatórios, exclusões)
✅ Pronto para produção no EasyPanel

## Sistema Estabilizado (24/06/2025)
- ✅ Código de conexão completamente reescrito
- ✅ Usa apenas DATABASE_URL do ambiente
- ✅ Funciona identicamente em desenvolvimento e produção
- ✅ Zero lógica condicional ou correções automáticas
- ✅ Sistema limpo e mantível