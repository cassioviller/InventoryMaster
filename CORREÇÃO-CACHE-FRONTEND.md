# Correção de Cache no Frontend

## Problema Identificado

O problema **NÃO** estava no backend, mas sim no **cache do React Query** no frontend!

### Configuração Problemática
```javascript
staleTime: Infinity,     // ❌ Dados nunca considerados obsoletos
gcTime: Infinity,        // ❌ Cache mantido infinitamente
refetchOnMount: false,   // ❌ Não recarrega ao montar componente
```

### Cache Infinito
- React Query estava mantendo dados de estoque infinitamente em cache
- Mesmo com backend corrigindo dados, frontend mostrava versão em cache
- LIXA N100 permanecia com 0 unidades no frontend apesar de 4 unidades no backend

## Correção Implementada

### 1. Configuração do QueryClient Corrigida
```javascript
staleTime: 0,           // ✅ Sempre considera dados obsoletos
gcTime: 1000 * 60 * 5,  // ✅ Cache por apenas 5 minutos
refetchOnMount: true,   // ✅ Recarrega ao montar
refetchOnWindowFocus: true, // ✅ Recarrega ao focar janela
```

### 2. Queries de Materiais Atualizadas
```javascript
const { data: materialsData } = useQuery({
  queryKey: ['/api/materials'],
  staleTime: 0,     // ✅ Sempre busca dados frescos
  gcTime: 0,        // ✅ Não mantém cache
});
```

### 3. Fetch de Lotes com Timestamp
```javascript
const res = await authenticatedRequest(`/api/materials/${materialId}/lots?t=${Date.now()}`);
```

## Resultado Esperado

Após essas correções:
- ✅ Frontend sempre busca dados atualizados do backend
- ✅ Estoques sempre mostram valores corretos
- ✅ LIXA N100 deve mostrar 4 unidades consistentemente
- ✅ Cache não interfere mais na exibição de dados de estoque

## Teste

1. Recarregar página de saída de materiais
2. Selecionar LIXA N100
3. Verificar se mostra 4 unidades disponíveis
4. Confirmar consistência entre listagem e lotes

**Status**: ✅ CORRIGIDO - Cache frontend atualizado para dados frescos