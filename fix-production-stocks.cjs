/**
 * Script para corrigir discrepâncias de estoque em produção (CommonJS)
 * Execute este script no ambiente de produção para sincronizar os estoques
 */

const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Calcula o estoque real de um material baseado nas movimentações
 */
async function calculateRealStock(materialId) {
  const client = await pool.connect();
  try {
    // Buscar todas as movimentações do material ordenadas por data
    const { rows: movements } = await client.query(`
      SELECT type, quantity, is_return, created_at, date
      FROM material_movements 
      WHERE material_id = $1 
      ORDER BY COALESCE(date, created_at) ASC
    `, [materialId]);

    let stock = 0;
    
    for (const movement of movements) {
      if (movement.type === 'entry') {
        stock += movement.quantity;
      } else if (movement.type === 'exit') {
        if (movement.is_return) {
          // Devolução aumenta o estoque
          stock += movement.quantity;
        } else {
          // Saída normal diminui o estoque
          stock -= movement.quantity;
        }
      }
    }

    return Math.max(0, stock);
  } finally {
    client.release();
  }
}

/**
 * Corrige o estoque de um material específico
 */
async function fixMaterialStock(materialId) {
  const client = await pool.connect();
  try {
    // Buscar dados do material
    const { rows: materials } = await client.query(
      'SELECT id, name, current_stock FROM materials WHERE id = $1',
      [materialId]
    );

    if (materials.length === 0) {
      console.log(`Material ${materialId} não encontrado`);
      return;
    }

    const material = materials[0];
    const realStock = await calculateRealStock(materialId);

    if (material.current_stock !== realStock) {
      console.log(`🔧 Corrigindo ${material.name}: ${material.current_stock} → ${realStock}`);
      
      await client.query(
        'UPDATE materials SET current_stock = $1 WHERE id = $2',
        [realStock, materialId]
      );
      
      return {
        materialId,
        materialName: material.name,
        oldStock: material.current_stock,
        newStock: realStock,
        fixed: true
      };
    } else {
      console.log(`✅ ${material.name}: Estoque correto (${realStock})`);
      return {
        materialId,
        materialName: material.name,
        stock: realStock,
        fixed: false
      };
    }
  } finally {
    client.release();
  }
}

/**
 * Corrige todos os estoques no sistema
 */
async function fixAllStocks() {
  const client = await pool.connect();
  try {
    console.log('🔍 Iniciando correção de estoques...');

    // Buscar todos os materiais
    const { rows: materials } = await client.query(
      'SELECT id, name, current_stock FROM materials ORDER BY name'
    );

    console.log(`📊 Encontrados ${materials.length} materiais para verificar`);

    const results = [];
    let fixedCount = 0;

    for (const material of materials) {
      const result = await fixMaterialStock(material.id);
      if (result) {
        results.push(result);
        if (result.fixed) {
          fixedCount++;
        }
      }
    }

    console.log('\n📋 RESUMO DA CORREÇÃO:');
    console.log(`✅ Materiais verificados: ${materials.length}`);
    console.log(`🔧 Materiais corrigidos: ${fixedCount}`);
    console.log(`✓ Materiais já corretos: ${materials.length - fixedCount}`);

    if (fixedCount > 0) {
      console.log('\n🔧 CORREÇÕES REALIZADAS:');
      results.filter(r => r.fixed).forEach(r => {
        console.log(`  • ${r.materialName}: ${r.oldStock} → ${r.newStock}`);
      });
    }

    return results;
  } finally {
    client.release();
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 CORREÇÃO DE ESTOQUES EM PRODUÇÃO');
    console.log('===================================\n');

    const results = await fixAllStocks();

    console.log('\n🎉 Correção concluída com sucesso!');
    console.log('Todos os estoques foram sincronizados com as movimentações reais.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { fixAllStocks, fixMaterialStock, calculateRealStock };