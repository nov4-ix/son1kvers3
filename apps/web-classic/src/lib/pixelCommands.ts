/**
 * Pixel AI Slash Commands System
 * Powers context-aware commands for different apps
 */

export interface PixelCommand {
    name: string;
    description: string;
    category: 'general' | 'nova-post' | 'generator' | 'ghost-studio' | 'code' | 'memory';
    handler: (args: string[], context: any) => Promise<string>;
    examples: string[];
    requiresAuth?: boolean;
}

export const pixelCommands: Record<string, PixelCommand> = {
    // ========== GENERAL ==========
    help: {
        name: '/help',
        description: 'Muestra todos los comandos disponibles',
        category: 'general',
        handler: async () => {
            const commandList = Object.values(pixelCommands)
                .map(cmd => `${cmd.name} - ${cmd.description}`)
                .join('\n');

            return `**Comandos disponibles:**\n\n${commandList}\n\nTip: Escribe el comando para ver ejemplos de uso.`;
        },
        examples: ['/help']
    },

    clear: {
        name: '/clear',
        description: 'Limpia el historial del chat',
        category: 'general',
        handler: async () => {
            return 'CLEAR_HISTORY'; // Special flag
        },
        examples: ['/clear']
    },

    mood: {
        name: '/mood',
        description: 'Cambia mi mood (calmo, enfoque, agradecido)',
        category: 'general',
        handler: async (args) => {
            const validMoods = ['calmo', 'enfoque', 'agradecido'];
            const mood = args[0]?.toLowerCase();

            if (!validMoods.includes(mood)) {
                return `Por favor elige un mood: ${validMoods.join(', ')}`;
            }

            return `CHANGE_MOOD:${mood}`; // Special flag
        },
        examples: ['/mood calmo', '/mood enfoque']
    },

    // ========== NOVA POST PILOT ==========
    'suggest-topic': {
        name: '/suggest-topic',
        description: 'Sugiere topic para un post basado en tu actividad',
        category: 'nova-post',
        handler: async (args, context) => {
            // TODO: Integrar con Nova Post Pilot analytics
            return `📝 Basándome en tu actividad reciente, sugiero:

**Topic:** "Cómo la IA está transformando la creación de contenido"

**Por qué funciona:**
- Tu audiencia (productores/creadores) está interesada en IA
- #AIContent está trending (1.2M menciones)
- Conecta con tu expertise en música

¿Quieres que genere el post completo?`;
        },
        examples: ['/suggest-topic']
    },

    'analyze-post': {
        name: '/analyze-post',
        description: 'Analiza un post generado',
        category: 'nova-post',
        handler: async (args) => {
            const postId = args[0];
            if (!postId) {
                return 'Por favor especifica el ID del post: `/analyze-post [id]`';
            }

            return `📊 Analizando post ${postId}...

**Strengths:**
- Hook fuerte en primera línea ✓
- Hashtags relevantes ✓
- CTA claro ✓

**Oportunidades:**
- Acortar a 280 caracteres para mejor engagement
- Añadir emoji al inicio para más visibilidad
- Usar #TrendingTopic adicional

Engagement predicho: 850-1200 likes`;
        },
        examples: ['/analyze-post abc123']
    },

    trends: {
        name: '/trends',
        description: 'Muestra trending topics relevantes',
        category: 'nova-post',
        handler: async (args, context) => {
            // TODO: Integrar con TrendingService
            return `🔥 **Trending ahora:**

1. #AI - 2.5M menciones
2. #MusicProduction - 1.8M menciones
3. #TechInnovation - 1.2M menciones

Estos trends son relevantes para tu contenido habitual.`;
        },
        examples: ['/trends']
    },

    // ========== THE GENERATOR ==========
    'improve-prompt': {
        name: '/improve-prompt',
        description: 'Mejora tu prompt de generación musical',
        category: 'generator',
        handler: async (args) => {
            const prompt = args.join(' ');
            if (!prompt) {
                return 'Comparte tu prompt: `/improve-prompt [tu prompt]`';
            }

            return `✨ **Prompt mejorado:**

**Original:** "${prompt}"

**Optimizado:** "${prompt}, high energy, professional mixing, clear vocals, modern production"

**Cambios:**
- Añadí descriptores de calidad
- Especifiqué energía y mood
- Detalles de producción para mejor resultado

¿Generas con este prompt mejorado?`;
        },
        examples: ['/improve-prompt upbeat electronic dance']
    },

    generate: {
        name: '/generate',
        description: 'Genera música directamente con un prompt',
        category: 'generator',
        handler: async (args) => {
            const prompt = args.join(' ');
            if (!prompt) {
                return 'Por favor describe la música: `/generate [descripción]`';
            }
            return `GENERATE_MUSIC:${prompt}`; // Special flag handled by UI
        },
        examples: ['/generate epic orchestral soundtrack', '/generate lofi hip hop beat']
    },

    'analyze-generation': {
        name: '/analyze-generation',
        description: 'Explica el resultado de una generación',
        category: 'generator',
        handler: async () => {
            return `🎵 **Análisis de generación:**

**Calidad:** 8/10
**Coherencia:** 9/10
**Originalidad:** 7/10

**Elementos detectados:**
- Genre: Electronic Dance
- BPM: ~128
- Key: A minor
- Instrumentación: Sintetizadores, drums, bajo

**Sugerencias:**
- Regenerar con más especificidad en instrumentos
- Ajustar BPM si necesitas más/menos energía`;
        },
        examples: ['/analyze-generation']
    },

    // ========== GHOST STUDIO ==========
    'analyze-track': {
        name: '/analyze-track',
        description: 'Analiza la pista actual en el DAW',
        category: 'ghost-studio',
        handler: async () => {
            // TODO: Integrar con DAW state
            return `🎚️ **Análisis de pista:**

**Características:**
- BPM: 128
- Key: A minor
- Duración: 3:45
- Frecuencias dominantes: 200Hz (bajo), 8kHz (hi-hats)

**Sugerencias:**
1. HPF en 30Hz para eliminar subsonic rumble
2. Compresión en bajo (ratio 4:1)
3. Reverb en hi-hats para más espacio

¿Aplico alguno de estos ajustes?`;
        },
        examples: ['/analyze-track']
    },

    'suggest-fx': {
        name: '/suggest-fx',
        description: 'Sugiere efectos para mejorar tu mix',
        category: 'ghost-studio',
        handler: async () => {
            return `🎨 **Efectos sugeridos:**

**Para Bajo:**
- Spectral Shaper (HPF 30Hz, LPF 200Hz)
- Pressure Chamber (Ratio 4:1, -6dB threshold)

**Para Hi-Hats:**
- Nebula Space (Reverb med

ium, 1.2s decay)

**Para Vocal:**
- Plasma Drive (Light saturation, +3dB warmth)

¿Quieres que añada alguno?`;
        },
        examples: ['/suggest-fx']
    },

    // ========== CODE ANALYSIS ==========
    explain: {
        name: '/explain',
        description: 'Explica un error o concepto',
        category: 'code',
        handler: async (args) => {
            const error = args.join(' ');
            if (!error) {
                return 'Comparte el error: `/explain [error message]`';
            }

            return `🔍 **Explicación:**

Error: "${error}"

**Posible causa:**
Este error típicamente ocurre cuando...

**Solución:**
1. Verifica que...
2. Asegúrate de...
3. Considera...

¿Necesitas ver código de ejemplo?`;
        },
        examples: ['/explain Cannot read property of undefined']
    },

    review: {
        name: '/review',
        description: 'Code review de un archivo',
        category: 'code',
        handler: async (args) => {
            const file = args[0];
            if (!file) {
                return 'Especifica el archivo: `/review [file path]`';
            }

            return `📝 **Code Review de ${file}:**

**Positivo:**
- Código bien estructurado
- Nombres descriptivos
- Manejo de errores presente

**Mejoras sugeridas:**
1. Considerar memoización en componentes pesados
2. Extraer lógica compleja a custom hooks
3. Añadir PropTypes o TypeScript types

**Score:** 8/10`;
        },
        examples: ['/review components/MyComponent.tsx']
    },

    // ========== MEMORY ==========
    remember: {
        name: '/remember',
        description: 'Guardar una nota importante',
        category: 'memory',
        handler: async (args) => {
            const note = args.join(' ');
            if (!note) {
                return 'Comparte la nota: `/remember [tu nota]`';
            }

            return `SAVE_MEMORY:${note}`; // Special flag
        },
        examples: ['/remember El proyecto usa Qwen para IA local']
    },

    recall: {
        name: '/recall',
        description: 'Recordar conversaciones sobre un tema',
        category: 'memory',
        handler: async (args) => {
            const query = args.join(' ');
            if (!query) {
                return 'Busca por tema: `/recall [tema]`';
            }

            // TODO: Integrar con memory search
            return `🧠 **Recordando sobre "${query}":**

Encontré 3 conversaciones:
1. "Configuración de Qwen local" (hace 2 días)
2. "Mejoras en el DAW" (hace 1 semana)
3. "Nova Post Pilot analytics" (hace 3 días)

¿Quieres que profundice en alguna?`;
        },
        examples: ['/recall qwen setup']
    },

    preferences: {
        name: '/preferences',
        description: 'Ver/editar tus preferencias',
        category: 'memory',
        handler: async () => {
            return `⚙️ **Tus preferencias:**

- Mood por defecto: Calmo
- App favorita: Ghost Studio
- Estilo de código: Concise
- Nivel de ayuda: Intermediate

Para cambiar: usa los comandos específicos como \`/mood\``;
        },
        examples: ['/preferences']
    }
};

