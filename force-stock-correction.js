/**
 * Script para forçar correção de estoque em produção
 * Execute este script para corrigir imediatamente o problema da LIXA N100
 */

import { Pool } from 'pg';

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Força correção do estoque da LIXA N100 especificamente
 */
async function forceFixLixaN100() {
  const client = await pool.connect();
  try {
    console.log('🔧 Forçando correção da LIXA N100...');

    // Buscar material LIXA N100
    const { rows: materials } = await client.query(`
      SELECT id, name, current_stock 
      FROM materials 
      WHERE name ILIKE '%LIXA%N100%' OR name ILIKE '%LIXA N100%'
    `);

    if (materials.length === 0) {
      console.log('❌ Material LIXA N100 não encontrado');
      return;
    }

    for (const material of materials) {
      console.log(`📋 Analisando: ${material.name} (ID: ${material.id})`);
      console.log(`📊 Estoque atual: ${material.current_stock}`);

      // Calcular estoque real baseado nas movimentações
      const { rows: movements } = await client.query(`
        SELECT type, quantity, is_return, created_at, date
        FROM material_movements 
        WHERE material_id = $1 
        ORDER BY COALESCE(date, created_at) ASC
      `, [material.id]);

      let realStock = 0;
      console.log(`📝 Processando ${movements.length} movimentações...`);
      
      for (const movement of movements) {
        if (movement.type === 'entry') {
          realStock += movement.quantity;
          console.log(`  ➕ Entrada: +${movement.quantity} = ${realStock}`);
        } else if (movement.type === 'exit') {
          if (movement.is_return) {
            realStock += movement.quantity;
            console.log(`  🔄 Devolução: +${movement.quantity} = ${realStock}`);
          } else {
            realStock -= movement.quantity;
            console.log(`  ➖ Saída: -${movement.quantity} = ${realStock}`);
          }
        }
      }

      realStock = Math.max(0, realStock);
      console.log(`🎯 Estoque calculado: ${realStock}`);

      if (material.current_stock !== realStock) {
        console.log(`🔧 CORREÇÃO NECESSÁRIA: ${material.current_stock} → ${realStock}`);
        
        await client.query(
          'UPDATE materials SET current_stock = $1 WHERE id = $2',
          [realStock, material.id]
        );
        
        console.log(`✅ ${material.name} corrigido com sucesso!`);
      } else {
        console.log(`✅ ${material.name} já está correto`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  } finally {
    client.release();
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 CORREÇÃO FORÇADA - LIXA N100');
    console.log('===============================\n');

    await forceFixLixaN100();

    console.log('\n🎉 Correção concluída!');
    console.log('Verifique o sistema para confirmar a correção.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
main();