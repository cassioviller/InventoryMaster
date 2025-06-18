# Deploy Sistema de Gerenciamento de Almoxarifado - EasyPanel

## Pré-requisitos

1. Conta no EasyPanel
2. Repositório Git com o código da aplicação
3. Banco de dados PostgreSQL configurado

## Configuração no EasyPanel

### 1. Criar o Banco de Dados PostgreSQL

No EasyPanel, crie um serviço PostgreSQL:
- Nome: `almoxarifado-db`
- Versão: PostgreSQL 15 ou superior
- Configurações de memória e storage conforme necessário

### 2. Configurar a Aplicação

#### Variáveis de Ambiente Necessárias:

**IMPORTANTE**: Use a URL de conexão interna gerada pelo EasyPanel

```env
DATABASE_URL=postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable
NODE_ENV=production
PORT=5013
```

**Substitua pelos valores do seu banco PostgreSQL no EasyPanel:**
- `almox2` = usuário do banco
- `almox3` = senha do banco  
- `viajey_almox` = nome do serviço PostgreSQL (hostname interno)
- `almox1` = nome do banco de dados

#### Configuração do Serviço:

1. **Nome do Serviço**: `almoxarifado-app`
2. **Tipo**: Docker
3. **Repositório**: URL do seu repositório Git
4. **Branch**: main (ou sua branch principal)
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

**Solução Imediata**:
1. **Adicione variável de ambiente**:
   ```
   SKIP_DB_CHECK=true
   ```
   Isso permite que a aplicação inicie mesmo sem o banco disponível

2. **Configure DATABASE_URL correta**:
   - No EasyPanel, vá até seu serviço PostgreSQL  
   - Use exatamente: `postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable`
   - Substitua apenas os valores pelos seus dados reais

**Verificações Necessárias**:
- ✅ PostgreSQL deve estar "Running" no EasyPanel
- ✅ Usuário `almox2` existe no banco
- ✅ Senha `almox3` está correta  
- ✅ Banco `almox1` foi criado
- ✅ Hostname `viajey_almox` é o nome do serviço PostgreSQL

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