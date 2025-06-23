import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureCompatibleTables } from "./db-compatibility";

// Log da DATABASE_URL configurada no ambiente
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "Configurada" : "Não definida");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database before setting up routes
  try {
    await ensureCompatibleTables();
  } catch (error: any) {
    console.error("Database initialization failed:", error.message);
  }

  const server = await registerRoutes(app);
  
  // Verify all routes are properly registered for production
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Configuração de produção ativa - verificando rotas...');
    
    // List all registered routes for debugging
    const routes: any[] = [];
    app._router?.stack?.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push({
          method: Object.keys(middleware.route.methods)[0].toUpperCase(),
          path: middleware.route.path
        });
      } else if (middleware.name === 'router' && middleware.handle?.stack) {
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
    
    console.log('📋 Rotas ativas:', routes.length);
    const criticalRoutes = [
      'POST /api/auth/login',
      'GET /api/users',
      'GET /api/categories',
      'GET /api/materials',
      'GET /api/employees',
      'GET /api/dashboard/stats'
    ];
    
    const registeredPaths = routes.map(r => `${r.method} ${r.path}`);
    const missing = criticalRoutes.filter(route => !registeredPaths.includes(route));
    
    if (missing.length === 0) {
      console.log('✅ Todas as rotas críticas registradas');
    } else {
      console.log('⚠️ Rotas não encontradas:', missing);
    }
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port configuration: 5000 for Replit, 5013 for EasyPanel
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
