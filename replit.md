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

## Mudanças Recentes (25/06/2025)
- Problema SIGTERM no EasyPanel resolvido com comando npm start integrado no entrypoint
- Advertências UndefinedVar eliminadas com export correto de variáveis
- Sistema de autenticação validado e funcionando (login 200 OK)
- Dockerfile otimizado com syntax moderna
- Credenciais de teste confirmadas: cassio/1234 e empresa_teste/1234

## Mudanças Anteriores (24/06/2025)
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

## Status Atual (01/07/2025 - 10:30)
**SISTEMA COMPLETAMENTE FUNCIONAL E CORRIGIDO COM CENTRO DE CUSTOS IMPLEMENTADO**:
- ✅ Schema do banco de dados alinhado entre desenvolvimento e produção (snake_case)
- ✅ Usuário cassio configurado como super_admin no banco
- ✅ Autenticação JWT funcionando perfeitamente (login 200 OK com token válido)
- ✅ Criação de materiais e categorias corrigida e funcionando
- ✅ Relatório financeiro corrigido - valores calculados corretamente (não mais NaN)
- ✅ Logs de debug implementados para identificação rápida de problemas
- ✅ Sistema de validação melhorado com tratamento de erros detalhado
- ✅ Configuração de produção ajustada com postgres-js estável
- ✅ Dashboard e todos os endpoints funcionando com dados reais
- ✅ Valores financeiros calculados em JavaScript com precisão
- ✅ Sistema de relatórios completamente funcional (financeiro, funcionários, movimentações)
- ✅ Correção do apiRequest para validação de métodos HTTP
- ✅ Sistema de criação de usuários corrigido (getUserByEmail e createAuditLog implementados)
- ✅ **Interface Super Admin isolada** - cassio vê APENAS Painel Super Admin (sem dashboard/materiais)
- ✅ Navegação adaptativa - super_admin tem interface completamente separada
- ✅ Redirecionamento automático - super_admin vai direto para /super-admin
- ✅ Funcionalidade de criação de usuários corrigida (hash de senha implementado)
- ✅ Sistema de login funcionando para todos os usuários criados
- ✅ Sistema de usuários COMPLETAMENTE FUNCIONAL
- ✅ Usuário teste3/teste3 criado e populado com dados completos
- ✅ CRUD completo de usuários implementado no super admin:
  - Criar usuários com hash de senha automático
  - Editar usuários (username, role, senha opcional) com botões
  - Excluir usuários (proteção para super_admin) com botões
  - Listagem em tabela com ações funcionais
- ✅ Sistema COMPLETAMENTE POPULADO com dados realistas:
  - 3 fornecedores com dados completos
  - 3 terceiros cadastrados
  - 4 funcionários de diferentes departamentos
  - 5 categorias (Ferramentas, Elétricos, Segurança, Construção, Informática)
  - 7 materiais com estoque e preços variados
  - Entradas de estoque de fornecedores
  - Saídas para funcionários e terceiros
