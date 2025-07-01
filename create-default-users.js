/**
 * Script para criar usuários padrão em ambiente de produção
 * Executa apenas se os usuários não existirem
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function createDefaultUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log('🔧 Conectado ao banco de dados para criar usuários padrão');

    // Verificar se usuários já existem
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(existingUsers.rows[0].count);

    if (userCount > 0) {
      console.log('✅ Usuários já existem, pulando criação');
      client.release();
      return;
    }

    console.log('🔧 Criando usuários padrão...');

    // Usuários padrão para produção
    const defaultUsers = [
      { username: 'cassio', password: '1234', role: 'super_admin' },
      { username: 'admin', password: '1234', role: 'admin' },
      { username: 'estruturas', password: '1234', role: 'admin' },
      { username: 'almoxa', password: 'almoxa', role: 'admin' }
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await client.query(
        'INSERT INTO users (username, password_hash, role, owner_id) VALUES ($1, $2, $3, 1)',
        [user.username, hashedPassword, user.role]
      );
      
      console.log(`✅ Usuário ${user.username} criado com role ${user.role}`);
    }

    client.release();
    console.log('✅ Usuários padrão criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar usuários padrão:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  createDefaultUsers()
    .then(() => {
      console.log('✅ Criação de usuários concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na criação de usuários:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultUsers };