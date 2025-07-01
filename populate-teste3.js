/**
 * Script para popular dados completos para o usuário teste3
 * Execute: node populate-teste3.js
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

const sql = postgres(process.env.DATABASE_URL || 'postgresql://neondb_owner:***@ep-fancy-wave-a5f1svp6.us-east-2.aws.neon.tech/neondb?sslmode=require');

const TESTE3_OWNER_ID = 32; // ID do usuário teste3

async function populateTeste3Data() {
  console.log('🔧 Iniciando população de dados para teste3...');

  try {
    // 1. Verificar se usuário teste3 existe
    const [user] = await sql`SELECT * FROM users WHERE id = ${TESTE3_OWNER_ID}`;
    if (!user) {
      console.error('❌ Usuário teste3 não encontrado!');
      return;
    }
    console.log('✅ Usuário teste3 encontrado:', user.username);

    // 2. Criar categorias
    console.log('📁 Criando categorias...');
    const categoriesData = [
      { name: 'Ferramentas Manuais', description: 'Chaves, martelos, alicates' },
      { name: 'Equipamentos Elétricos', description: 'Furadeiras, serras, lixadeiras' },
      { name: 'Materiais de Construção', description: 'Cimento, tijolos, argamassa' },
      { name: 'EPIs', description: 'Equipamentos de proteção individual' },
      { name: 'Materiais Hidráulicos', description: 'Canos, conexões, válvulas' }
    ];

    for (const cat of categoriesData) {
      await sql`
        INSERT INTO categories (name, description, owner_id, created_at)
        VALUES (${cat.name}, ${cat.description}, ${TESTE3_OWNER_ID}, NOW())
      `;
    }

    // 3. Criar fornecedores
    console.log('🏪 Criando fornecedores...');
    const suppliersData = [
      { name: 'Ferragens Central', cnpj: '12.345.678/0001-90', contact: 'João Silva', phone: '(11) 3333-4444', email: 'contato@ferragenscentral.com' },
      { name: 'Materiais de Construção Norte', cnpj: '98.765.432/0001-10', contact: 'Maria Santos', phone: '(11) 5555-6666', email: 'vendas@construcaonorte.com' },
      { name: 'Distribuidora de EPIs Premium', cnpj: '11.222.333/0001-44', contact: 'Carlos Mendes', phone: '(11) 7777-8888', email: 'premium@epis.com' }
    ];

    for (const sup of suppliersData) {
      await sql`
        INSERT INTO suppliers (name, cnpj, contact, phone, email, is_active, owner_id, created_at)
        VALUES (${sup.name}, ${sup.cnpj}, ${sup.contact}, ${sup.phone}, ${sup.email}, true, ${TESTE3_OWNER_ID}, NOW())
        ON CONFLICT (cnpj, owner_id) DO NOTHING
      `;
    }

    // 4. Criar funcionários
    console.log('👥 Criando funcionários...');
    const employeesData = [
      { name: 'Pedro Monteiro', department: 'Manutenção', email: 'pedro@empresa.com', phone: '(11) 9999-1111' },
      { name: 'Ana Costa', department: 'Produção', email: 'ana@empresa.com', phone: '(11) 9999-2222' },
      { name: 'Roberto Silva', department: 'Almoxarifado', email: 'roberto@empresa.com', phone: '(11) 9999-3333' },
      { name: 'Carla Rodrigues', department: 'Segurança', email: 'carla@empresa.com', phone: '(11) 9999-4444' }
    ];

    for (const emp of employeesData) {
      await sql`
        INSERT INTO employees (name, department, email, phone, is_active, owner_id, created_at)
        VALUES (${emp.name}, ${emp.department}, ${emp.email}, ${emp.phone}, true, ${TESTE3_OWNER_ID}, NOW())
        ON CONFLICT (email, owner_id) DO NOTHING
      `;
    }

    // 5. Criar terceiros
    console.log('🏢 Criando terceiros...');
    const thirdPartiesData = [
      { name: 'Construtora ABC', document: '22.333.444/0001-55', contact: 'José Oliveira', phone: '(11) 8888-9999' },
      { name: 'Empreiteira XYZ', document: '33.444.555/0001-66', contact: 'Ricardo Pereira', phone: '(11) 7777-6666' }
    ];

    for (const tp of thirdPartiesData) {
      await sql`
        INSERT INTO third_parties (name, document, contact, phone, is_active, owner_id, created_at)
        VALUES (${tp.name}, ${tp.document}, ${tp.contact}, ${tp.phone}, true, ${TESTE3_OWNER_ID}, NOW())
        ON CONFLICT (document, owner_id) DO NOTHING
      `;
    }

    // 6. Criar centros de custo
    console.log('💰 Criando centros de custo...');
    const costCentersData = [
      { code: 'MANUT001', name: 'Manutenção Predial', description: 'Centro de custo para manutenção predial', department: 'Manutenção', responsible: 'Pedro Monteiro', monthlyBudget: 5000.00, annualBudget: 60000.00 },
      { code: 'PROD001', name: 'Produção Linha A', description: 'Centro de custo da linha de produção A', department: 'Produção', responsible: 'Ana Costa', monthlyBudget: 15000.00, annualBudget: 180000.00 },
      { code: 'ALMO001', name: 'Almoxarifado Central', description: 'Centro de custo do almoxarifado central', department: 'Almoxarifado', responsible: 'Roberto Silva', monthlyBudget: 8000.00, annualBudget: 96000.00 },
      { code: 'SEG001', name: 'Segurança do Trabalho', description: 'Centro de custo de segurança', department: 'Segurança', responsible: 'Carla Rodrigues', monthlyBudget: 3000.00, annualBudget: 36000.00 }
    ];

    for (const cc of costCentersData) {
      await sql`
        INSERT INTO cost_centers (code, name, description, department, responsible, monthly_budget, annual_budget, is_active, owner_id, created_at)
        VALUES (${cc.code}, ${cc.name}, ${cc.description}, ${cc.department}, ${cc.responsible}, ${cc.monthlyBudget}, ${cc.annualBudget}, true, ${TESTE3_OWNER_ID}, NOW())
        ON CONFLICT (code, owner_id) DO NOTHING
      `;
    }

    // 7. Buscar IDs das categorias e fornecedores criados
    const categories = await sql`SELECT * FROM categories WHERE owner_id = ${TESTE3_OWNER_ID}`;
    const suppliers = await sql`SELECT * FROM suppliers WHERE owner_id = ${TESTE3_OWNER_ID}`;
    const employees = await sql`SELECT * FROM employees WHERE owner_id = ${TESTE3_OWNER_ID}`;
    const costCenters = await sql`SELECT * FROM cost_centers WHERE owner_id = ${TESTE3_OWNER_ID}`;

    // 8. Criar materiais
    console.log('📦 Criando materiais...');
    const materialsData = [
      { name: 'Martelo de Unha 20oz', description: 'Martelo profissional com cabo de madeira', unit: 'unidade', category: 'Ferramentas Manuais', minStock: 5, currentStock: 0 },
      { name: 'Furadeira de Impacto 1/2"', description: 'Furadeira elétrica com impacto 850W', unit: 'unidade', category: 'Equipamentos Elétricos', minStock: 2, currentStock: 0 },
      { name: 'Cimento CP-II 50kg', description: 'Saco de cimento Portland comum', unit: 'saco', category: 'Materiais de Construção', minStock: 10, currentStock: 0 },
      { name: 'Capacete de Segurança', description: 'Capacete EPI classe A', unit: 'unidade', category: 'EPIs', minStock: 20, currentStock: 0 },
      { name: 'Cano PVC 100mm', description: 'Tubo PVC soldável 6 metros', unit: 'metro', category: 'Materiais Hidráulicos', minStock: 50, currentStock: 0 },
      { name: 'Chave de Fenda Phillips', description: 'Chave fenda cabo plástico', unit: 'unidade', category: 'Ferramentas Manuais', minStock: 10, currentStock: 0 },
      { name: 'Luvas de Segurança', description: 'Luvas nitrílicas descartáveis', unit: 'par', category: 'EPIs', minStock: 100, currentStock: 0 },
      { name: 'Conexão Joelho 90° PVC', description: 'Joelho 90 graus 100mm', unit: 'unidade', category: 'Materiais Hidráulicos', minStock: 20, currentStock: 0 }
    ];

    for (const mat of materialsData) {
      const category = categories.find(c => c.name === mat.category);
      if (category) {
        await sql`
          INSERT INTO materials (name, description, unit, category_id, min_stock, current_stock, unit_price, owner_id, created_at)
          VALUES (${mat.name}, ${mat.description}, ${mat.unit}, ${category.id}, ${mat.minStock}, ${mat.currentStock}, 0, ${TESTE3_OWNER_ID}, NOW())
          ON CONFLICT (name, owner_id) DO NOTHING
        `;
      }
    }

    const materials = await sql`SELECT * FROM materials WHERE owner_id = ${TESTE3_OWNER_ID}`;

    // 9. Criar movimentações de entrada
    console.log('📥 Criando entradas de estoque...');
    const entriesData = [
      { material: 'Martelo de Unha 20oz', supplier: 'Ferragens Central', quantity: 20, unitPrice: 35.50, costCenter: 'MANUT001' },
      { material: 'Furadeira de Impacto 1/2"', supplier: 'Ferragens Central', quantity: 5, unitPrice: 285.90, costCenter: 'MANUT001' },
      { material: 'Cimento CP-II 50kg', supplier: 'Materiais de Construção Norte', quantity: 50, unitPrice: 28.75, costCenter: 'PROD001' },
      { material: 'Capacete de Segurança', supplier: 'Distribuidora de EPIs Premium', quantity: 100, unitPrice: 18.50, costCenter: 'SEG001' },
      { material: 'Cano PVC 100mm', supplier: 'Materiais de Construção Norte', quantity: 120, unitPrice: 45.80, costCenter: 'PROD001' },
      { material: 'Chave de Fenda Phillips', supplier: 'Ferragens Central', quantity: 25, unitPrice: 12.30, costCenter: 'MANUT001' },
      { material: 'Luvas de Segurança', supplier: 'Distribuidora de EPIs Premium', quantity: 200, unitPrice: 8.90, costCenter: 'SEG001' },
      { material: 'Conexão Joelho 90° PVC', supplier: 'Materiais de Construção Norte', quantity: 80, unitPrice: 15.25, costCenter: 'PROD001' }
    ];

    for (const entry of entriesData) {
      const material = materials.find(m => m.name === entry.material);
      const supplier = suppliers.find(s => s.name === entry.supplier);
      const costCenter = costCenters.find(cc => cc.code === entry.costCenter);
      
      if (material && supplier && costCenter) {
        const totalValue = entry.quantity * entry.unitPrice;
        
        await sql`
          INSERT INTO material_movements (
            type, material_id, quantity, unit_price, total_value, 
            supplier_id, cost_center_id, date, notes, owner_id, created_at
          ) VALUES (
            'entry', ${material.id}, ${entry.quantity}, ${entry.unitPrice}, ${totalValue},
            ${supplier.id}, ${costCenter.id}, NOW(), 'Entrada inicial de estoque', ${TESTE3_OWNER_ID}, NOW()
          )
        `;

        // Atualizar estoque do material
        await sql`
          UPDATE materials 
          SET current_stock = current_stock + ${entry.quantity}, unit_price = ${entry.unitPrice}
          WHERE id = ${material.id}
        `;
      }
    }

    // 10. Criar algumas saídas de teste
    console.log('📤 Criando saídas de estoque...');
    const exitsData = [
      { material: 'Martelo de Unha 20oz', employee: 'Pedro Monteiro', quantity: 2, costCenter: 'MANUT001' },
      { material: 'Capacete de Segurança', employee: 'Ana Costa', quantity: 5, costCenter: 'PROD001' },
      { material: 'Luvas de Segurança', employee: 'Carla Rodrigues', quantity: 20, costCenter: 'SEG001' },
      { material: 'Chave de Fenda Phillips', employee: 'Roberto Silva', quantity: 3, costCenter: 'ALMO001' }
    ];

    for (const exit of exitsData) {
      const material = materials.find(m => m.name === exit.material);
      const employee = employees.find(e => e.name === exit.employee);
      const costCenter = costCenters.find(cc => cc.code === exit.costCenter);
      
      if (material && employee && costCenter && material.current_stock >= exit.quantity) {
        const totalValue = exit.quantity * material.unit_price;
        
        await sql`
          INSERT INTO material_movements (
            type, material_id, quantity, unit_price, total_value,
            destination_employee_id, cost_center_id, date, notes, owner_id, created_at
          ) VALUES (
            'exit', ${material.id}, ${exit.quantity}, ${material.unit_price}, ${totalValue},
            ${employee.id}, ${costCenter.id}, NOW(), 'Saída para funcionário', ${TESTE3_OWNER_ID}, NOW()
          )
        `;

        // Atualizar estoque do material
        await sql`
          UPDATE materials 
          SET current_stock = current_stock - ${exit.quantity}
          WHERE id = ${material.id}
        `;
      }
    }

    console.log('✅ População de dados concluída com sucesso!');
    console.log(`📊 Dados criados para usuário teste3 (ID: ${TESTE3_OWNER_ID}):`);
    console.log(`   - ${categoriesData.length} categorias`);
    console.log(`   - ${suppliersData.length} fornecedores`);
    console.log(`   - ${employeesData.length} funcionários`);
    console.log(`   - ${thirdPartiesData.length} terceiros`);
    console.log(`   - ${costCentersData.length} centros de custo`);
    console.log(`   - ${materialsData.length} materiais`);
    console.log(`   - ${entriesData.length} entradas de estoque`);
    console.log(`   - ${exitsData.length} saídas de estoque`);

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    await sql.end();
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateTeste3Data();
}

export { populateTeste3Data };