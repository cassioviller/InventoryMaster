# DEPLOY PRODUÇÃO - Configuração Final

## PARA EASYPANEL

Use EXATAMENTE estas variáveis de ambiente:

```
DATABASE_URL=postgres://almox2:almox3@viajey_almox:5432/almox1?sslmode=disable
NODE_ENV=production
PORT=5013
SESSION_SECRET=almoxarifado-2024-secret
```

## IMPORTANTE

- O sistema usa sempre a DATABASE_URL do ambiente
- Não há mais lógica condicional de banco
- Funciona identicamente em desenvolvimento e produção
- Zero referências ao banco "almox2" inexistente

## CREDENCIAIS

- Usuário: cassio / Senha: 1234
- Empresa: empresa_teste / Senha: 1234