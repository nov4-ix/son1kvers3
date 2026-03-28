/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Super-Son1k Branding Colors
        'brand': {
          primary: '#00bfff',    // Cyan brillante
          secondary: '#ff49c3',  // Magenta
          accent: '#44ff44',     // Verde neón
          warning: '#ffff44',    // Amarillo
          dark: '#0b0b0d',       // Negro azulado
          darker: '#0f121a',     // Gris oscuro
          light: '#e7e7ea',      // Gris claro
          muted: '#b9b9c2'       // Gris medio
        },
        // Aliases for common usage
        'carbón': '#1a1a1f',
        'carbón-dark': '#0f0f12',
        'carbón-light': '#252530',
        'cian': '#00bfff',
        'magenta': '#ff49c3',
        'verde': '#44ff44',
        'amarillo': '#ffff44',
      },
      fontFamily: {
        primary: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(0, 191, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 191, 255, 0.1) 1px, transparent 1px)",
        'brand-gradient': 'linear-gradient(135deg, #00bfff 0%, #ff49c3 50%, #44ff44 100%)',
        'header-gradient': 'linear-gradient(90deg, #00bfff 0%, #ff49c3 100%)',
        'button-gradient': 'linear-gradient(135deg, #00bfff 0%, #ff49c3 50%, #44ff44 100%)',
        'cyber-overlay': 'linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(255, 73, 195, 0.1) 100%)'
      },
      backgroundSize: {
        'cyber-grid': '50px 50px'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(0, 191, 255, 0.5)' },
          to: { boxShadow: '0 0 30px rgba(0, 191, 255, 0.8)' }
        }
      }
    },
  },
  plugins: [],
}