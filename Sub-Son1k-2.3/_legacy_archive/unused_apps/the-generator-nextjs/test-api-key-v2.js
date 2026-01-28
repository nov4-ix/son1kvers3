const API_KEY = 'sk_ac7f85135fe548d58e41e9a75048c437';

console.log('🔍 Probando API Key con diferentes métodos...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Intentar obtener información de la cuenta
async function testAccountInfo() {
  const endpoints = [
    'https://api.sunoapi.com/api/get_limit',
    'https://api.sunoapi.com/v1/account',
    'https://api.sunoapi.com/api/account',
    'https://api.sunoapi.com/v1/credits',
    'https://api.sunoapi.com/api/credits'
  ];
  
  for (const url of endpoints) {
    console.log(`🔍 GET ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`   ✅ RESPUESTA: ${data}`);
        console.log('');
        return true;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  return false;
}

// Probar generación con diferentes formatos
async function testGenerate() {
  const endpoints = [
    { url: 'https://api.sunoapi.com/api/custom_generate', method: 'POST' },
    { url: 'https://api.sunoapi.com/api/generate', method: 'POST' },
    { url: 'https://api.sunoapi.com/v1/music/generate', method: 'POST' }
  ];
  
  const payloads = [
    {
      prompt: "indie rock, melancholic",
      make_instrumental: false,
      wait_audio: false
    },
    {
      gpt_description_prompt: "indie rock, melancholic",
      prompt: "",
      make_instrumental: false,
      mv: "chirp-v3-5"
    },
    {
      title: "Test",
      tags: "indie rock, melancholic",
      prompt: "[Verse]\nTest lyrics here",
      continue_at: null,
      continue_clip_id: null
    }
  ];
  
  for (const endpoint of endpoints) {
    for (const payload of payloads) {
      console.log(`🔍 ${endpoint.method} ${endpoint.url}`);
      console.log(`   Payload: ${JSON.stringify(payload).substring(0, 80)}...`);
      
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'api-key': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok || response.status === 402 || response.status === 201) {
          const data = await response.text();
          console.log(`   ✅ RESPUESTA: ${data.substring(0, 300)}...`);
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ ¡ENDPOINT FUNCIONA!');
          console.log(`   URL: ${endpoint.url}`);
          console.log(`   Método: ${endpoint.method}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          return true;
        } else if (response.status !== 405) {
          const error = await response.text();
          console.log(`   ⚠️  ${error.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }
  }
  
  return false;
}

async function main() {
  console.log('1️⃣ Probando endpoints de información de cuenta...');
  console.log('');
  const accountWorks = await testAccountInfo();
  
  if (accountWorks) {
    console.log('✅ API Key válida!');
    return;
  }
  
  console.log('2️⃣ Probando endpoints de generación...');
  console.log('');
  const generateWorks = await testGenerate();
  
  if (!generateWorks) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ No se pudo conectar con ningún endpoint');
    console.log('');
    console.log('💡 La API key puede ser de:');
    console.log('   - Suno oficial (necesita endpoints específicos)');
    console.log('   - SunoAPI.com (servicio de terceros)');
    console.log('   - Otro proveedor');
    console.log('');
    console.log('🔍 ¿De dónde obtuviste esta API key?');
  }
}

main();
