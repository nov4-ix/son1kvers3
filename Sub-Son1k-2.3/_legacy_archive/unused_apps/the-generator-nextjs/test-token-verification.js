const API_KEY = 'sk_ac7f85135fe548d58e41e9a75048c437';
const TEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJQOHBPOFlsMkY2a0VWYk9FOG92WVpubUNuM2NWV3UwbCIsImV4cCI6MTc2MTE0ODM4N30.EyaBW8uvRrUnjczdHnIPZae7Taw9j_bMlXGm3zMe2fc';

console.log('🔍 Probando verificación de tokens...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const verificationEndpoints = [
  {
    name: 'Verify Token',
    url: 'https://api.sunoapi.com/api/verify',
    method: 'POST',
    body: { token: TEST_TOKEN }
  },
  {
    name: 'Validate Token',
    url: 'https://api.sunoapi.com/api/validate',
    method: 'POST',
    body: { token: TEST_TOKEN }
  },
  {
    name: 'Check Token',
    url: 'https://api.sunoapi.com/api/check_token',
    method: 'POST',
    body: { suno_cookie: TEST_TOKEN }
  },
  {
    name: 'Get Limit (with token)',
    url: 'https://api.sunoapi.com/api/get_limit',
    method: 'GET',
    headers: {
      'suno-cookie': TEST_TOKEN
    }
  },
  {
    name: 'Account Info (with token)',
    url: 'https://api.sunoapi.com/api/account',
    method: 'GET',
    headers: {
      'authorization': `Bearer ${TEST_TOKEN}`
    }
  }
];

async function testVerification(endpoint) {
  console.log(`🔍 ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  console.log(`   Método: ${endpoint.method}`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'api-key': API_KEY,
        'Content-Type': 'application/json',
        ...endpoint.headers
      }
    };
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(endpoint.url, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok || response.status === 402 || response.status === 429) {
      const data = await response.text();
      console.log(`   ✅ RESPUESTA:`);
      console.log(`   ${data.substring(0, 500)}`);
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ¡ENDPOINT DE VERIFICACIÓN ENCONTRADO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return true;
    } else if (response.status !== 404 && response.status !== 405) {
      const error = await response.text();
      console.log(`   ⚠️  ${error.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  return false;
}

async function main() {
  console.log('🎯 Objetivo: Encontrar endpoint para verificar SUNO_COOKIE');
  console.log('');
  
  for (const endpoint of verificationEndpoints) {
    const works = await testVerification(endpoint);
    if (works) {
      return;
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 La API key puede ser para:');
  console.log('   1. Dashboard/Panel de control');
  console.log('   2. Sistema de gestión de tokens');
  console.log('   3. Otro servicio');
  console.log('');
  console.log('🔍 ¿Tienes documentación de esta API key?');
  console.log('   ¿De qué servicio es específicamente?');
  console.log('');
}

main();
