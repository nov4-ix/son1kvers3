const API_KEY = 'sk_ac7f85135fe548d58e41e9a75048c437';

console.log('🎯 Probando API key de sunoapi.com correctamente...');
console.log('');

async function testGenerate() {
  try {
    const response = await fetch('https://api.sunoapi.com/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'indie rock, melancholic, male vocals',
        customMode: false,
        instrumental: false
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.code === 200) {
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 ¡API KEY FUNCIONA PERFECTAMENTE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('💡 Conclusión:');
        console.log('   Esta API key es de sunoapi.com (servicio de terceros)');
        console.log('   NO es para verificar SUNO_COOKIE');
        console.log('   Es una alternativa completa al modelo actual');
        console.log('');
        console.log('📝 Opciones:');
        console.log('   1. Usar esta API key como solución principal');
        console.log('   2. Mantener el modelo actual (SUNO_COOKIE)');
        console.log('   3. Sistema híbrido: ambos en paralelo');
        return true;
      }
    } else {
      const error = await response.text();
      console.log('⚠️  Error:', error);
      
      if (response.status === 402) {
        console.log('');
        console.log('💳 API key válida pero sin créditos');
        console.log('   Necesitas recargar en sunoapi.com');
      } else if (response.status === 401) {
        console.log('');
        console.log('❌ API key inválida o expirada');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  return false;
}

testGenerate();