- ✅ Dashboard e relatórios funcionando com dados reais
- ✅ **SISTEMA DE CENTRO DE CUSTOS COMPLETO IMPLEMENTADO (01/07/2025 - 10:30):**
  - **Cadastro completo de centros de custo** com todos os campos especificados:
    * Código único alfanumérico (ex: MANUT001, PROD001, ADM001)
    * Nome descritivo e descrição detalhada
    * Departamento e responsável
    * Orçamento mensal e anual
    * Status ativo/inativo
  - **Interface de gestão completa**:
    * Página dedicada `/cost-centers` no menu "Centros de Custo"
    * Formulário de criação/edição com validações
    * Listagem com filtros avançados (departamento, status, busca)
    * Ações de CRUD completas (criar, editar, ativar/desativar, visualizar)
  - **Integração com movimentações**:
    * Campo costCenterId opcional para entradas
    * Campo costCenterId obrigatório para saídas
    * Rastreamento de centro de custo em todas as movimentações
    * Cálculo automático de valores por centro
  - **Relatórios financeiros por centro**:
    * Página `/cost-center-reports` com filtros específicos
    * Totalizadores automáticos (entradas, saídas, saldo líquido)
    * Agrupamento por centro de custo
    * Informações de valor unitário e total nas movimentações
  - **API completa implementada**:
    * GET /api/cost-centers - listar centros
    * POST /api/cost-centers - criar centro
    * PUT /api/cost-centers/:id - atualizar centro
    * DELETE /api/cost-centers/:id - remover centro
    * Validações e error handling completos
  - **Dados de exemplo criados**:
    * MANUT001 - Manutenção Predial (R$ 5.000 mensal)
    * PROD001 - Produção Linha A (R$ 15.000 mensal)
    * ADM001 - Administração Geral (R$ 8.000 mensal)
  - **Funcionalidades avançadas**:
    * Busca inteligente por código, nome, departamento
    * Ordenação e paginação
    * Indicadores visuais de status
    * Validação de código único
    * Controle de orçamento (alertas visuais)

- ✅ **CORREÇÕES CRÍTICAS ANTERIORES (30/06/2025 - 14:15):**
  - **CRUD de usuários no Super Admin** - TOTALMENTE FUNCIONAL:
    * Botões Editar e Excluir operacionais na tabela
    * Dialogs de confirmação implementados
    * Proteção contra exclusão de super_admin ativa
    * Endpoint DELETE /api/users/:id testado e funcionando (Status 204)
    * Método deleteUser() corrigido no storage com try-catch
  - **Botão "Confirmar Entrada"** - COMPLETAMENTE CORRIGIDO E TESTADO:
    * Campo 'date' adicionado ao método createEntry()
    * Sistema de entradas funcionando perfeitamente (Status 201)
    * Teste API confirmado: entrada criada com sucesso
    * Validações e error handling implementados
  - **Botão "Confirmar Saída"** - COMPLETAMENTE CORRIGIDO E TESTADO:
    * Campo 'date' adicionado ao método createExit()
    * Sistema de saídas funcionando perfeitamente (Status 201)
    * Teste API confirmado: saída criada com sucesso
    * Estoque atualizado automaticamente
  - **Relatório financeiro** - CÁLCULOS CORRETOS:
    * Valores calculados em JavaScript com precisão
    * Eliminado problema "R$ NaN" completamente
    * Separação de materiais por preço funcionando

### Problemas Resolvidos Hoje:
- ✅ Criação de categorias e materiais (400 errors corrigidos)
- ✅ Relatório financeiro mostrando NaN (agora calcula valores corretamente)
- ✅ Logs de debug implementados para monitoramento
- ✅ Error handling melhorado em todos os endpoints
- ✅ Sistema de compatibilidade automática criado para produção
- ✅ Migração automática camelCase → snake_case para ambiente de produção
- ✅ Conexão unificada entre desenvolvimento (Neon) e produção (EasyPanel)

