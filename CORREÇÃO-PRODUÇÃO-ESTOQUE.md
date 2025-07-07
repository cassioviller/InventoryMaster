# Correção de Estoque em Produção

## Problema Identificado

O sistema está apresentando discrepâncias de estoque em produção, onde:
- **Listagem de materiais** mostra estoque 0 (zero)
- **Lotes FIFO** mostram estoque real disponível (ex: 4 unidades)

## Causa Raiz

O campo `current_stock` na tabela `materials` não está sendo atualizado corretamente, enquanto o sistema de lotes FIFO funciona perfeitamente.

## Solução Implementada

### 1. Script de Correção Automática

Criado `fix-production-stocks.js` que:
- Calcula o estoque real baseado nas movimentações
- Compara com o estoque armazenado na tabela
- Corrige automaticamente as discrepâncias
- Gera relatório detalhado das correções

### 2. Como Executar em Produção

**Opção 1: Via Script Direto**
```bash
# No servidor de produção
node fix-production-stocks.cjs
```

**Opção 2: Via API (Mais Simples)**
```bash
# Fazer login e obter token
TOKEN=$(curl -X POST "https://almox.cassioviller.tech/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"SEU_USUARIO","password":"SUA_SENHA"}' | jq -r '.token')

# Executar validação e correção
curl -X POST -H "Authorization: Bearer $TOKEN" \
     "https://almox.cassioviller.tech/api/materials/validate-stocks"
```

**Opção 3: Recálculo Geral**
```bash
# Para recalcular todos os estoques de uma só vez
curl -X POST -H "Authorization: Bearer $TOKEN" \
     "https://almox.cassioviller.tech/api/materials/recalculate-all-stocks"
```

### 3. Endpoint de API para Correção

```bash
# Via API (requer autenticação)
curl -X POST -H "Authorization: Bearer $TOKEN" \
     "https://almox.cassioviller.tech/api/materials/validate-stocks"
```

## Proteção Futura

O sistema foi atualizado para:
- Recalcular automaticamente após cada movimentação
- Prevenir discrepâncias futuras
- Manter consistência entre cache e cálculos reais

## Exemplo de Correção

**Antes:**
- LIXA N100: Listagem = 0, Lotes = 4 unidades

**Depois:**
- LIXA N100: Listagem = 4, Lotes = 4 unidades ✅

## Validação

Após executar a correção, verificar:
1. Listagem de materiais mostra estoques corretos
2. Lotes FIFO consistentes com totais
3. Relatórios financeiros precisos

## Contato

Para dúvidas ou problemas, contatar o desenvolvedor responsável.