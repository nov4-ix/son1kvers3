import { NextRequest, NextResponse } from 'next/server'
import { getTokenPoolManager } from '@/lib/token-pool-manager'

export async function POST(request: NextRequest) {
    try {
        // 1. Autenticación y Validación Básica
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const poolManager = getTokenPoolManager()
        if (!poolManager.isServiceEnabled()) {
            return NextResponse.json({
                error: 'Service Unavailable',
                message: 'Token pool depleted'
            }, { status: 503 })
        }

        // 2. Parsear Body
        const body = await request.json()
        const { audio_url, prompt, style, customMode } = body

        if (!audio_url) {
            return NextResponse.json({ error: 'Audio URL is required for cover generation' }, { status: 400 })
        }

        console.log('👻 GHOST STUDIO: Iniciando generación de cover')
        console.log('   Audio:', audio_url)
        console.log('   Prompt:', prompt)

        // 3. Traducción de Prompt (Groq)
        const GROQ_API_KEY = process.env.GROQ_API_KEY
        let finalPrompt = prompt

        if (GROQ_API_KEY && prompt) {
            try {
                console.log('🌐 Traduciendo prompt con Groq...')
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
                            content: `Translate this music prompt to English for an AI music generator. Keep technical terms (BPM, genre). Output ONLY the translation:\n\n"${prompt}"`
                        }],
                        max_tokens: 300,
                        temperature: 0.3
                    })
                })

                if (translateResponse.ok) {
                    const data = await translateResponse.json()
                    finalPrompt = data.choices[0]?.message?.content?.trim() || prompt
                    console.log('✅ Prompt traducido:', finalPrompt)
                }
            } catch (e) {
                console.warn('⚠️ Error en traducción, usando prompt original', e)
            }
        }

        // 4. Obtener Token del Pool
        const token = await poolManager.getAvailableToken()
        if (!token) {
            return NextResponse.json({ error: 'No tokens available' }, { status: 503 })
        }

        // 5. Llamar a Suno API (Endpoint Generate)
        // Nota: Para covers/remixes, Suno suele usar el mismo endpoint 'generate' pero con parámetros de audio
        // O un endpoint específico si es v3.5 audio input. Asumiremos estructura estándar de API no oficial.

        const payload = {
            prompt: finalPrompt,
            tags: style, // A veces se usa tags en lugar de style
            mv: 'chirp-v3-5', // Usar modelo capaz de audio input si disponible
            continue_clip_id: null,
            continue_at: null,
            audio_prompt_id: null, // Si fuera extend, pero es cover...
            // Parámetros específicos para audio upload/cover pueden variar según la implementación de la API proxy
            // Asumiremos que la API proxy maneja 'audio_url' o similar si soporta audio-to-audio
            // Si la API proxy no soporta audio input directo, esto podría fallar o requerir upload previo a Suno.
            // Por ahora enviamos metadata genérica.
        }

        // NOTA CRÍTICA: La API no oficial de Suno (imgkits/similar) a veces requiere subir el audio primero
        // para obtener un ID, y luego usar ese ID.
        // Dado que no tenemos documentación exacta de la API proxy para "Upload Audio",
        // intentaremos pasar el audio_url en el prompt o payload si la API lo soporta.
        // Si no, esto es un placeholder funcional para la lógica de backend.

        // ESTRATEGIA ALTERNATIVA: Si es un "Cover", a menudo es un "Extend" desde 0 o un modo especial.
        // Vamos a asumir que esta implementación específica de backend proxy acepta 'audio_url' en el body
        // y se encarga de la magia (upload a Suno + generate).

        const sunoPayload = {
            ...payload,
            audio_url: audio_url, // Esperando que el proxy maneje esto
            taskType: 'cover' // Hint para el proxy
        }

        console.log('🚀 Enviando a Suno Proxy...')
        const sunoResponse = await fetch('https://ai.imgkits.com/suno/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': token,
                'channel': 'node-api'
            },
            body: JSON.stringify(sunoPayload)
        })

        if (!sunoResponse.ok) {
            if (sunoResponse.status === 401) {
                await poolManager.markTokenInactive(token)
            }
            throw new Error(`Suno API Error: ${sunoResponse.status}`)
        }

        const sunoData = await sunoResponse.json()
        await poolManager.markTokenUsed(token)

        return NextResponse.json({
            success: true,
            data: {
                taskId: sunoData.taskId || sunoData.id,
                status: 'PENDING'
            }
        })

    } catch (error: any) {
        console.error('❌ Error en /api/generation/cover:', error)
        return NextResponse.json({
            success: false,
            error: { message: error.message || 'Internal Server Error' }
        }, { status: 500 })
    }
}
