# Correção Rápida - Ambiente de Produção

## Problema Detectado
O erro mostra que a coluna `material_id` não existe na tabela `material_movements` no ambiente de produção. Isso indica diferenças de schema entre desenvolvimento e produção.

## Solução Imediata (Execute no Container de Produção)

### 1. Acesse o container de produção
```bash
# No EasyPanel, acesse o terminal do container
docker exec -it <container-name> /bin/bash
```

### 2. Execute o script de correção
```bash
node fix-production-schema.js
```

### 3. Reinicie a aplicação
```bash
# Se necessário, reinicie o processo
npm run start
```

## O que o script faz automaticamente:
- ✅ Cria tabela `cost_centers` se não existir
- ✅ Detecta se colunas estão com nomenclatura incorreta (materialId vs material_id)
- ✅ Adiciona todas as colunas necessárias em `material_movements`
- ✅ Cria foreign keys corretamente
- ✅ Insere dados de exemplo (centros de custo)
- ✅ Mostra estrutura das tabelas para verificação

## Resultado Esperado
Após executar o script, o sistema deve:
- Carregar página de Centros de Custo
- Mostrar relatórios financeiros
- Permitir criação de entradas/saídas
- Funcionar completamente como no desenvolvimento

## Verificação
Teste estas URLs após a correção:
- `/cost-centers` - Deve carregar sem erro
- `/material-entry` - Deve permitir criar entrada
- `/material-exit` - Deve exigir centro de custo
- `/reports/financial` - Deve mostrar relatório

## Se ainda houver problemas
Execute o teste automatizado:
```bash
PRODUCTION_URL=https://sua-url.com node test-production-api.js
```