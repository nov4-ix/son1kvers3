#!/bin/bash

# Navegar al directorio del proyecto
cd /Users/nov4-ix/Desktop/Super-Son1k-2.0

# Instalar dependencias de desarrollo
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest @radix-ui/react-slot class-variance-authority clsx tailwind-merge

# Instalar dependencias de desarrollo adicionales
pnpm add -D @types/node @types/react @types/react-dom autoprefixer dotenv postcss tailwindcss typescript tsx

# Inicializar configuración de Jest
npx jest --init

# Instalar dependencias de Next.js para pruebas
pnpm add -D @testing-library/next @testing-library/react-hooks
