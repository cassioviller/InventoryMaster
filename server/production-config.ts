import express from "express";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

export async function initializeProductionSystem() {
  console.log('🔧 Iniciando configuração de produção...');
  
  try {
    // Test database connection
    console.log('🔗 Testando conexão PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexão PostgreSQL estabelecida');
    client.release();

    // Create default users if needed
    await createProductionUsers();
    
    console.log('✅ Sistema de produção inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na inicialização de produção:', error);
    throw error;
  }
}

async function createProductionUsers() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('📝 Criando usuários de produção...');
      
      const productionUsers = [
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
          email: 'admin@axiomtech.com',
          password: await bcrypt.hash('cassio123', 10),
          name: 'Axiom Tech Admin',
          role: 'admin' as const,
          isActive: true,
          ownerId: 1
        },
        {
          username: 'almox',
          email: 'operador@almoxarifado.com',
          password: await bcrypt.hash('1234', 10),
          name: 'Operador Almoxarifado',
          role: 'user' as const,
          isActive: true,
          ownerId: 1
        }
      ];

      for (const userData of productionUsers) {
        await db.insert(users).values(userData);
        console.log(`✅ Usuário criado: ${userData.username}`);
      }
    } else {
      console.log('✅ Usuários já existem no banco de produção');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuários de produção:', error);
    throw error;
  }
}

export function setupProductionMiddleware(app: express.Express) {
  // Security headers for production
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Production error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Production error:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });
}