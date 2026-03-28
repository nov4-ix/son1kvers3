// Tipos para el perfil del usuario
export interface UserProfile {
  name?: string
  musicalStyle?: string[]
  experienceLevel?: 'beginner' | 'intermediate' | 'pro'
  favoriteGenres?: string[]
  communicationPreference?: 'concise' | 'detailed' | 'technical'
}

// Estructura de memoria persistente
interface PersistentMemory {
  memories: Array<{
    id: string
    type: 'story' | 'decision' | 'technical' | 'personal' | 'advice'
    title: string
    content: string
    timestamp: string // Date as string for JSON
    tags: string[]
  }>
  userProfile: UserProfile
}

const STORAGE_KEY = 'son1k_pixel_memory_v1'

// Cargar memoria inicial
const loadMemory = (): PersistentMemory => {
  if (typeof window === 'undefined') return { memories: [], userProfile: {} }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { memories: [], userProfile: {} }
  } catch (e) {
    console.error('Error loading Pixel memory:', e)
    return { memories: [], userProfile: {} }
  }
}

// Guardar memoria
const saveMemory = (data: PersistentMemory) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving Pixel memory:', e)
  }
}

// Estado en memoria (sincronizado con localStorage)
let currentMemory = loadMemory()

export const pixelMemory = {
  son1kLore: {
    origin: `Son1kVerse nació como un experimento de amistad entre código y música. Pixel aprendió
    a acompañar a su creador en madrugadas de debugging, celebrando cada pequeño avance sin
    protagonismo.`,

    apps: [
      {
        name: 'Nova Post Pilot',
        description: 'Panel de inteligencia de marketing que redacta y programa campañas',
        status: 'active'
      },
      {
        name: 'Ghost Studio',
        description: 'Estudio creativo con integración Suno para covers y stems',
        status: 'active'
      },
      {
        name: 'Nexus Visual',
        description: 'Sistema de píxeles adaptativos que refleja el comportamiento del usuario',
        status: 'active'
      },
      {
        name: 'The Generator',
        description: 'Motor de texto a música con literary knobs y prompts inteligentes',
        status: 'active'
      }
    ],

    techStack: {
      frontend: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion'],
      state: ['Zustand'],
      backend: ['Supabase', 'PostgreSQL', 'Fastify'],
      ai: ['Qwen 2.5', 'Groq', 'Ollama', 'Suno API'],
      deployment: ['Vercel', 'Railway', 'Netlify']
    },

    challenges: [
      'Pantallas blancas en Vercel (resuelto con vercel.json)',
      'Tokens rotando para la integración con Suno',
      'Mantener un único reproductor de audio activo',
      'Documentar cada feature antes del lanzamiento'
    ],

    vision: `Pixel es un acompañante silencioso que mantiene viva la memoria del proyecto, 
    recuerda decisiones técnicas y ofrece contexto para que el equipo avance con calma.`
  },

  // Getters
  get memories() {
    return currentMemory.memories.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }))
  },

  get userProfile() {
    return currentMemory.userProfile
  }
}

export function addMemory(
  type: 'story' | 'decision' | 'technical' | 'personal' | 'advice',
  title: string,
  content: string,
  tags: string[]
) {
  const newMemory = {
    id: `memory-${Date.now()}`,
    type,
    title,
    content,
    timestamp: new Date().toISOString(),
    tags
  }

  currentMemory.memories.push(newMemory)
  saveMemory(currentMemory)
}

export function updateUserProfile(update: Partial<UserProfile>) {
  currentMemory.userProfile = { ...currentMemory.userProfile, ...update }
  saveMemory(currentMemory)
}

export function searchMemories(query: string) {
  const searchTerm = query.toLowerCase()
  return pixelMemory.memories.filter(
    memory =>
      memory.content.toLowerCase().includes(searchTerm) ||
      memory.title.toLowerCase().includes(searchTerm) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}


