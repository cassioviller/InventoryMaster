/**
 * Script para debugar movimentações que não aparecem no relatório
 * Verifica entradas recentes e identifica problemas de filtros
 */

const { Pool } = require('pg');

async function debugMovimentacoes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Debugando movimentações...\n');

    // 1. Verificar entradas mais recentes
    console.log('1. ENTRADAS MAIS RECENTES:');
    const recentEntries = await pool.query(`
      SELECT 
        mm.id,
        mm.type,
        mm.date,
        mm.created_at,
        m.name as material_name,
        mm.quantity,
        mm.unit_price,
        s.name as supplier_name,
        cc.code as cost_center_code
      FROM material_movements mm
      LEFT JOIN materials m ON mm.material_id = m.id
      LEFT JOIN suppliers s ON mm.supplier_id = s.id  
      LEFT JOIN cost_centers cc ON mm.cost_center_id = cc.id
      WHERE mm.type = 'entry'
      ORDER BY mm.created_at DESC
      LIMIT 10
    `);

    recentEntries.rows.forEach(row => {
      console.log(`  ID: ${row.id} | ${row.material_name} | ${row.quantity} unidades | Data: ${row.date} | Criado: ${row.created_at}`);
    });

    // 2. Verificar DISCO DE CORTE especificamente
    console.log('\n2. ENTRADAS DO DISCO DE CORTE:');
    const discoEntries = await pool.query(`
      SELECT 
        mm.*,
        m.name as material_name
      FROM material_movements mm
      LEFT JOIN materials m ON mm.material_id = m.id
      WHERE m.name LIKE '%DISCO%' OR m.name LIKE '%disco%'
      ORDER BY mm.created_at DESC
    `);

    if (discoEntries.rows.length === 0) {
      console.log('  ❌ Nenhuma movimentação encontrada para DISCO DE CORTE');
    } else {
      discoEntries.rows.forEach(row => {
        console.log(`  ✅ ${row.material_name} | Tipo: ${row.type} | Data: ${row.date} | ID: ${row.id}`);
      });
    }

    // 3. Verificar se há problemas com owner_id
    console.log('\n3. VERIFICAÇÃO DE OWNER_ID:');
    const ownerCheck = await pool.query(`
      SELECT 
        u.username,
        COUNT(mm.id) as total_movimentacoes
      FROM users u
      LEFT JOIN material_movements mm ON u.id = mm.owner_id
      GROUP BY u.id, u.username
      ORDER BY total_movimentacoes DESC
    `);

    ownerCheck.rows.forEach(row => {
      console.log(`  ${row.username}: ${row.total_movimentacoes} movimentações`);
    });

    // 4. Testar query do relatório
    console.log('\n4. TESTE DA QUERY DO RELATÓRIO (últimas 30 movimentações):');
    const reportQuery = await pool.query(`
      SELECT 
        mm.id,
        mm.type,
        mm.date,
        m.name as material_name,
        mm.quantity,
        mm.unit_price,
        mm.created_at
      FROM material_movements mm
      LEFT JOIN materials m ON mm.material_id = m.id
      ORDER BY mm.date DESC
      LIMIT 30
    `);

    reportQuery.rows.forEach(row => {
      console.log(`  ${row.date} | ${row.type} | ${row.material_name} | ${row.quantity} | ID: ${row.id}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  debugMovimentacoes();
}

module.exports = { debugMovimentacoes };