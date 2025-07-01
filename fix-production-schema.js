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

    // 2. Verificar estrutura da tabela material_movements
    console.log('📝 Verificando estrutura da tabela material_movements...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'material_movements'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Estrutura atual da tabela material_movements:');
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // 3. Verificar se material_id existe (pode estar como materialId em algumas versões)
    const hasMaterialId = tableStructure.rows.some(row => row.column_name === 'material_id');
    const hasMaterialIdCamel = tableStructure.rows.some(row => row.column_name === 'materialId');
    
    if (!hasMaterialId && hasMaterialIdCamel) {
      console.log('🔄 Renomeando materialId para material_id...');
      await client.query(`ALTER TABLE material_movements RENAME COLUMN "materialId" TO material_id;`);
    }

    // 4. Verificar outras colunas essenciais e adicionar se necessário
    const requiredColumns = {
      'user_id': 'INTEGER NOT NULL',
      'material_id': 'INTEGER NOT NULL',
      'type': 'TEXT NOT NULL',
      'quantity': 'INTEGER NOT NULL',
      'unit_price': 'TEXT',
      'date': 'TIMESTAMP DEFAULT NOW() NOT NULL',
      'origin_type': 'TEXT',
      'supplier_id': 'INTEGER',
      'destination_type': 'TEXT',
      'destination_employee_id': 'INTEGER',
      'destination_third_party_id': 'INTEGER',
      'return_employee_id': 'INTEGER',
      'return_third_party_id': 'INTEGER',
      'notes': 'TEXT',
      'cost_center_id': 'INTEGER',
      'owner_id': 'INTEGER NOT NULL DEFAULT 1',
      'created_at': 'TIMESTAMP DEFAULT NOW() NOT NULL'
    };

    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      const hasColumn = tableStructure.rows.some(row => row.column_name === columnName);
      if (!hasColumn) {
        console.log(`➕ Adicionando coluna ${columnName}...`);
        await client.query(`ALTER TABLE material_movements ADD COLUMN ${columnName} ${columnDef};`);
      }
    }

    // 5. Verificar se a coluna cost_center_id tem a referência correta
    const foreignKeys = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'material_movements' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%cost_center%';
    `);

    if (foreignKeys.rows.length === 0) {
      console.log('🔗 Adicionando foreign key para cost_center_id...');
      try {
        await client.query(`
          ALTER TABLE material_movements 
          ADD CONSTRAINT fk_material_movements_cost_center 
          FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);
        `);
      } catch (error) {
        console.log('ℹ️ Foreign key já existe ou não pôde ser adicionada:', error.message);
      }
    }

    // 6. Inserir centros de custo padrão se não existirem
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

    // 7. Verificar se as tabelas existem e mostrar contagem
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