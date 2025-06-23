import express, { type Request, Response, NextFunction } from "express";
import { setupVite } from "./vite";
import { createServer } from "http";
import { db, pool } from "./db";
import { users, categories, materials, employees, suppliers, thirdParties } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

// Test database connection and initialize
async function initializeDatabase() {
  try {
    console.log('🔗 Testando conexão com PostgreSQL...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Conexão PostgreSQL estabelecida');
    client.release();

    // Create default users if they don't exist
    await createDefaultUsers();
    
    console.log('✅ Sistema inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    throw error;
  }
}

async function createDefaultUsers() {
  try {
    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('📝 Criando usuários padrão...');
      
      const defaultUsers = [
        {
          username: 'cassio',
          email: 'cassio@almoxarifado.com',
          password: await bcrypt.hash('1234', 10),
          name: 'Cassio',
          role: 'super_admin' as const,
          isActive: true,
          ownerId: 1
        },
        {
          username: 'axiomtech',
          email: 'axiomtech@almoxarifado.com',
          password: await bcrypt.hash('cassio123', 10),
          name: 'Axiom Tech',
          role: 'admin' as const,
          isActive: true,
          ownerId: 2
        },
        {
          username: 'almox',
          email: 'almox@almoxarifado.com',
          password: await bcrypt.hash('1234', 10),
          name: 'Operador Almoxarifado',
          role: 'user' as const,
          isActive: true,
          ownerId: 2
        }
      ];

      for (const user of defaultUsers) {
        await db.insert(users).values(user);
      }
      
      console.log('✅ Usuários padrão criados');
    } else {
      console.log('✅ Usuários já existem no banco');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuários padrão:', error);
  }
}

// Simple API routes for testing
app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "API funcionando!", timestamp: new Date().toISOString() });
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get("/api/categories", async (req: Request, res: Response) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get("/api/materials", async (req: Request, res: Response) => {
  try {
    const allMaterials = await db.select().from(materials);
    res.json(allMaterials);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get("/api/employees", async (req: Request, res: Response) => {
  try {
    const allEmployees = await db.select().from(employees);
    res.json(allEmployees);
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro não tratado:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Erro interno do servidor";
  res.status(status).json({ message });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    const port = Number(process.env.PORT) || 5013;
    const server = createServer(app);
    
    setupVite(app, server).then(() => {
      server.listen(port, "0.0.0.0", () => {
        console.log(`🚀 Servidor rodando na porta ${port}`);
        console.log(`📊 Dashboard: http://localhost:${port}`);
      });
    });
  })
  .catch((error) => {
    console.error('❌ Falha na inicialização:', error);
    process.exit(1);
  });