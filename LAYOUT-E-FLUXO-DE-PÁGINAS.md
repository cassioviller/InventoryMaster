# LAYOUT E FLUXO DE PÁGINAS - SISTEMA DE GERENCIAMENTO DE ALMOXARIFADO

## ESTRUTURA GERAL DO LAYOUT

### 1. COMPONENTES DE LAYOUT PRINCIPAIS

#### Header (Cabeçalho)
```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO] Sistema de Almoxarifado      [User Menu] [Logout]   │
└─────────────────────────────────────────────────────────────┘
```
- **Localização**: `client/src/components/layout/header.tsx`
- **Elementos**:
  - Logo/título do sistema (esquerda)
  - Menu do usuário com nome e role (direita)
  - Botão de logout
  - Indicador de status de conexão

#### Navigation (Menu Lateral/Horizontal)
```
┌─────────────────┐
│ 📊 Dashboard     │
│ 📦 Materiais     │
│ ↕️  Movimentações │
│ 🏪 Gestão        │
│ 📈 Relatórios    │
│ ⚙️  Super Admin  │
└─────────────────┘
```
- **Localização**: `client/src/components/layout/navigation.tsx`
- **Menu Principal**:
  - Dashboard (visão geral)
  - Materiais (inventário)
  - Movimentações (entrada/saída)
  - Gestão (fornecedores, funcionários, etc.)
  - Relatórios (financeiro, estoque)
  - Super Admin (apenas super_admin)

#### Container Principal
```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                               │
├─────────────────────────────────────────────────────────────┤
│ NAV │                   CONTEÚDO                           │
│     │                   PRINCIPAL                          │
│     │                                                      │
└─────────────────────────────────────────────────────────────┘
```
- Layout responsivo com max-width centralizado
- Padding e spacing consistentes
- Background neutro (`bg-neutral-bg`)

## FLUXO DE AUTENTICAÇÃO

### 1. PÁGINA DE LOGIN
**Rota**: `/login`
**Arquivo**: `client/src/pages/login.tsx`

```
┌─────────────────────────────────────┐
│        🏢 SISTEMA ALMOXARIFADO      │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ Usuário: [____________]         │ │
│  │ Senha:   [____________]         │ │
│  │                                 │ │
│  │        [ENTRAR]                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Credenciais de teste:              │
│  - cassio / 1234                    │
│  - empresa_teste / 1234             │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Formulário com validação Zod
- Autenticação JWT
- Redirecionamento baseado em role
- Mensagens de erro amigáveis

**Fluxo de Login**:
1. Usuário acessa `/login`
2. Insere credenciais
3. Sistema valida via API `/api/auth/login`
4. Se válido: redireciona para dashboard
5. Se inválido: mostra erro

## DASHBOARD PRINCIPAL

### 1. LAYOUT DO DASHBOARD
**Rota**: `/` (página inicial)
**Arquivo**: `client/src/pages/dashboard.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                    📊 DASHBOARD                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   TOTAL     │ │   ESTOQUE   │ │ MOVIMENTO   │           │
│  │ MATERIAIS   │ │    BAIXO    │ │   HOJE      │           │
│  │    125      │ │      8      │ │     15      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📈 GRÁFICO MOVIMENTAÇÕES                   │ │
│  │                                                         │ │
│  │     [Gráfico de barras/linhas]                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📋 ÚLTIMAS MOVIMENTAÇÕES                   │ │
│  │  Data      │ Tipo    │ Material      │ Quantidade      │ │
│  │  25/06     │ Entrada │ Papel A4      │ +50             │ │
│  │  25/06     │ Saída   │ Caneta        │ -10             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Cards de Métricas**:
- Total de materiais cadastrados
- Materiais com estoque baixo
- Movimentações do dia
- Valor total do estoque

**Gráficos**:
- Movimentações por período
- Top materiais mais movimentados
- Análise de entrada vs saída

## GESTÃO DE MATERIAIS

### 1. LISTA DE MATERIAIS
**Rota**: `/materials`
**Arquivo**: `client/src/pages/management.tsx` (aba Materiais)

