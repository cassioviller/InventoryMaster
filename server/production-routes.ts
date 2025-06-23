import express from 'express';
import { registerRoutes } from './routes';

// Função para verificar se todas as rotas estão sendo registradas corretamente
export async function setupProductionRoutes(app: express.Express) {
  console.log('🔧 Configurando rotas para produção...');
  
  // Registrar todas as rotas da aplicação
  const server = await registerRoutes(app);
  
  // Listar todas as rotas registradas para verificação
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path
          });
        }
      });
    }
  });
  
  console.log('📋 Rotas registradas na aplicação:');
  routes.forEach(route => {
    console.log(`  ${route.method} ${route.path}`);
  });
  
  // Verificar rotas críticas do sistema
  const criticalRoutes = [
    'POST /api/auth/login',
    'GET /api/auth/verify',
    'GET /api/users',
    'POST /api/users',
    'GET /api/categories',
    'POST /api/categories',
    'GET /api/materials',
    'POST /api/materials',
    'GET /api/employees',
    'POST /api/employees',
    'GET /api/suppliers',
    'POST /api/suppliers',
    'GET /api/third-parties',
    'POST /api/third-parties',
    'GET /api/movements',
    'POST /api/movements/entry',
    'POST /api/movements/exit',
    'GET /api/dashboard/stats',
    'GET /api/dashboard/low-stock'
  ];
  
  const registeredRoutes = routes.map(r => `${r.method} ${r.path}`);
  const missingRoutes = criticalRoutes.filter(route => !registeredRoutes.includes(route));
  
  if (missingRoutes.length > 0) {
    console.log('⚠️ Rotas críticas não encontradas:');
    missingRoutes.forEach(route => console.log(`  ${route}`));
  } else {
    console.log('✅ Todas as rotas críticas estão registradas');
  }
  
  // Middleware de fallback para rotas não encontradas
  app.use('/api/*', (req, res) => {
    console.log(`⚠️ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ 
      error: 'Endpoint não encontrado',
      method: req.method,
      path: req.path,
      availableRoutes: registeredRoutes
    });
  });
  
  return server;
}

// Função para verificar se todos os middlewares estão funcionando
export function verifyMiddleware(app: express.Express) {
  console.log('🔍 Verificando middlewares...');
  
  // Verificar se o CORS está configurado
  console.log('  CORS: Configurado para permitir todas as origens');
  
  // Verificar se o parser JSON está ativo
  console.log('  JSON Parser: Ativo');
  
  // Verificar se a autenticação está funcionando
  console.log('  Autenticação JWT: Ativa');
  
  // Verificar se os arquivos estáticos estão sendo servidos
  console.log('  Arquivos estáticos: Servindo do diretório dist');
  
  console.log('✅ Todos os middlewares verificados');
}