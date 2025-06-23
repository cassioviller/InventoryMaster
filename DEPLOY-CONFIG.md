# Configuração Final para Deploy - EasyPanel

## Variáveis de Ambiente para EasyPanel

Copie exatamente estas variáveis no painel do EasyPanel:

```
DATABASE_URL=postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable
NODE_ENV=production
PORT=5013
SESSION_SECRET=almoxarifado-2024-secret
```

## Configurações do Domínio

Baseado na sua configuração mostrada:
- **Hostname**: viajey-almoxa.yt2vsr.easypanel.host
- **Porta**: 5013
- **Protocolo**: HTTP

## Sistema Pronto

O warehouse management system está configurado com:

### Inicialização Automática
- Detecta banco "almox1" existente
- Cria banco "almoxarifado" automaticamente se necessário  
- Estabelece todas as tabelas e índices
- Insere usuários padrão

### Credenciais de Acesso
- **Sistema Admin**: cassio / 1234
- **Empresa Admin**: axiomtech / cassio123
- **Usuário Teste**: almox / 1234
- **Empresa Teste**: empresa_teste / teste123

### Funcionalidades Completas
- Dashboard multi-tenant
- Gestão de estoque com alertas
- Controle de entrada/saída
- Relatórios financeiros e operacionais
- Gestão de fornecedores e funcionários
- Export de dados para Excel/PDF
- Logs de auditoria

## Deploy no EasyPanel

1. Configure as variáveis de ambiente acima
2. Defina porta externa como 5013  
3. Execute o deploy
4. Acesse via: https://viajey-almoxa.yt2vsr.easypanel.host

O sistema iniciará automaticamente e estará pronto para uso.