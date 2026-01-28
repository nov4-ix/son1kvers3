/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'nexus-dark': '#0a0a0f',
                'nexus-purple': '#8b5cf6',
                'nexus-cyan': '#06b6d4',
                'nexus-gold': '#fbbf24',
                'nexus-red': '#ef4444',
                'border': 'rgba(139, 92, 246, 0.3)',
                nexus: {
                    dark: '#0b0b0d', // Official --bg
                    ink: '#1b1b21',  // Official --ink
                    panel: '#10131a', // Official Quote BG
                    border: '#1d2330', // Official Header Border
                },
                neon: {
                    cyan: '#00bfff',   // Official --acc
                    pink: '#ff49c3',   // Official --pink
                    gold: '#ffcc00',   // Official --gold
                    red: '#ff4444',    // Official --red
                    green: '#44ff44',  // Official --green
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'],
            },
            animation: {
                'glitch': 'glitch 2s infinite',
                'glitch-1': 'glitch-1 0.5s infinite',
                'glitch-2': 'glitch-2 0.5s infinite',
                'matrix-fall': 'matrix-fall 3s linear infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'scan-line': 'scan-line 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                glitch: {
                    '0%, 100%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                },
                'glitch-1': {
                    '0%, 100%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(2px, -2px)' },
                    '40%': { transform: 'translate(-2px, 2px)' },
                    '60%': { transform: 'translate(-2px, -2px)' },
                    '80%': { transform: 'translate(2px, 2px)' },
                },
                'glitch-2': {
                    '0%, 100%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, -2px)' },
                    '40%': { transform: 'translate(2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(-2px, 2px)' },
                },
                'matrix-fall': {
                    '0%': { top: '-100%' },
                    '100%': { top: '100%' },
                },
                'pulse-glow': {
                    '0%, 100%': {
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                        opacity: 1,
                    },
                    '50%': {
                        boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)',
                        opacity: 0.8,
                    },
                },
                'scan-line': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
            },
            backgroundImage: {
                'grid-pattern': 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '50px 50px',
            },
        },
    },
    plugins: [],
}
