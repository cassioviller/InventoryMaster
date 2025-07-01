/**
 * Script para validar se o deploy foi bem-sucedido
 * Verifica schema, conectividade e funcionalidades críticas
 */

const { Pool } = require('pg');

async function validateDeployment() {
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
    console.log('🔧 Validando deployment...');

    // 1. Verificar conectividade
    console.log('1️⃣ Testando conectividade...');
    await client.query('SELECT NOW()');
    console.log('✅ Conectividade OK');

    // 2. Verificar tabelas críticas
    console.log('2️⃣ Verificando tabelas...');
    const requiredTables = [
      'users', 'categories', 'materials', 'employees', 
      'suppliers', 'third_parties', 'material_movements', 
      'cost_centers', 'audit_logs'
    ];

    for (const table of requiredTables) {
      const result = await client.query(
        `SELECT to_regclass('public.${table}') as exists`
      );
      if (result.rows[0].exists) {
        console.log(`✅ Tabela ${table} existe`);
      } else {
        console.log(`❌ Tabela ${table} NÃO existe`);
        throw new Error(`Tabela crítica ${table} não encontrada`);
      }
    }

    // 3. Verificar colunas críticas
    console.log('3️⃣ Verificando colunas críticas...');
    
    // Verificar cost_center_id em material_movements
    const costCenterColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'material_movements' 
      AND column_name = 'cost_center_id'
    `);
    
    if (costCenterColumn.rows.length > 0) {
      console.log('✅ Coluna cost_center_id existe em material_movements');
    } else {
      console.log('❌ Coluna cost_center_id NÃO existe em material_movements');
      throw new Error('Schema desatualizado - coluna cost_center_id ausente');
    }

    // 4. Verificar usuários
    console.log('4️⃣ Verificando usuários...');
    const users = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(users.rows[0].count);
    
    if (userCount > 0) {
      console.log(`✅ ${userCount} usuários encontrados`);
      
      // Verificar usuário cassio
      const cassio = await client.query(
        'SELECT username, role FROM users WHERE username = $1',
        ['cassio']
      );
      
      if (cassio.rows.length > 0) {
        console.log(`✅ Usuário cassio existe com role: ${cassio.rows[0].role}`);
      } else {
        console.log('⚠️  Usuário cassio não encontrado');
      }
    } else {
      console.log('⚠️  Nenhum usuário encontrado');
    }

    // 5. Verificar centros de custo
    console.log('5️⃣ Verificando centros de custo...');
    const costCenters = await client.query('SELECT COUNT(*) FROM cost_centers');
    const costCenterCount = parseInt(costCenters.rows[0].count);
    
    if (costCenterCount > 0) {
      console.log(`✅ ${costCenterCount} centros de custo encontrados`);
    } else {
      console.log('⚠️  Nenhum centro de custo encontrado');
    }

    // 6. Verificar foreign keys
    console.log('6️⃣ Verificando foreign keys...');
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('material_movements', 'materials', 'employees')
    `);
    
    console.log(`✅ ${foreignKeys.rows.length} foreign keys encontradas`);

    // 7. Teste de funcionalidade básica
    console.log('7️⃣ Testando funcionalidades básicas...');
    
    // Testar inserção em audit_logs
    await client.query(`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, changes, owner_id)
      VALUES (1, 'VALIDATION', 'deployment', 1, '{"test": true}', 1)
    `);
    console.log('✅ Inserção em audit_logs funciona');

    client.release();

    console.log('');
    console.log('🎉 VALIDAÇÃO DE DEPLOYMENT CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('✅ Todos os componentes críticos estão funcionando');
    console.log('✅ Schema atualizado e compatível');
    console.log('✅ Sistema pronto para uso em produção');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('1. Testar login via interface web');
    console.log('2. Verificar funcionalidades de centro de custo');
    console.log('3. Testar entradas e saídas de material');

  } catch (error) {
    console.error('❌ Validação falhou:', error.message);
    console.error('');
    console.error('🔧 Possíveis soluções:');
    console.error('1. Executar fix-production-schema.js');
    console.error('2. Verificar variáveis de ambiente');
    console.error('3. Reiniciar aplicação');
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  validateDeployment()
    .then(() => {
      console.log('✅ Validação concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na validação:', error);
      process.exit(1);
    });
}

module.exports = { validateDeployment };