```
┌─────────────────────────────────────────────────────────────┐
│  📦 MATERIAIS                              [+ Novo Material] │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Buscar materiais...]           🏷️ [Categoria ▼]       │
├─────────────────────────────────────────────────────────────┤
│  Nome          │Categoria │Estoque │Mín│Preço │Ações       │
│  ─────────────────────────────────────────────────────────  │
│  Papel A4      │Escritório│  50    │10 │ 0,50 │ ✏️ 🗑️     │
│  Caneta Azul   │Escritório│   5    │20 │ 1,50 │ ✏️ 🗑️ ⚠️  │
│  Martelo       │Ferramenta│  15    │ 5 │25,00 │ ✏️ 🗑️     │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:
- Busca por nome
- Filtro por categoria
- Indicador de estoque baixo (⚠️)
- Ações: editar, excluir
- Paginação automática

### 2. FORMULÁRIO DE MATERIAL
**Modal/Drawer**: Novo/Editar Material

```
┌─────────────────────────────────────┐
│         ➕ NOVO MATERIAL            │
├─────────────────────────────────────┤
│ Nome: [_________________]           │
│ Categoria: [Selecionar ▼]          │
│ Descrição: [_________________]      │
│                                     │
│ Estoque Atual: [_____]              │
│ Estoque Mínimo: [_____]             │
│ Unidade: [Selecionar ▼]            │
│ Preço Unitário: R$ [_____]          │
│                                     │
│ Fornecedor: [Selecionar ▼]         │
│                                     │
│       [Cancelar] [Salvar]           │
└─────────────────────────────────────┘
```

## MOVIMENTAÇÕES

### 1. ENTRADA DE MATERIAIS
**Rota**: `/material-entry`
**Arquivo**: `client/src/pages/material-entry.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                    📥 ENTRADA DE MATERIAIS                   │
├─────────────────────────────────────────────────────────────┤
│  Tipo de Origem: ⚪ Fornecedor ⚪ Devolução Funcionário      │
│                                                             │
│  Fornecedor: [Selecionar ▼]                                │
│  Data: [25/06/2025]                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📦 ITENS DA ENTRADA                        │ │
│  │  Material      │Qtd│Preço Unit│Total   │[Ações]        │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Papel A4      │100│    0,50  │ 50,00  │ ➖            │ │
│  │  Caneta Azul   │ 50│    1,50  │ 75,00  │ ➖            │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  [+ Adicionar Item]              TOTAL: R$ 125,00      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Observações: [________________________]                   │
│                                                             │
│                    [Cancelar] [Confirmar Entrada]          │
└─────────────────────────────────────────────────────────────┘
```

### 2. SAÍDA DE MATERIAIS
**Rota**: `/material-exit`
**Arquivo**: `client/src/pages/material-exit.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                    📤 SAÍDA DE MATERIAIS                     │
├─────────────────────────────────────────────────────────────┤
│  Destino: ⚪ Funcionário ⚪ Terceiro                        │
│                                                             │
│  Funcionário: [Selecionar ▼]                               │
│  Data: [25/06/2025]                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               📦 ITENS DA SAÍDA                         │ │
│  │  Material      │Estoque│Qtd│Finalidade │[Ações]        │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Papel A4      │  150  │ 25│Impressões │ ➖            │ │
│  │  Caneta Azul   │   55  │  5│Escritório │ ➖            │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  [+ Adicionar Item]                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Observações: [________________________]                   │
│                                                             │
│                    [Cancelar] [Confirmar Saída]            │
└─────────────────────────────────────────────────────────────┘
```

## GESTÃO DE CADASTROS

### 1. PÁGINA DE GESTÃO
**Rota**: `/management`
**Arquivo**: `client/src/pages/management.tsx`

**Estrutura em Abas**:
```
┌─────────────────────────────────────────────────────────────┐
│ [📦 Materiais] [🏪 Fornecedores] [👥 Funcionários] [🏢 Terceiros] [🏷️ Categorias] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [Conteúdo da aba selecionada]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. ABA FORNECEDORES
```
┌─────────────────────────────────────────────────────────────┐
│  🏪 FORNECEDORES                           [+ Novo Fornecedor] │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Buscar fornecedores...]                                │
├─────────────────────────────────────────────────────────────┤
│  Nome            │CNPJ         │Telefone    │Status│Ações   │
│  ─────────────────────────────────────────────────────────  │
│  ABC Suprimentos │12.345.678/01│11-1234-5678│ ✅  │ ✏️ 🗑️ │
│  XYZ Materiais   │98.765.432/01│11-8765-4321│ ✅  │ ✏️ 🗑️ │
└─────────────────────────────────────────────────────────────┘
```

### 3. ABA FUNCIONÁRIOS
```
┌─────────────────────────────────────────────────────────────┐
│  👥 FUNCIONÁRIOS                          [+ Novo Funcionário] │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Buscar funcionários...]  🏢 [Departamento ▼]          │
├─────────────────────────────────────────────────────────────┤
│  Nome           │Departamento │Email         │Status│Ações   │
│  ─────────────────────────────────────────────────────────  │
│  João Silva     │Almoxarifado │joao@emp.com  │ ✅  │ ✏️ 🗑️ │
│  Maria Santos   │Compras      │maria@emp.com │ ✅  │ ✏️ 🗑️ │
└─────────────────────────────────────────────────────────────┘
```

## RELATÓRIOS

