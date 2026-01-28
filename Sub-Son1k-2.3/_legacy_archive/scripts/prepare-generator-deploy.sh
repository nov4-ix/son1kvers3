#!/bin/bash
set -e

echo "🚀 Preparando The Generator NextJS para Vercel Deploy..."

cd apps/the-generator-nextjs

# 1. Copiar packages compartidos a node_modules local
echo "📦 Copiando paquetes compartidos..."
mkdir -p node_modules/@super-son1k

# Copiar cada package
for pkg in shared-hooks shared-ui shared-types shared-utils shared-services; do
  if [ -d "../../packages/$pkg" ]; then
    echo "   Copying $pkg..."
    rm -rf "node_modules/@super-son1k/$pkg"
    cp -r "../../packages/$pkg" "node_modules/@super-son1k/$pkg"
  fi
done

# 2. Guardar package.json original
cp package.json package.json.bak

# 3. Actualizar package.json para NO usar file: references
cat > package.json.tmp << 'EOF'
{
  "name": "the-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "TURBOPACK=0 next build",
    "start": "next start -p 3002",
    "migrate-tokens": "tsx scripts/migrate-tokens-to-pool.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-slot": "^1.2.3",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.76.1",
    "@types/jsonwebtoken": "^9.0.10",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.24",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.263.1",
    "next": "^16.0.0",
    "next-auth": "4.24.5",
    "ollama": "^0.6.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.65.0",
    "react-hot-toast": "^2.6.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^4.1.12",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@babel/preset-env": "^7.28.5",
    "@babel/preset-react": "^7.28.5",
    "@babel/preset-typescript": "^7.28.5",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^14.3.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "@types/node": "^20.19.23",
    "@types/react": "^18.3.26",
    "@types/react-dom": "^18.3.7",
    "autoprefixer": "^10",
    "babel-jest": "^30.2.0",
    "dotenv": "^16.4.5",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "postcss": "^8",
    "tailwindcss": "^3",
    "tsx": "^4.7.0",
    "typescript": "^5"
  }
}
EOF

mv package.json.tmp package.json

echo "✅ Preparación completada"
echo ""
echo "Ahora ejecuta: cd apps/the-generator-nextjs && vercel --prod"
