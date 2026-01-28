import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎤 API generate-lyrics LLAMADA')
  try {
    const body = await req.json()
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2))
    const { input } = body
    if (!input?.trim()) {
      console.log('❌ Input vacío')
      return NextResponse.json({ error: 'Input requerido' }, { status: 400 })
    }
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    console.log('🔑 GROQ_API_KEY:', GROQ_API_KEY ? '✅ Configurada' : '❌ NO configurada')
    if (!GROQ_API_KEY) return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
    console.log('📤 Llamando a Groq API...')
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: `Crea letra de canción completa basada en: "${input}"\n\nREGLAS OBLIGATORIAS:\n1. EMPIEZA DIRECTO con [Verse 1] - NO escribas título, NO escribas intro con letra\n2. Usa SOLO estas etiquetas: [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]\n3. NO uses markdown (**), NO uses títulos, NO uses paréntesis ()\n4. Solo letra pura cantable\n5. ⚠️ CRÍTICO: LÍNEAS CORTAS (máximo 6-8 palabras por línea)\n6. Versos respirables, NO atropellados\n7. Cada línea debe ser cantable en 2-3 segundos\n\nESTRUCTURA EXACTA:\n\n[Verse 1]\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\n\n[Chorus]\nlínea corta y pegajosa\nlínea corta y pegajosa\nlínea corta y pegajosa\n\n[Verse 2]\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\n\n[Chorus]\n\n[Bridge]\nlínea corta (6-8 palabras)\nlínea corta (6-8 palabras)\n\n[Chorus]\n\n[Outro]\nlínea final corta\n\nEJEMPLOS DE LÍNEAS CORRECTAS:\n✅ "El viento sopla fuerte hoy"\n✅ "No puedo olvidar tu voz"\n✅ "Dancing under the moonlight"\n\nEJEMPLOS DE LÍNEAS INCORRECTAS (MUY LARGAS):\n❌ "El viento sopla tan fuerte que me lleva lejos de aquí"\n❌ "No puedo dejar de pensar en todo lo que vivimos juntos"\n\nEMPIEZA DIRECTAMENTE CON [Verse 1]. Nada antes. LÍNEAS CORTAS Y CANTABLES.` }],
        max_tokens: 1200,
        temperature: 0.9
      })
    })
    console.log('📊 Groq Status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Groq Error:', errorText)
      throw new Error('Error Groq API')
    }
    const data = await response.json()
    let lyrics = data.choices[0].message.content.trim()
    
    // Limpiar cualquier cosa antes de [Verse 1]
    const verse1Index = lyrics.indexOf('[Verse 1]')
    if (verse1Index > 0) {
      lyrics = lyrics.substring(verse1Index)
    }
    
    // Limpiar formato extra
    lyrics = lyrics.replace(/^\*\*.*?\*\*\s*/gm, '')
    lyrics = lyrics.replace(/^#.*$/gm, '')
    lyrics = lyrics.replace(/\(.*?\)/g, '')
    lyrics = lyrics.replace(/^Canción:.*$/gm, '')
    lyrics = lyrics.replace(/^\[Intro\][\s\S]*?(?=\[Verse 1\])/m, '')
    
    // ✂️ NUEVO: Acortar líneas largas (más de 10 palabras)
    lyrics = lyrics.split('\n').map(line => {
      // No modificar etiquetas como [Verse 1], [Chorus], etc
      if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
        return line
      }
      
      // No modificar líneas vacías
      if (!line.trim()) {
        return line
      }
      
      const words = line.trim().split(/\s+/)
      
      // Si la línea tiene más de 10 palabras, dividirla
      if (words.length > 10) {
        console.log(`⚠️ Línea larga detectada (${words.length} palabras): "${line.trim()}"`)
        
        // Dividir en chunks de máximo 8 palabras
        const chunks = []
        for (let i = 0; i < words.length; i += 8) {
          chunks.push(words.slice(i, i + 8).join(' '))
        }
        
        console.log(`✂️ Dividida en ${chunks.length} líneas cortas`)
        return chunks.join('\n')
      }
      
      return line
    }).join('\n')
    
    console.log('✅ Letra generada, limpiada y optimizada')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json({ lyrics: lyrics.trim(), success: true })
  } catch (error: any) {
    console.log('❌ ERROR:', error.message)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
