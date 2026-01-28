import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✨ API generator-prompt LLAMADA')
  try {
    const body = await req.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))
    const { input } = body
    if (!input?.trim()) {
      console.log('❌ Input vacío')
      return NextResponse.json({ error: 'Input requerido' }, { status: 400 })
    }
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    console.log('🔑 GROQ_API_KEY:', GROQ_API_KEY ? '✅' : '❌')
    if (!GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
    console.log('📤 Llamando Groq...')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: `Genera un prompt descriptivo de estilo musical para Suno AI basado en: "${input}"\n\nFORMATO REQUERIDO:\nUna descripción rica y expresiva del estilo musical, separada por comas.\n\nINCLUYE (en este orden):\n1. Género principal + sub-género (ej: indie rock punk, dream pop ethereal, trap dark)\n2. Mood/emoción específica (ej: melancholic introspection, energetic rebellion, dark atmospheric)\n3. Características instrumentales (ej: distorted electric guitars, deep bass lines, vintage synths)\n4. Tempo y ritmo (ej: mid-tempo driving, slow contemplative, fast aggressive)\n5. Producción y textura (ej: lo-fi warm, polished crisp, raw garage, atmospheric reverb)\n\nREGLAS:\n- MÁXIMO 15-20 palabras TOTALES\n- UNA SOLA línea, NO múltiples opciones\n- Sé descriptivo pero conciso\n- Sin artículos (el, la, un, the, a)\n- Sin verbos, solo adjetivos y sustantivos\n- NO menciones bandas o artistas\n- Responde SOLO con los tags separados por comas\n\nEJEMPLOS PERFECTOS:\n"indie rock punk, melancholic rebellion, distorted guitars, mid-tempo driving, raw garage production"\n"dream pop ethereal, atmospheric introspection, vintage synths, slow contemplative, warm lo-fi textures"\n"trap dark, aggressive energy, heavy bass lines, fast-paced, polished crisp production"\n\nRespuesta (solo UNA línea descriptiva):` }],
        max_tokens: 80,
        temperature: 0.85
      })
    })
    console.log('📊 Status:', response.status)
    if (!response.ok) throw new Error('Error Groq API')
    const data = await response.json()
    let cleanPrompt = data.choices[0].message.content.trim()
    
    // Limpiar formato markdown y prefijos AGRESIVAMENTE
    cleanPrompt = cleanPrompt.replace(/^\*\*[^*]+\*\*:?\s*/gm, '') // **TITULO**: en CUALQUIER línea
    cleanPrompt = cleanPrompt.replace(/^["'"\n\s]+|["'"\n\s]+$/g, '') // Comillas y espacios inicio/fin
    cleanPrompt = cleanPrompt.replace(/^PROMPT.*?:\s*/gi, '') // "PROMPT para Suno"
    cleanPrompt = cleanPrompt.replace(/^([""])(.+)\1$/g, '$2') // Comillas que envuelven todo
    cleanPrompt = cleanPrompt.replace(/\n\n+/g, ' ') // Múltiples saltos → espacio
    cleanPrompt = cleanPrompt.trim()
    
    // ✅ LIMITAR A 180 CARACTERES MÁXIMO
    if (cleanPrompt.length > 180) {
      console.log(`⚠️ Prompt truncado: ${cleanPrompt.length} → 180 caracteres`)
      cleanPrompt = cleanPrompt.substring(0, 180)
    }
    
    console.log('✅ Prompt descriptivo generado')
    console.log(`🎨 Estilo (${cleanPrompt.length} chars):`, cleanPrompt)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json({ prompt: cleanPrompt, success: true })
  } catch (error: any) {
    console.log('❌ ERROR:', error.message)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
