# Checklist para Deploy no EasyPanel - Sistema de Gerenciamento de Almoxarifado

## Preparação

### Verificação do Repositório
- [x] Todas as alterações estão commitadas no repositório Git
- [x] Arquivos de configuração presentes:
  - [x] `Dockerfile` - configuração do container
  - [x] `docker-entrypoint.sh` - script de entrada do container  
  - [x] `easypanel-build.sh` - script de build customizado
  - [x] `build.sh` - script de build adicional

### Configuração do Deploy

#### 1. Criar Projeto no EasyPanel
- Tipo: **Docker**
- Repositório: URL do seu repositório Git
- Branch: `main`

#### 2. Variáveis de Ambiente Obrigatórias

**Opção 1 - Configuração Manual (Recomendada):**
```env
NODE_ENV=production
PORT=5013
DATABASE_URL=postgres://viajey:viajey@viajey_viajey:5432/viajey?sslmode=require
SESSION_SECRET=seu-valor-secreto-unico-aqui
```

**Opção 2 - Detecção Automática:**
```env
NODE_ENV=production
PORT=5013
POSTGRES_HOST=viajey_viajey
POSTGRES_USER=viajey
POSTGRES_PASSWORD=viajey
POSTGRES_DB=viajey
POSTGRES_PORT=5432
SESSION_SECRET=seu-valor-secreto-unico-aqui
```

#### 3. Configurar Volume Persistente
- Adicionar volume em `/app/uploads` para armazenar arquivos de upload

#### 4. Configurações do Container
- **Porta Externa**: 5013
- **Comando de Build**: `./easypanel-build.sh`
- **Comando de Start**: `npm start`

## Solução de Problemas Comuns

### Erro "Cannot find package 'vite'"
**Causa**: EasyPanel não instala dependências de desenvolvimento por padrão.
**Solução**: O script `easypanel-build.sh` resolve isso instalando todas as dependências.

### Erro de Conexão com Banco de Dados
**Verificações**:
1. DATABASE_URL está correta?
2. PostgreSQL está acessível do container?
3. SSL está configurado (`sslmode=require`)?

### Arquivos Estáticos Não Carregam
**Verificações**:
1. Build copiou assets para `dist/assets`?
2. Servidor está servindo arquivos estáticos?
3. Paths dos assets estão corretos?

## Sistema de Inicialização Automática

O sistema possui inicialização automática que:
- Detecta/cria banco "almoxarifado" 
- Cria todas as tabelas necessárias
- Insere usuários padrão
- Configura índices de performance

### Credenciais de Acesso Padrão

**Super Admin Sistema:**
- Usuário: `cassio`
- Senha: `1234`

**Super Admin Empresa:**
- Usuário: `axiomtech`
- Senha: `cassio123`

**Usuário Teste:**
- Usuário: `almox`
- Senha: `1234`

**Empresa Teste:**
- Usuário: `empresa_teste`
- Senha: `teste123`

## Funcionalidades do Sistema

### Multi-Tenancy Completo
- Isolamento total de dados por empresa
- Controle de acesso baseado em funções
- Dashboard personalizado por tenant

### Gestão de Estoque
- Entrada e saída de materiais com rastreamento completo
- Controle de estoque mínimo com alertas
- Gestão de categorias e unidades de medida
- Controle de custos unitários e totais

### Relatórios Avançados
- **Financeiro de Estoque**: Valor total por material
- **Consumo de Materiais**: Análise por período
- **Movimentação de Funcionários**: Atividades por colaborador
- **Relatório Geral**: Entradas e saídas consolidadas
- **Rastreamento de Fornecedores**: Histórico com observações

### Segurança
- Autenticação JWT com expiração
- Criptografia bcrypt para senhas
- Logs de auditoria completos
- Controle granular de acesso

## Verificação Pós-Deploy

### 1. Teste de Conectividade
```bash
curl https://seu-dominio.easypanel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cassio","password":"1234"}'
```

