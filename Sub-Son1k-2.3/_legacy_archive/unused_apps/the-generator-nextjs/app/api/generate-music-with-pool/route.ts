  import { NextRequest, NextResponse } from 'next/server'
import { getTokenPoolManager } from '@/lib/token-pool-manager'

export async function POST(request: NextRequest) {
  try {
    const poolManager = getTokenPoolManager()
    
    // Verificar autenticación del usuario
    const authHeader = request.headers.get('authorization')
    let userInfo
    if (!authHeader) {
      if (process.env.NODE_ENV !== 'production') {
        userInfo = { email: 'test@example.com', tier: 'dev' };
        console.log('🔧 Modo desarrollo: Asignando usuario de prueba');
      } else {
        return NextResponse.json({
          error: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para generar música'
        }, { status: 401 })
      }
    } else {
      try {
        userInfo = JSON.parse(authHeader)
      } catch {
        return NextResponse.json({
          error: 'INVALID_AUTH',
          message: 'Información de autenticación inválida'
        }, { status: 401 })
      }
    }

    console.log('👤 Usuario autenticado:', userInfo.email, 'Tier:', userInfo.tier)
    
    // Verificar si el servicio está habilitado
    if (!poolManager.isServiceEnabled()) {
      return NextResponse.json({
        error: 'SERVICE_DISABLED',
        message: 'El servicio está temporalmente deshabilitado por falta de tokens. Contacta al administrador.',
        serviceEnabled: false
      }, { status: 503 })
    }

    const body = await request.json()
    const { prompt, lyrics, voice, instrumental } = body

    if (!prompt && !lyrics) {
      return NextResponse.json({ error: 'Prompt o lyrics requeridos' }, { status: 400 })
    }

    // Obtener token del pool
    const token = await poolManager.getAvailableToken()
    if (!token) {
      return NextResponse.json({
        error: 'NO_TOKENS_AVAILABLE',
        message: 'No hay tokens disponibles en el pool',
        serviceEnabled: false
      }, { status: 503 })
    }

    console.log('🎵 Generando música con pool de tokens...')

    // Traducir el estilo musical a inglés (tanto generado como manual)
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    let baseStyle = lyrics?.trim() || ''

    // Crear prompt interpretando solo la configuración de voz/instrumental
    let interpretedPrompt = baseStyle

    // Interpretar configuración de voz
    let voiceContext = ''
    if (!instrumental) {
      if (voice === 'male') voiceContext = 'male vocals'
      else if (voice === 'female') voiceContext = 'female vocals'
      else if (voice === 'random') voiceContext = 'vocal variety'
    } else {
      voiceContext = 'instrumental only'
    }

    // Combinar estilo base + contexto de voz
    const contextParts = []
    if (baseStyle) contextParts.push(baseStyle)
    if (voiceContext) contextParts.push(voiceContext)

    interpretedPrompt = contextParts.join(', ')

    console.log('🎤 Interpretación de configuración de voz:')
    console.log('  - Estilo base:', baseStyle)
    console.log('  - Contexto de voz:', voiceContext)
    console.log('  - Prompt interpretado:', interpretedPrompt)

    // Traducir el prompt interpretado a inglés
    let translatedStyle = interpretedPrompt

    if (GROQ_API_KEY && interpretedPrompt) {
      try {
        console.log('🌐 Traduciendo prompt interpretado al inglés...');
        const translateResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{
              role: 'user',
              content: `Translate this music style description to English. Keep the same style and technical details. ONLY return the translation, no explanations:\n\n"${interpretedPrompt}"`
            }],
            max_tokens: 200,
            temperature: 0.3
          })
        });

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          if (translateData.choices && translateData.choices.length > 0) {
            translatedStyle = translateData.choices[0].message.content.trim();
          } else {
            console.warn('⚠️ Sin respuesta de traducción, usando estilo original');
            translatedStyle = interpretedPrompt;
          }
          // Limpieza del estilo traducido
          translatedStyle = translatedStyle.replace(/\*\*[^*]+\*\*/g, '');
          translatedStyle = translatedStyle.replace(/para Suno AI/gi, '');
          translatedStyle = translatedStyle.replace(/^['"\s\n:]+|['"\s\n:]+$/g, '');
          translatedStyle = translatedStyle.replace(/\n+/g, ' ');
          translatedStyle = translatedStyle.trim();

          console.log('✅ Estilo traducido y limpio:', translatedStyle.substring(0, 100) + '...');

          if (translatedStyle.length > 100) {
            console.log('📝 Resumiendo estilo largo...');
            try {
              const summarizeResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
                body: JSON.stringify({
                  model: 'llama-3.1-8b-instant',
                  messages: [{
                    role: 'user',
                    content: `Summarize this music style description to maximum 80 characters, keeping only the most important elements (genre, mood, tempo, production, vocals). Use commas to separate. NO explanations, just the summary:\n\n"${translatedStyle}"`
                  }],
                  max_tokens: 50,
                  temperature: 0.3
                })
              });

              if (summarizeResponse.ok) {
                const summarizeData = await summarizeResponse.json();
                if (summarizeData.choices && summarizeData.choices.length > 0) {
                  const summarizedStyle = summarizeData.choices[0].message.content.trim();
                  translatedStyle = summarizedStyle.replace(/^['"\s\n:]+|['"\s\n:]+$/g, '').trim();
                  console.log('✅ Estilo resumido:', translatedStyle);
                } else {
                  console.warn('⚠️ Sin respuesta de resumen, usando estilo completo');
                }
              } else {
                console.warn('⚠️ Error en resumen, usando estilo completo');
              }
            } catch (error) {
              console.log('⚠️ Error resumiendo, usando estilo completo', error);
            }
          }
        } else {
          console.warn('⚠️ Error en traducción, usando estilo original');
          translatedStyle = interpretedPrompt;
        }
      } catch (error) {
        console.log('⚠️ Error traduciendo, usando estilo original:', error);
        translatedStyle = interpretedPrompt;
      }
    } else {
      console.log('⚠️ GROQ_API_KEY no configurada o estilo vacío')
    }

    // Payload FINAL: Todo concatenado en prompt con estilo al principio
    const finalPrompt = instrumental
      ? `[${translatedStyle}]`
      : `[${translatedStyle}]\n\n${prompt?.trim() || ""}`

    const payload = {
      prompt: finalPrompt,
      lyrics: "",
      title: "",
      customMode: !instrumental && prompt?.trim().length > 0,
      instrumental: instrumental,
      gender: instrumental ? "" : (voice === 'male' ? 'male' : voice === 'female' ? 'female' : '')
    }
    
    console.log('🚀 Enviando a Suno con pool de tokens...')
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))
    
    // Usar el token del pool para la llamada a Suno
    const sunoResponse = await fetch('https://ai.imgkits.com/suno/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': token, // Token del pool
        'channel': 'node-api',
        'origin': 'https://www.livepolls.app',
        'referer': 'https://www.livepolls.app/',
      },
      body: JSON.stringify(payload)
    })
    
    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text()
      console.error('❌ Error de Suno:', sunoResponse.status, errorText)
      
      // Si es error 401 (token inválido), marcar token como inactivo
      if (sunoResponse.status === 401) {
        await poolManager.markTokenInactive(token)
        console.log('⚠️ Token marcado como inactivo por error 401')
      }
      
      throw new Error(`Suno API error: ${sunoResponse.status} - ${errorText}`)
    }

    const sunoData = await sunoResponse.json()
    console.log('✅ Respuesta de Suno:', sunoData)

    // Marcar token como usado
    await poolManager.markTokenUsed(token)
    
    return NextResponse.json({ 
      success: true,
      taskId: sunoData.taskId,
      message: 'Música generada exitosamente con pool de tokens'
    })

  } catch (error) {
    console.error('❌ Error en generate-music-with-pool:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
