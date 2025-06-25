# DEPLOY FINAL NO EASYPANEL - GUIA COMPLETO

## CONFIGURAÇÃO FINAL DO SISTEMA

### 1. VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
No EasyPanel, configure exatamente estas variáveis na aba "Environment":

```
NODE_ENV=production
PORT=5013
DATABASE_URL=postgres://axiom:estruturas@viajey_cassio:5432/almoxarifado?sslmode=disable
SESSION_SECRET=almoxarifado-secret-2024
```

### 2. CONFIGURAÇÕES DO SERVIÇO
- **Build Method**: Dockerfile
- **Build Context**: . (raiz do projeto)
- **Dockerfile Path**: Dockerfile
- **Port**: 5013

### 3. CREDENCIAIS DE ACESSO
- **Usuário**: cassio / **Senha**: 1234
- **Usuário**: empresa_teste / **Senha**: 1234

### 4. VERIFICAÇÃO PÓS-DEPLOY
Após o deploy, teste estes endpoints:
```bash
# Login
curl -X POST https://seu-dominio/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cassio","password":"1234"}'

# Verificar status
curl https://seu-dominio/api/dashboard/stats
```

### 5. ESTRUTURA DE BANCO AUTOMÁTICA
O sistema criará automaticamente:
- Todas as tabelas necessárias
- Usuários padrão (cassio e empresa_teste)
- Dados iniciais compatíveis

### 6. LOGS ESPERADOS NO DEPLOY
```
🔗 Conectando ao PostgreSQL...
Ambiente: production
DATABASE_URL: Configurada
Database host: viajey_cassio
Database name: almoxarifado
🔧 Sistema de Almoxarifado - Iniciando...
✅ Sistema inicializado para produção
[express] serving on port 5013
```

### 7. SOLUÇÃO DE PROBLEMAS
- **Erro "DATABASE_URL não definida"**: Verifique se a variável está na aba Environment
- **Erro "database does not exist"**: Confirme se o banco "almoxarifado" existe no PostgreSQL
- **Erro de conexão**: Verifique se o host "viajey_cassio" está acessível

O sistema está pronto para produção com todas as melhores práticas implementadas.