### 2. Verificação do Banco
```bash
# Conectar ao banco e verificar tabelas
psql "$DATABASE_URL" -c "\dt"
```

### 3. Teste de Funcionalidades
- Login com credenciais padrão
- Criação de material de teste
- Entrada de estoque
- Geração de relatório

## Monitoramento

### Logs da Aplicação
- Acesse logs através do painel do EasyPanel
- Monitore inicialização automática do banco
- Verifique conexões SSL

### Métricas de Performance
- Tempo de resposta das APIs
- Uso de memória do container
- Conexões simultâneas ao banco

## Backup e Manutenção

### Backup Automático
- Configure backup automático no EasyPanel
- Frequência recomendada: diária

### Atualizações
- Sistema suporta atualizações sem downtime
- Migrações executadas automaticamente
- Rollback disponível através do Git

## Contato e Suporte

Para questões técnicas ou problemas de deploy:
1. Verificar logs do container
2. Confirmar variáveis de ambiente
3. Testar conectividade com banco
4. Consultar documentação de troubleshooting
5. **Dockerfile**: `Dockerfile` (raiz do projeto)
6. **Porta**: 5013
7. **Health Check**: `/api/auth/verify`

### 3. Configuração de Rede

- Certifique-se que a aplicação pode se comunicar com o banco de dados
- Configure o domínio personalizado se necessário

## Estrutura de Arquivos para Deploy

```
projeto/
├── Dockerfile                 # Configuração do container
├── docker-entrypoint.sh      # Script de inicialização
├── .dockerignore             # Arquivos a ignorar no build
├── package.json              # Dependências e scripts
├── drizzle.config.ts         # Configuração do banco
└── [resto dos arquivos]
```

## Scripts de Build

O Dockerfile executa automaticamente:
1. `npm ci` - Instala dependências
2. `npm run build` - Gera build de produção
3. `npm run db:push` - Sincroniza schema do banco
4. `npm run start` - Inicia a aplicação

## Comandos Úteis

### Build local (teste):
```bash
docker build -t almoxarifado .
docker run -p 5013:5013 -e DATABASE_URL="sua_url_aqui" almoxarifado
```

### Logs de deploy:
No EasyPanel, monitore os logs durante o deploy para verificar:
- ✅ Conexão com banco de dados
- ✅ Migração do schema
- ✅ Aplicação iniciada na porta 5013

## Usuários Padrão

Após o primeiro deploy, use estas credenciais para acessar:

- **Super Admin**: `cassio` / `1234`
- **Admin**: `axiomtech` / `cassio123`
- **Usuário Teste**: `almox` / `1234`

## Troubleshooting

### Erro "could not translate host name" 
**Problema**: `psql: error: could not translate host name "almoxarifado_db" to address`

**Configuração Final Simplificada**:
No EasyPanel, configure apenas:
```
NODE_ENV=production
PORT=5013
```

O sistema detectará automaticamente seu PostgreSQL existente (`viajey_viajey`) e criará o banco `almoxarifado` separadamente.

**Verificação Automática**:
- ✅ Sistema detecta PostgreSQL do viajey automaticamente
- ✅ Cria banco `almoxarifado` sem afetar dados existentes
- ✅ Aplicação inicia mesmo se banco não estiver imediatamente disponível
- ✅ Logs detalhados para diagnóstico de problemas

### Erro de Conexão com Banco
- Verifique se a DATABASE_URL usa o hostname interno correto
- Confirme que usuário/senha estão corretos
- Teste a conectividade: ambos serviços devem estar "running"
- Verifique se o PostgreSQL aceita conexões externas

### Erro no Build
- Verifique os logs do Docker build
- Confirme que todas as dependências estão no package.json
- Teste o build localmente primeiro

### Aplicação não inicia
- Verifique as variáveis de ambiente
- Monitore os logs da aplicação
- Confirme que a porta 5013 está exposta corretamente