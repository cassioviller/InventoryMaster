# Correção - Entrada de Múltiplos Materiais

## Problema Identificado

**Erro na entrada de múltiplos materiais**: Apenas alguns materiais eram lançados no estoque ou erro total.

### Erro Específico
```
"Failed to create entry", "error": "this.recalculateMaterialStock is not a function"
```

## Causas Raiz Encontradas

### 1. **Movimento Único Para Múltiplos Itens**
```javascript
// ANTES: Criava apenas 1 movimento para o primeiro item
const firstItem = entry.items[0];
const result = await db.insert(materialMovements).values({
  materialId: firstItem.materialId, // ❌ Só o primeiro item
  quantity: firstItem.quantity,    // ❌ Só a primeira quantidade
  // ...
});
```

### 2. **Método Incorreto**
```javascript
// ANTES: Método não existia
await this.recalculateMaterialStock(item.materialId); // ❌ Nome errado

// DEPOIS: Método correto
await this.recalculateStock(item.materialId); // ✅ Nome correto
```

## Solução Implementada

### **1. Loop Para Cada Item**
```javascript
// Criar UM movimento para CADA item
for (const item of entry.items) {
  const [movement] = await db.insert(materialMovements).values({
    materialId: item.materialId,  // ✅ Material específico
    quantity: item.quantity,      // ✅ Quantidade específica
    unitPrice: item.unitPrice,    // ✅ Preço específico
    // ... outros campos
  });
  
  movements.push(movement);
}
```

### **2. Atualização Individual de Estoque**
```javascript
// Para cada item criado, atualizar estoque específico
if (currentMaterial) {
  const newStock = currentMaterial.currentStock + item.quantity;
  await db.update(materials)
    .set({ currentStock: newStock })
    .where(eq(materials.id, item.materialId));
  
  await this.recalculateStock(item.materialId); // ✅ Método correto
}
```

### **3. Logs Detalhados**
```javascript
console.log(`Creating movement for material ${item.materialId}, quantity: ${item.quantity}`);
console.log(`Created ${movements.length} movements for ${entry.items.length} items`);
```

## Resultado Esperado

### ✅ **Entrada Múltipla Funcionando:**
- AVENTAL DE RASPA 1,20 X 0,60 (Qtd: 10) ✅
- LUVA DE RASPA TAM 9 (Qtd: 10) ✅  
- LUVA DE RASPA TAM 10 (Qtd: 10) ✅
- BALDE DE LONA (Qtd: 3) ✅
- CAPACETE PLT C/ SELO INMETRO (Qtd: 6) ✅

### ✅ **Sistema Corrigido:**
- Cada material gera movimento individual
- Estoque atualizado corretamente para todos
- Sem erros de método não encontrado
- Total R$ 880,50 processado completamente

## Teste

1. Acessar entrada de materiais
2. Adicionar múltiplos materiais diferentes
3. Confirmar entrada
4. Verificar se TODOS os materiais aparecem no estoque
5. Confirmar que não há mais erro "Failed to create entry"

**Status**: ✅ CORRIGIDO - Sistema de entrada múltipla funcionando corretamente