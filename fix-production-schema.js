/**
 * Script para corrigir o schema do banco de dados em produção
 * Execute este script no ambiente de produção para sincronizar o schema
 */

const { Pool } = require('pg');

async function fixProductionSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log('🔧 Iniciando correção do schema de produção...');

  try {
    const client = await pool.connect();
    
    // 1. Criar tabela cost_centers se não existir
    console.log('📝 Criando tabela cost_centers...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cost_centers (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        department TEXT NOT NULL,
        responsible TEXT NOT NULL,
        monthly_budget DECIMAL(10,2),
        annual_budget DECIMAL(10,2),
        is_active BOOLEAN NOT NULL DEFAULT true,
        owner_id INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Verificar se a coluna cost_center_id existe em material_movements
    console.log('📝 Verificando coluna cost_center_id...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'material_movements' 
      AND column_name = 'cost_center_id';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('➕ Adicionando coluna cost_center_id...');
      await client.query(`
        ALTER TABLE material_movements 
        ADD COLUMN cost_center_id INTEGER REFERENCES cost_centers(id);
      `);
    }

    // 3. Inserir centros de custo padrão se não existirem
    console.log('📝 Inserindo centros de custo padrão...');
    const costCenters = [
      {
        code: 'ADM001',
        name: 'Administração Geral',
        description: 'Centro de custo para atividades administrativas',
        department: 'Administração',
        responsible: 'Gerente Administrativo',
        monthlyBudget: 8000.00,
        annualBudget: 96000.00
      },
      {
        code: 'MANUT001', 
        name: 'Manutenção Predial',
        description: 'Centro de custo para manutenção de equipamentos e instalações',
        department: 'Manutenção',
        responsible: 'Supervisor de Manutenção',
        monthlyBudget: 5000.00,
        annualBudget: 60000.00
      },
      {
        code: 'PROD001',
        name: 'Produção Linha A', 
        description: 'Centro de custo para linha de produção principal',
        department: 'Produção',
        responsible: 'Gerente de Produção',
        monthlyBudget: 15000.00,
        annualBudget: 180000.00
      },
      {
        code: 'TEST001',
        name: 'Centro de Teste',
        description: 'Centro de custo criado para testes do sistema',
        department: 'Teste',
        responsible: 'Teste',
        monthlyBudget: 3000.00,
        annualBudget: 36000.00
      }
    ];

    for (const center of costCenters) {
      const exists = await client.query('SELECT id FROM cost_centers WHERE code = $1', [center.code]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, 1)
        `, [center.code, center.name, center.description, center.department, center.responsible, center.monthlyBudget, center.annualBudget]);
        console.log(`✅ Centro de custo ${center.code} criado`);
      } else {
        console.log(`ℹ️ Centro de custo ${center.code} já existe`);
      }
    }

    // 4. Verificar se as tabelas existem e mostrar contagem
    const costCenterCount = await client.query('SELECT COUNT(*) FROM cost_centers');
    console.log(`✅ Tabela cost_centers: ${costCenterCount.rows[0].count} registros`);

    const movementsWithCostCenter = await client.query(`
      SELECT COUNT(*) FROM material_movements WHERE cost_center_id IS NOT NULL
    `);
    console.log(`✅ Movimentações com centro de custo: ${movementsWithCostCenter.rows[0].count}`);

    client.release();
    console.log('🎉 Schema de produção corrigido com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixProductionSchema()
    .then(() => {
      console.log('✅ Processo concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na correção:', error);
      process.exit(1);
    });
}

module.exports = { fixProductionSchema };