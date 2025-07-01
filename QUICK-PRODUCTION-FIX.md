# Correção Rápida - Ambiente de Produção
## Executar no Container EasyPanel

### 🎯 PROBLEMA IDENTIFICADO:
As imagens mostram que o ambiente de produção tem:
- ❌ Tabela `cost_centers` não existe
- ❌ Coluna `material_id` ainda em camelCase (deveria ser snake_case)
- ❌ Schema desatualizado comparado ao desenvolvimento

### ⚡ SOLUÇÃO RÁPIDA:

**No container de produção, execute:**

```bash
# 1. Navegue até o diretório da aplicação
cd /app

# 2. Execute o script de correção
node fix-production-schema.js

# 3. Reinicie a aplicação
pm2 restart all
# OU
docker restart container_name
# OU
supervisorctl restart app
```

### 🔧 ALTERNATIVA MANUAL:

Se o script Node.js falhar, execute diretamente no PostgreSQL:

```bash
# Conectar ao PostgreSQL
psql "$DATABASE_URL"

# Executar SQL de correção
\i production-migration.sql
```

### ✅ VALIDAÇÃO PÓS-CORREÇÃO:

```bash
# Testar API após correção
node test-production-api.js
```

### 📊 RESULTADO ESPERADO:

Após a correção, a aplicação deve:
- ✅ Carregar centros de custo sem erro
- ✅ Permitir entradas de material
- ✅ Permitir saídas com centro obrigatório
- ✅ Exibir relatórios corretamente

### 🚀 DADOS CRIADOS:

O script adicionará automaticamente:
- **MANUT001** - Manutenção Predial (R$ 5.000/mês)
- **PROD001** - Produção Linha A (R$ 15.000/mês)  
- **ADM001** - Administração Geral (R$ 8.000/mês)

### 🔍 VERIFICAÇÃO:

Após execução, acesse:
1. `/cost-centers` - Deve listar os 3 centros
2. `/material-entry` - Deve permitir entrada com centro opcional
3. `/material-exit` - Deve exigir centro obrigatório
4. `/reports` - Deve gerar relatórios sem erro

**Tempo de execução:** ~30 segundos
**Impacto:** Zero downtime (correção em background)