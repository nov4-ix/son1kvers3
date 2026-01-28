// Test de API Key
const API_KEY = 'sk_ac7f85135fe548d58e41e9a75048c437';

console.log('🔍 Probando API Key...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Intentar diferentes endpoints posibles
const endpoints = [
  {
    name: 'SunoAPI.com',
    url: 'https://api.sunoapi.com/v1/generate',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'SunoAPI.com (alt)',
    url: 'https://api.sunoapi.com/api/generate',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'SunoAPI.com (v2)',
    url: 'https://api.sunoapi.com/v2/music/generate',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Suno Official',
    url: 'https://api.suno.ai/v1/generate',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
];

const testPayload = {
  prompt: "indie rock, melancholic, male vocals",
  title: "Test Song",
  make_instrumental: false,
  wait_audio: false
};

async function testEndpoint(endpoint) {
  console.log(`🔍 Probando: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify(testPayload)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok || response.status === 402 || response.status === 429) {
      const data = await response.text();
      console.log(`   ✅ ENDPOINT VÁLIDO!`);
      console.log(`   Response: ${data.substring(0, 200)}...`);
      return { success: true, endpoint, response: data };
    } else {
      console.log(`   ❌ No válido`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  return null;
}

async function testAll() {
  console.log('🚀 Probando todos los endpoints...');
  console.log('');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✅ ¡API KEY FUNCIONA!');
      console.log('');
      console.log('📊 Información:');
      console.log(`   Servicio: ${result.endpoint.name}`);
      console.log(`   Endpoint: ${result.endpoint.url}`);
      console.log('');
      console.log('🎯 Próximo paso:');
      console.log('   Integrar este endpoint en The Generator');
      console.log('');
      return;
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('❌ No se encontró endpoint válido');
  console.log('');
  console.log('💡 Opciones:');
  console.log('   1. Verifica que la API key esté activa');
  console.log('   2. Consulta la documentación del proveedor');
  console.log('   3. Verifica el formato correcto de la request');
  console.log('');
}

testAll();