## Status Anterior (27/06/2025)
**CONFIGURAÇÃO DEFINITIVA IMPLEMENTADA - BASEADA NO PROJETO DE COMISSÕES**:
- Replicada configuração exata que funcionou no projeto de comissões
- `.env` com DATABASE_URL atualizado (estruturas:1234@viajey_cassio:5432/almoxarifado)
- `Dockerfile` com ENV defaults configurados seguindo padrão funcional
- `docker-entrypoint.sh` com validação pg_isready e npm run db:push
- `drizzle.config.ts` limpo sem dotenv/config
- `server/db.ts` usando postgres-js com SSL condicional
- Sistema inicializado sem db-production-only.ts (removido)
- Pacote postgres-js instalado para compatibilidade
✅ Sistema completamente funcional (27/06/2025 13:43)
✅ Conexão PostgreSQL estabelecida com postgres-js
✅ Login API funcionando perfeitamente (200 OK)
✅ Token JWT gerado e validado com sucesso
✅ Usuário cassio autenticado como super_admin
✅ Configuração limpa e estável baseada em referência funcional
✅ Credenciais de produção atualizadas: almoxa:almoxa@viajey_almoxa:5432/almoxa
✅ **DEPLOY REALIZADO COM SUCESSO** - Sistema online no EasyPanel
✅ Conexão PostgreSQL funcionando em produção (viajey_cassio:5432)
✅ Migrações executadas automaticamente no deploy
✅ Aplicação rodando na porta 80 conforme esperado
✅ **CRIAÇÃO AUTOMÁTICA DE USUÁRIOS** implementada e funcionando
✅ Usuários padrão criados automaticamente no deploy: cassio, admin, estruturas
✅ Hash seguro de senhas com bcrypt implementado
✅ Sistema preserva dados existentes e não duplica usuários
✅ **CONFIGURAÇÃO FINAL APLICADA** - Padrão do projeto de comissões
✅ Sistema funcionando completamente (27/06/2025 14:03)
✅ **SEPARAÇÃO DE AMBIENTES** - Dev usa Neon, Prod usa EasyPanel
✅ Criação de usuários apenas em produção (evita duplicação dev)
✅ Deploy configurado seguindo padrão projeto comissões
✅ **PORTAS CORRETAS**: App porta 80 (prod), PostgreSQL porta 5432
✅ Sistema testado e funcionando (login 200 OK)
✅ **VALIDAÇÕES IMPLEMENTADAS**: Verificação de DATABASE_URL em produção
✅ Proteção contra fallback incorreto no deploy
✅ Sistema pronto para deploy final no EasyPanel
✅ **VALIDAÇÃO CONFIRMADA**: Logs mostram rejeição de fallback (conforme esperado)
✅ Deploy funcionando - aguarda apenas DATABASE_URL correta no EasyPanel
✅ **CORREÇÃO FINAL APLICADA**: Tudo padronizado para "almoxa"
✅ URL definitiva: postgres://almoxa:almoxa@viajey_almoxa:5432/almoxa
✅ **RELOAD INFINITO CORRIGIDO**: Removidos loops de redirecionamento
✅ Sistema de roteamento otimizado e funcionando
✅ **RELOAD INFINITO RESOLVIDO**: Configuração React Query otimizada
✅ Cache desabilitado para evitar loops de autenticação
✅ **VARREDURA COMPLETA REALIZADA**: Todos os erros corrigidos
✅ Sistema de autenticação corrigido (super_admin como admin)
✅ Validações de arrays implementadas em todas as páginas
✅ Função authenticatedRequest criada para requisições seguras
✅ Navegação DOM corrigida (nested anchor tags removidos)

## Sistema Finalizado (24/06/2025)
- ✅ Conexão PostgreSQL funcionando perfeitamente
- ✅ Login testado e aprovado (curl 200 OK)
- ✅ Desenvolvimento: banco Neon / Produção: viajey_almo/axiom
- ✅ Credenciais: cassio/1234 e empresa_teste/1234
- ✅ Pronto para deploy no EasyPanel

## Deploy EasyPanel - Configuração Final
### Variáveis de Ambiente:
```
NODE_ENV=production
PORT=5013
DATABASE_URL=postgres://cassio:123@viajey_almo:5432/axiom?sslmode=disable
SESSION_SECRET=almoxarifado-secret-2024
```

### Melhorias Implementadas (25/06/2025):
- ✅ Removido hardcode da URL - agora usa apenas process.env.DATABASE_URL
- ✅ Seguindo melhores práticas de segurança (conforme guia técnico)
- ✅ Sistema totalmente baseado em variáveis de ambiente
- ✅ Logs melhorados para diagnóstico detalhado
- ✅ Error handling robusto para variáveis não definidas
- ✅ Script de verificação de conexão implementado
- ✅ Solução definitiva para erro "axiom does not exist"
- ✅ Varredura completa realizada - todas as referências incorretas removidas
- ✅ Schema padronizado (ownerId = 1) e limpo