// Branding e identidad visual de Super-Son1k
export const BRANDING = {
  name: 'Super-Son1k',
  tagline: 'AI-Powered Music Creation Platform',
  colors: {
    primary: '#00bfff', // Cyan brillante
    secondary: '#ff49c3', // Magenta
    accent: '#44ff44', // Verde neón
    warning: '#ffff44', // Amarillo
    dark: '#0b0b0d', // Negro azulado
    darker: '#0f121a', // Gris oscuro
    light: '#e7e7ea', // Gris claro
    muted: '#b9b9c2' // Gris medio
  },
  gradients: {
    primary: 'linear-gradient(135deg, #00bfff 0%, #ff49c3 50%, #44ff44 100%)',
    header: 'linear-gradient(90deg, #00bfff 0%, #ff49c3 100%)',
    button: 'linear-gradient(135deg, #00bfff 0%, #ff49c3 50%, #44ff44 100%)',
    cyber: 'linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(255, 73, 195, 0.1) 100%)'
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace'
  }
} as const;