/**
 * Parse command from user input
 */
export function parseCommand(input: string): {
    isCommand: boolean;
    command?: string;
    args?: string[];
} {
    if (!input.trim().startsWith('/')) {
        return { isCommand: false };
    }

    const parts = input.trim().slice(1).split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    return {
        isCommand: true,
        command,
        args
    };
}

/**
 * Execute a command
 */
export async function executeCommand(
    commandName: string,
    args: string[],
    context: any = {}
): Promise<string> {
    const command = pixelCommands[commandName];

    if (!command) {
        return `Comando desconocido: /${commandName}\n\nUsa \`/help\` para ver comandos disponibles.`;
    }

    try {
        return await command.handler(args, context);
    } catch (error) {
        console.error('Command execution error:', error);
        return `Error ejecutando comando /${commandName}. Por favor intenta de nuevo.`;
    }
}

/**
 * Get command suggestions based on current app
 */
export function getSuggestedCommands(app: string): PixelCommand[] {
    const categoryMap: Record<string, string[]> = {
        'nova-post-pilot': ['nova-post', 'memory'],
        'the-generator': ['generator', 'memory'],
        'ghost-studio': ['ghost-studio', 'memory'],
        'nexus-visual': ['code', 'memory'],
        'web-classic': ['general', 'memory']
    };

    const relevantCategories = categoryMap[app] || ['general'];

    return Object.values(pixelCommands).filter(cmd =>
        relevantCategories.includes(cmd.category) || cmd.category === 'general'
    );
}
