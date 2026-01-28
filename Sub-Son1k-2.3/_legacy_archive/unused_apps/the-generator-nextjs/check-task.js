const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJWaGJvd2hsdDhHUTlxeWIxcE1JTTZrdWRla1puQ0J1NCIsImV4cCI6MTc2MDkyODU0N30.hlJyplPqU74aoaJFsAGlQQfvdd36vNDt9-4jvmLHnhw";
const taskId = "3fjmw9nrz";

(async () => {
  const res = await fetch(`https://usa.imgkits.com/node-api/suno/get_mj_status/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'channel': 'node-api',
      'Content-Type': 'application/json'
    }
  });
  const json = await JSON.parse(await res.text());
  
  if (json.code === 200 && json.data && json.data.data) {
    console.log('✅ ¡COMPLETADO! URLs:');
    json.data.data.forEach((t, i) => console.log(`   ${i+1}. ${t.audio_url}`));
  } else if (json.running) {
    console.log('⏳ Aún procesando...');
  } else {
    console.log('🤔 Estado:', JSON.stringify(json, null, 2));
  }
})();
