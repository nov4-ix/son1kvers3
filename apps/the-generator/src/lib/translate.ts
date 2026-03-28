/**
 * Translation utility for prompts
 * Translates Spanish prompts to English before sending to generation API
 */

export async function translateToEnglish(text: string): Promise<string> {
  // If text is already mostly English (simple heuristic), return as is
  if (isMostlyEnglish(text)) {
    return text;
  }

  try {
    // Try using a free translation API (Google Translate via proxy or similar)
    // For now, we'll use a simple approach with common musical terms
    
    // If we have a translation API key, use it
    const translationApiUrl = import.meta.env.VITE_TRANSLATION_API_URL;
    
    if (translationApiUrl) {
      const response = await fetch(translationApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: 'es',
          target: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText || text;
      }
    }

    // Fallback: Translate common musical terms and phrases
    return translateCommonTerms(text);
  } catch (error) {
    console.warn('Translation failed, using original text:', error);
    // If translation fails, try to translate at least common terms
    return translateCommonTerms(text);
  }
}

function isMostlyEnglish(text: string): boolean {
  // Simple heuristic: if text has mostly English words, assume it's English
  const englishWords = text.match(/\b(the|and|or|but|in|on|at|to|for|of|with|by|from|as|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|may|might|must|can|this|that|these|those|a|an)\b/gi);
  const spanishWords = text.match(/\b(el|la|los|las|de|del|en|con|por|para|que|es|son|está|están|ser|estar|tener|hacer|poder|deber|más|menos|muy|mucho|poco|todo|todos|toda|todas|un|una|unos|unas)\b/gi);
  
  const englishCount = englishWords?.length || 0;
  const spanishCount = spanishWords?.length || 0;
  
  return englishCount > spanishCount;
}

function translateCommonTerms(text: string): string {
  // Common Spanish to English translations for musical prompts
  const translations: Record<string, string> = {
    // Instruments
    'voz': 'voice',
    'guitarra': 'guitar',
    'guitarra acústica': 'acoustic guitar',
    'bajo': 'bass',
    'batería': 'drums',
    'teclado': 'keyboard',
    'piano': 'piano',
    'violín': 'violin',
    'viola': 'viola',
    'violonchelo': 'cello',
    'saxofón': 'saxophone',
    'trompeta': 'trumpet',
    'trombón': 'trombone',
    
    // Moods and emotions
    'triste': 'sad',
    'tristeza': 'sadness',
    'melancólico': 'melancholic',
    'melancolía': 'melancholy',
    'feliz': 'happy',
    'alegre': 'joyful',
    'alegría': 'joy',
    'energético': 'energetic',
    'energía': 'energy',
    'calmado': 'calm',
    'tranquilo': 'peaceful',
    'agresivo': 'aggressive',
    'romántico': 'romantic',
    'nostálgico': 'nostalgic',
    'oscuro': 'dark',
    'brillante': 'bright',
    'misterioso': 'mysterious',
    'euforico': 'euphoric',
    'euforia': 'euphoria',
    'extático': 'ecstatic',
    'profundamente triste': 'deeply sad',
    'sombrío': 'somber',
    'reflexivo': 'reflective',
    'sereno': 'serene',
    'equilibrado': 'balanced',
    'neutral': 'neutral',
    'esperanzado': 'hopeful',
    'optimista': 'optimistic',
    
    // Genres
    'pop': 'pop',
    'rock': 'rock',
    'jazz': 'jazz',
    'clásico': 'classical',
    'clásica': 'classical',
    'electrónico': 'electronic',
    'electrónica': 'electronic',
    'country': 'country',
    'blues': 'blues',
    'folk': 'folk',
    'reggae': 'reggae',
    'funk': 'funk',
    'soul': 'soul',
    'r&b': 'r&b',
    'hip-hop': 'hip-hop',
    'rap': 'rap',
    
    // Production terms
    'maqueta': 'demo',
    'mezcla': 'mix',
    'masterizar': 'master',
    'masterización': 'mastering',
    'reverb': 'reverb',
    'delay': 'delay',
    'saturación': 'saturation',
    'distorsión': 'distortion',
    'compresión': 'compression',
    'ecualización': 'equalization',
    'eq': 'eq',
    'pads': 'pads',
    'etéreo': 'ethereal',
    'etéreos': 'ethereal',
    'profundo': 'deep',
    'amplio': 'wide',
    'sutil': 'subtle',
    'moderado': 'moderate',
    'moderada': 'moderate',
    'extremo': 'extreme',
    'extrema': 'extreme',
    'vintage': 'vintage',
    'analógico': 'analog',
    'analógica': 'analog',
    'lo-fi': 'lo-fi',
    'cálido': 'warm',
    'cálida': 'warm',
    'experimental': 'experimental',
    'radical': 'radical',
    'tradicional': 'traditional',
    'creativo': 'creative',
    'creativa': 'creative',
    'variaciones': 'variations',
    'arreglo': 'arrangement',
    
    // Common phrases
    'añadir': 'add',
    'añade': 'add',
    'inspirado en': 'inspired by',
    'estilo': 'style',
    'tempo': 'tempo',
    'bpm': 'bpm',
    'escala': 'scale',
    'tonalidad': 'key',
    'instrumentos': 'instruments',
    'instrumentación': 'instrumentation',
    'drop': 'drop',
    'clímax': 'climax',
    'minuto': 'minute',
    'minutos': 'minutes',
    'segundo': 'second',
    'segundos': 'seconds',
  };

  let translated = text;
  
  // Replace common phrases (longer first to avoid partial matches)
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const spanish of sortedKeys) {
    const english = translations[spanish];
    // Case-insensitive replacement
    const regex = new RegExp(spanish, 'gi');
    translated = translated.replace(regex, english);
  }

  return translated;
}

