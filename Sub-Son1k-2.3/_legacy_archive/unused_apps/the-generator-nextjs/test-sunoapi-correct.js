const API_KEY = 'sk_ac7f85135fe548d58e41e9a75048c437';
const BASE_URL = 'https://api.sunoapi.com';

console.log('🔍 Probando sunoapi.com con endpoints correctos...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// 1. Obtener información de la cuenta
async function getAccountInfo() {
  console.log('1️⃣ Obteniendo información de cuenta...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Cuenta:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const error = await response.text();
      console.log(`   ⚠️  Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

// 2. Generar música de prueba
async function testGenerate() {
  console.log('2️⃣ Probando generación de música...');
  
  const payload = {
    prompt: 'indie rock, melancholic, male vocals',
    customMode: false,
    instrumental: false,
    model: 'V3_5'
  };
  
  console.log(`   Payload: ${JSON.stringify(payload)}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log('   Respuesta:', JSON.stringify(data, null, 2));
    
    if (data.code === 200) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ¡FUNCIONA! API key válida');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📊 Task ID:', data.data?.task_id || data.data);
      console.log('');
      return true;
    } else if (data.code === 402) {
      console.log('');
      console.log('⚠️  API key válida pero sin créditos');
      console.log('   Necesitas recargar créditos en sunoapi.com');
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  return false;
}

// 3. Obtener límites
async function getLimits() {
  console.log('3️⃣ Obteniendo límites de cuenta...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/get_limit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Límites:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const error = await response.text();
      console.log(`   ⚠️  ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  await getAccountInfo();
  await getLimits();
  await testGenerate();
}

main();
