# Instruções para Corrigir Ambiente de Produção

## Problema Identificado
O ambiente de produção não possui as tabelas e colunas mais recentes, especificamente:
- Tabela `cost_centers` não existe
- Coluna `cost_center_id` não existe em `material_movements`

## Solução Rápida

### Opção 1: Script Automático (Recomendado)
Execute no terminal do container de produção:
```bash
node fix-production-schema.js
```

### Opção 2: SQL Manual
Conecte-se ao PostgreSQL de produção e execute:
```sql
-- Aplicar o conteúdo do arquivo production-migration.sql
psql -d $DATABASE_URL -f production-migration.sql
```

### Opção 3: Redeploy Completo
1. Certifique-se que `docker-entrypoint.sh` contém as correções
2. Faça redeploy da aplicação no EasyPanel
3. O script de correção será executado automaticamente

## Verificação Pós-Correção
Após executar qualquer uma das opções, verifique:

1. **Tabela cost_centers existe:**
```sql
SELECT count(*) FROM cost_centers;
```

2. **Coluna cost_center_id existe:**
```sql
\d material_movements
```

3. **Sistema funcionando:**
- Acesse o sistema
- Vá em "Centros de Custo"
- Teste criar um novo centro
- Teste fazer uma saída com centro de custo

## Contas de Teste Disponíveis
- **Super Admin**: cassio / 1234
- **Admin**: teste3 / teste3  
- **Usuário**: funcionario / 123

## Arquivos Criados para Correção
- `fix-production-schema.js` - Script Node.js automático
- `production-migration.sql` - SQL manual
- `docker-entrypoint.sh` - Atualizado com correção automática

## Resultado Esperado
Após a correção, o sistema deve:
- ✅ Carregar a página de Centros de Custo
- ✅ Mostrar relatórios financeiros
- ✅ Permitir saídas com centro de custo obrigatório
- ✅ Funcionar completamente como no desenvolvimento