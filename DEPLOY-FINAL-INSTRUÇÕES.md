# Instruções Finais de Deploy - Sistema de Almoxarifado
## Configuração Completa para EasyPanel

### 🎯 PROBLEMA RESOLVIDO
As imagens mostraram que o ambiente de produção tinha:
- ❌ Tabela `cost_centers` não existia (PostgresError)
- ❌ Schema desatualizado (material_id em camelCase)
- ❌ Correções de deploy não aplicadas automaticamente

### ✅ SOLUÇÃO IMPLEMENTADA

#### 1. Dockerfile Corrigido
- Instalação de `postgresql-client` para scripts de migração
- Variáveis de ambiente com valores padrão corretos
- Health check implementado
- Porta 80 configurada para EasyPanel

#### 2. docker-entrypoint.sh Completamente Reescrito
Seguindo as melhores práticas do guia fornecido:
- **Desdefinição de variáveis PG\*** para evitar conflitos
- **Validação robusta de DATABASE_URL**
- **Detecção automática de problemas de schema**
- **Execução automática de correções**
- **Validação final antes de iniciar aplicação**

#### 3. Scripts de Correção Criados
- `fix-production-schema.js` - Correção principal do schema
- `create-default-users.js` - Criação automática de usuários
- `validate-deployment.js` - Validação pós-deploy

### 🚀 PROCESSO DE DEPLOY NO EASYPANEL

#### Variáveis de Ambiente Necessárias:
```
NODE_ENV=production
PORT=80
DATABASE_URL=postgres://almoxa:almoxa@viajey_almoxa:5432/almoxa?sslmode=disable
SESSION_SECRET=almoxarifado-secret-2024
```

#### O que acontece no deploy:
1. **Build da imagem** com Dockerfile otimizado
2. **Inicialização via docker-entrypoint.sh**:
   - Remove variáveis PG* conflitantes
   - Aguarda PostgreSQL estar pronto
   - Detecta se tabelas existem
   - **Executa fix-production-schema.js se necessário**
   - Cria usuários padrão se não existirem
   - Valida schema final
   - Inicia aplicação

### 🔧 CORREÇÕES AUTOMÁTICAS IMPLEMENTADAS

O `docker-entrypoint.sh` agora detecta e corrige automaticamente:
- ✅ Tabela `cost_centers` ausente → **cria automaticamente**
- ✅ Coluna `material_id` em camelCase → **converte para snake_case**
- ✅ Coluna `cost_center_id` ausente → **adiciona automaticamente**
- ✅ Usuários padrão ausentes → **cria cassio, admin, estruturas**
- ✅ Dados de exemplo ausentes → **popula centros de custo**

### 📋 VALIDAÇÃO PÓS-DEPLOY

Após o deploy, o sistema automaticamente valida:
1. Conectividade PostgreSQL
2. Existência de todas as tabelas críticas
3. Colunas corretas (snake_case)
4. Foreign keys configuradas
5. Usuários criados
6. Centros de custo populados

### 🎉 RESULTADO ESPERADO

Após a execução, o sistema terá:
- ✅ **Schema completamente sincronizado** com desenvolvimento
- ✅ **Tabela cost_centers** com dados de exemplo (MANUT001, PROD001, ADM001)
- ✅ **Usuários padrão** criados (cassio/1234, admin/1234, estruturas/1234)
- ✅ **Nomenclatura snake_case** em todas as colunas
- ✅ **Foreign keys** funcionando corretamente
- ✅ **Sistema funcional** igual ao ambiente de desenvolvimento

### 🔍 COMO VERIFICAR SE FUNCIONOU

1. **Logs de inicialização** devem mostrar:
   ```
   ✅ PostgreSQL está pronto!
   ✅ Tabela 'cost_centers' já existe
   ✅ Coluna 'cost_center_id' já existe em material_movements
   ✅ Schema validado com sucesso!
   🚀 Iniciando aplicação na porta 80...
   ```

2. **Teste de login**:
   ```bash
   curl -X POST http://sua-url/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"estruturas","password":"1234"}'
   ```

3. **Teste de centros de custo**:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://sua-url/api/cost-centers
   ```

### 🚨 SE AINDA HOUVER PROBLEMAS

Execute manualmente no container:
```bash
# 1. Conectar ao container
docker exec -it container_name bash

# 2. Executar correção manual
node fix-production-schema.js

# 3. Validar
node validate-deployment.js

# 4. Reiniciar aplicação
pm2 restart all
```

### 📝 CONCLUSÃO

O sistema agora está **completamente preparado** para deploy automático no EasyPanel. Todas as correções de schema serão aplicadas automaticamente durante a inicialização, garantindo que o ambiente de produção fique idêntico ao desenvolvimento testado.