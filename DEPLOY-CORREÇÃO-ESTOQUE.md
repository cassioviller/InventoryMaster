# 🚀 DEPLOY - Correção de Estoque em Produção

## ⚠️ Problema Identificado

**LIXA N100** e outros materiais mostram:
- **Listagem**: 0 unidades
- **Lotes FIFO**: 4 unidades disponíveis

## 🔧 Solução Implementada

Sistema de correção automática que sincroniza campo `current_stock` com cálculos reais baseados em movimentações.

## 📋 Passos para Correção em Produção

### 1. Fazer Deploy das Correções

```bash
# Push do código atualizado
git add .
git commit -m "fix: correção automática de discrepâncias de estoque"
git push origin main
```

### 2. Executar Correção via API

```bash
# Login no sistema de produção
curl -X POST "https://almox.cassioviller.tech/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"USUARIO_ADMIN","password":"SENHA"}'

# Copiar o token retornado e usar nos próximos comandos
TOKEN="SEU_TOKEN_AQUI"

# Opção A: Validação com correção automática (RECOMENDADO)
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "https://almox.cassioviller.tech/api/materials/validate-stocks"

# Opção B: Recálculo geral de todos os estoques
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "https://almox.cassioviller.tech/api/materials/recalculate-all-stocks"
```

### 3. Verificação Pós-Correção

Após executar a correção:

1. **Acessar listagem de materiais**
2. **Verificar se LIXA N100 mostra 4 unidades** 
3. **Conferir outros materiais problemáticos**
4. **Validar relatórios financeiros**

## 🔍 Monitoramento

### Logs de Sucesso
- Materiais corrigidos aparecerão no log
- Contagem de discrepâncias encontradas
- Confirmação de sincronização

### Exemplo de Resposta Esperada
```json
{
  "success": true,
  "message": "Found and fixed 15 stock discrepancies",
  "discrepancies": [
    {
      "materialId": 123,
      "materialName": "LIXA N100",
      "storedStock": 0,
      "calculatedStock": 4,
      "difference": 4
    }
  ]
}
```

## 🛡️ Proteção Futura

O sistema agora:
- ✅ Recalcula automaticamente após cada entrada/saída
- ✅ Previne discrepâncias futuras  
- ✅ Mantém consistência entre cache e lotes FIFO
- ✅ Oferece endpoints de validação periódica

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Confirmar autenticação (token válido)
3. Contactar desenvolvedor responsável

---

**Status**: ✅ Pronto para implementação
**Prioridade**: 🔴 ALTA - Corrige dados financeiros críticos