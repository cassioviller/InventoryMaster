# Guia Completo de Deploy no EasyPanel

## Configuração Rápida

### 1. Variáveis de Ambiente (Copie e Cole)
```
NODE_ENV=production
PORT=5013
DATABASE_URL=postgres://viajey:viajey@viajey_viajey:5432/viajey?sslmode=require
SESSION_SECRET=almoxarifado-secret-key-2024
```

### 2. Configurações do Container
- **Build Command**: `./easypanel-build.sh`
- **Start Command**: `npm start`
- **Porta Externa**: 5013
- **Volume**: `/app/uploads` (para arquivos)

## Solução para Erro "DATABASE_URL não está configurada"

O erro mostrado nos logs indica que a variável DATABASE_URL não está sendo detectada. Use uma destas soluções:

### Solução 1: Configuração Direta (Recomendada)
No painel do EasyPanel, adicione estas variáveis exatamente como mostrado:

```
DATABASE_URL=postgres://viajey:viajey@viajey_viajey:5432/viajey?sslmode=require
NODE_ENV=production
PORT=5013
```

### Solução 2: Se o PostgreSQL estiver em serviço separado
Se você criou um serviço PostgreSQL separado no EasyPanel, use:

```
DATABASE_URL=postgres://username:password@hostname:5432/database?sslmode=require
```

Substitua:
- `username` = usuário do PostgreSQL
- `password` = senha do PostgreSQL  
- `hostname` = nome do serviço PostgreSQL no EasyPanel
- `database` = nome do banco inicial

## Processo de Deploy Passo a Passo

### 1. Preparar Repositório
- Commit todas as mudanças para o Git
- Certifique-se que os arquivos estão presentes:
  - `Dockerfile`
  - `easypanel-build.sh`
  - `docker-entrypoint.sh`
  - `package.json`

### 2. Criar Aplicação no EasyPanel
1. Novo Projeto → Docker
2. Conectar repositório Git
3. Configurar variáveis de ambiente
4. Configurar porta 5013
5. Fazer deploy

### 3. Verificação Pós-Deploy
Após o deploy, verifique:
- Logs do container não mostram erros de DATABASE_URL
- Aplicação responde na porta 5013
- Login funciona com credenciais padrão

## Credenciais de Acesso

Após deploy bem-sucedido, use estas credenciais para testar:

**Admin Sistema:**
- Usuário: `cassio`
- Senha: `1234`

**Admin Empresa:**  
- Usuário: `axiomtech`
- Senha: `cassio123`

## Troubleshooting

### Erro: "database 'almoxarifado' does not exist"
Normal na primeira execução. O sistema criará o banco automaticamente.

### Erro: "connection refused"
Verifique se a DATABASE_URL aponta para o serviço PostgreSQL correto.

### Erro: "Cannot find package 'vite'"
O script `easypanel-build.sh` resolve isso automaticamente.

### Build falha
1. Verifique se `easypanel-build.sh` tem permissão de execução
2. Confirme que o repositório tem todos os arquivos necessários
3. Verifique logs de build no EasyPanel

## Configuração do PostgreSQL

Se precisar criar um novo serviço PostgreSQL:

1. **Criar Serviço PostgreSQL:**
   - Nome: `almoxarifado-db`
   - Usuário: `almox_user`
   - Senha: `almox_pass`
   - Banco: `almox_main`

2. **Configurar DATABASE_URL:**
   ```
   DATABASE_URL=postgres://almox_user:almox_pass@almoxarifado-db:5432/almox_main?sslmode=require
   ```

## Funcionalidades Disponíveis

Após deploy, o sistema oferece:
- Dashboard multi-tenant
- Gestão completa de estoque
- Relatórios financeiros e operacionais
- Controle de usuários e permissões
- Exportação de dados
- Logs de auditoria

## URLs de Acesso

- **Aplicação**: `https://seu-app.easypanel.host`
- **API Base**: `https://seu-app.easypanel.host/api`
- **Login**: `https://seu-app.easypanel.host/login`

## Monitoramento

Verifique regularmente:
- Logs do container
- Uso de recursos (CPU/Memory)
- Espaço em disco do PostgreSQL
- Backup automático funcionando