### 1. PÁGINA DE RELATÓRIOS
**Rota**: `/reports`
**Arquivo**: `client/src/pages/reports.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                     📈 RELATÓRIOS                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  📊 ESTOQUE │ │ 💰 FINANCEIRO│ │📋 MOVIMENTO │           │
│  │             │ │             │ │             │           │
│  │ [Gerar PDF] │ │ [Gerar PDF] │ │ [Gerar PDF] │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  📅 Período: [01/06/2025] até [25/06/2025]                │
│  🏷️ Categoria: [Todas ▼]                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📋 RELATÓRIO DE ESTOQUE                    │ │
│  │                                                         │ │
│  │  Material        │Categoria │Estoque│Valor Unit│Total   │ │
│  │  ──────────────────────────────────────────────────────  │ │
│  │  Papel A4        │Escritório│  150  │   0,50   │ 75,00  │ │
│  │  Caneta Azul     │Escritório│   55  │   1,50   │ 82,50  │ │
│  │  ──────────────────────────────────────────────────────  │ │
│  │                              TOTAL GERAL: R$ 157,50    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. RELATÓRIO FINANCEIRO
**Rota**: `/financial-reports`
**Arquivo**: `client/src/pages/financial-reports.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│                   💰 RELATÓRIO FINANCEIRO                   │
├─────────────────────────────────────────────────────────────┤
│  📅 [01/06/2025] até [25/06/2025]      [Filtrar] [PDF]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   ENTRADAS  │ │   SAÍDAS    │ │   SALDO     │           │
│  │  R$ 5.250,00│ │ R$ 2.180,00 │ │ R$ 3.070,00 │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📈 GRÁFICO FINANCEIRO                      │ │
│  │         [Gráfico de barras por período]                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📋 DETALHAMENTO POR CATEGORIA              │ │
│  │  Categoria      │Entradas │Saídas  │Saldo   │%         │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Escritório     │2.500,00 │1.200,00│1.300,00│ 42%      │ │
│  │  Ferramentas    │1.750,00 │  680,00│1.070,00│ 35%      │ │
│  │  Limpeza        │1.000,00 │  300,00│  700,00│ 23%      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## SUPER ADMIN

### 1. PAINEL SUPER ADMIN
**Rota**: `/super-admin`
**Arquivo**: `client/src/pages/super-admin.tsx`
**Acesso**: Apenas usuários com role 'super_admin'

```
┌─────────────────────────────────────────────────────────────┐
│                    ⚙️ PAINEL SUPER ADMIN                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              👥 GESTÃO DE USUÁRIOS                     │ │
│  │                                      [+ Novo Usuário]  │ │
│  │  Nome           │Username│Email        │Role │Ações    │ │
│  │  ─────────────────────────────────────────────────────  │ │
│  │  Cassio Admin   │cassio  │cassio@x.com │SA   │ ✏️ 🗑️  │ │
│  │  Empresa Teste  │empresa │emp@test.com │ADM  │ ✏️ 🗑️  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              📊 ESTATÍSTICAS GLOBAIS                   │ │
│  │                                                         │ │
│  │  Total Usuários: 15        Empresas Ativas: 5          │ │
│  │  Total Materiais: 1.245    Movimentações Hoje: 89      │ │
│  │  Valor Total: R$ 45.678,90                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## FLUXO DE NAVEGAÇÃO

### 1. FLUXO PRINCIPAL
```
LOGIN → DASHBOARD → [MENU PRINCIPAL]
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   MATERIAIS      MOVIMENTAÇÕES      GESTÃO
        ↓                ↓                ↓
   [Lista/Form]    [Entrada/Saída]   [Abas Múltiplas]
                                          ↓
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
              FORNECEDORES         FUNCIONÁRIOS           TERCEIROS
```

### 2. FLUXO DE MOVIMENTAÇÃO
```
DASHBOARD → MOVIMENTAÇÕES
                ↓
        ┌───────┴───────┐
        ↓               ↓
    ENTRADA           SAÍDA
        ↓               ↓
 [Selecionar Origem] [Selecionar Destino]
        ↓               ↓
 [Adicionar Itens]  [Adicionar Itens]
        ↓               ↓
   [Confirmar]      [Confirmar]
        ↓               ↓
     SUCESSO ← ← ← ← SUCESSO
        ↓
   DASHBOARD/LISTA
```

### 3. FLUXO DE RELATÓRIOS
```
DASHBOARD → RELATÓRIOS
                ↓
        ┌───────┼───────┐
        ↓       ↓       ↓
    ESTOQUE FINANCEIRO MOVIMENTO
        ↓       ↓       ↓
   [Filtros] [Período] [Tipo]
        ↓       ↓       ↓
    [Gerar] → [PDF] ← [Gerar]
```

## RESPONSIVIDADE

### 1. DESKTOP (> 1024px)
- Layout completo com sidebar
- Tabelas com todas as colunas
- Formulários em duas colunas

### 2. TABLET (768px - 1024px)
- Menu colapsível
- Tabelas scrolláveis horizontalmente
- Formulários em uma coluna

### 3. MOBILE (< 768px)
- Menu em drawer/modal
- Cards em vez de tabelas
- Formulários empilhados
- Botões touch-friendly

## COMPONENTES REUTILIZÁVEIS

### 1. UI COMPONENTS (Shadcn/ui)
- Button, Input, Select
- Dialog, Sheet, Toast
- Table, Card, Badge
- Form, FormField, FormMessage

### 2. CUSTOM COMPONENTS
- DataTable (tabelas com paginação)
- SearchInput (busca com debounce)
- StatusBadge (indicadores coloridos)
- ExportButton (PDF/Excel)

### 3. HOOKS PERSONALIZADOS
- useAuth (autenticação)
- useToast (notificações)
- useDebounce (busca)
- useLocalStorage (persistência)