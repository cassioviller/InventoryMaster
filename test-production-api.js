/**
 * Script para testar API de produção e verificar funcionamento
 */

const https = require('https');
const http = require('http');

// Configure sua URL de produção aqui
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://your-production-url.com';

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PRODUCTION_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testProductionAPI() {
  console.log('🧪 Testando API de produção...');
  console.log(`🌐 URL: ${PRODUCTION_URL}`);

  try {
    // 1. Teste de login
    console.log('\n1️⃣ Testando login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      username: 'teste3',
      password: 'teste3'
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Falha no login:', loginResponse);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Teste de centros de custo
    console.log('\n2️⃣ Testando centros de custo...');
    const costCentersResponse = await makeRequest('/api/cost-centers', 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    
    console.log(`📊 Centros de custo: ${costCentersResponse.status}`, costCentersResponse.data);

    // 3. Teste de relatório financeiro
    console.log('\n3️⃣ Testando relatório financeiro...');
    const financialResponse = await makeRequest('/api/reports/financial-stock', 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    
    console.log(`📈 Relatório financeiro: ${financialResponse.status}`, financialResponse.data);

    // 4. Teste de movimentações
    console.log('\n4️⃣ Testando movimentações...');
    const movementsResponse = await makeRequest('/api/reports/general-movements', 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    
    console.log(`📋 Movimentações: ${movementsResponse.status}`, movementsResponse.data);

    // 5. Teste de materiais
    console.log('\n5️⃣ Testando materiais...');
    const materialsResponse = await makeRequest('/api/materials', 'GET', null, {
      Authorization: `Bearer ${token}`
    });
    
    console.log(`📦 Materiais: ${materialsResponse.status}`, materialsResponse.data);

    console.log('\n🎉 Testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testProductionAPI();
}

module.exports = { testProductionAPI };