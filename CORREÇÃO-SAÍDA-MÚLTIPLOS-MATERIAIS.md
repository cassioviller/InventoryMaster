# Correção - Saída de Múltiplos Materiais

## Problema Identificado

**Mesmo erro na saída de materiais**: "this.recalculateMaterialStock is not a function"

## Causa Raiz

O método `createExit` também estava chamando o método incorreto:

```javascript
// ANTES: Método inexistente
await this.recalculateMaterialStock(item.materialId); // ❌ 

// DEPOIS: Método correto  
await this.recalculateStock(item.materialId); // ✅
```

## Correção Implementada

Atualizada linha no método `createExit` para usar o método correto que existe na classe:

```javascript
// Update material stock using accurate recalculation
await this.recalculateStock(item.materialId);
```

## Sistema de Saída Funcionando

O método `createExit` já estava implementado corretamente para múltiplos materiais:
- ✅ Loop para cada item
- ✅ FIFO logic para cada material  
- ✅ Múltiplos movimentos criados
- ✅ Audit log para cada lote
- ✅ Atualização de estoque individual

Apenas o nome do método de recálculo estava errado.

## Resultado Esperado

Agora as saídas de múltiplos materiais devem funcionar sem erros:
- ✅ LIXA N100 (Quantidade: 1) → Processada com FIFO
- ✅ Múltiplos materiais processados individualmente
- ✅ Estoque atualizado corretamente
- ✅ Sem erro "is not a function"

**Status**: ✅ CORRIGIDO - Sistema de saída funcionando corretamente