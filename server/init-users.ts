import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function createDefaultUsers() {
  try {
    console.log('🔄 Verificando usuários padrão...');
    
    // Verificar se já existem usuários
    const existingUsers = await db.select({ username: users.username }).from(users).limit(1);
    
    if (existingUsers.length > 0) {
      console.log('ℹ️ Usuários já existem - preservando dados');
      return;
    }

    // Hash da senha "1234" para todos os usuários
    const hashedPassword = await bcrypt.hash("1234", 10);

    const defaultUsers = [
      {
        username: 'cassio',
        email: 'cassio@almoxarifado.com',
        password: hashedPassword,
        name: 'Cassio Admin',
        role: 'super_admin' as const,
        isActive: true,
        ownerId: 1,
        createdAt: new Date()
      },
      {
        username: 'admin',
        email: 'admin@almoxarifado.com', 
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin' as const,
        isActive: true,
        ownerId: 1,
        createdAt: new Date()
      },
      {
        username: 'estruturas',
        email: 'estruturas@almoxarifado.com',
        password: hashedPassword,
        name: 'Estruturas User',
        role: 'admin' as const,
        isActive: true,
        ownerId: 1,
        createdAt: new Date()
      }
    ];

    for (const user of defaultUsers) {
      try {
        await db.insert(users).values(user);
        console.log(`✅ Usuário ${user.username} criado com sucesso`);
      } catch (error: any) {
        console.log(`ℹ️ Usuário ${user.username} já existe ou erro:`, error.message);
      }
    }
    
    console.log('✅ Inicialização de usuários concluída');
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuários padrão:', error.message);
  }
}