// Teste simples para validar a autenticação
const bcrypt = require('bcrypt');

async function testAuth() {
  const password = '1234';
  const hash = '$2b$10$w5zqx2EK3RXMcEd4dCOShOh6HI736YgEO5jq7Gfr0wSAPl/Dowl66';
  
  console.log('Testing bcrypt comparison...');
  const result = await bcrypt.compare(password, hash);
  console.log('Bcrypt result:', result);
  
  // Test JSON parsing
  const testBody = '{"username":"cassio","password":"1234"}';
  const parsed = JSON.parse(testBody);
  console.log('Parsed JSON:', parsed);
}

testAuth().catch(console.error);