#!/bin/bash
set -e

echo "🚀 Building Nova Post Pilot (Isolated Mode)..."

# Cleanup
rm -rf temp_build_nova
mkdir -p temp_build_nova/packages

# Copy App
cp -r apps/nova-post-pilot temp_build_nova/app

# Copy Shared Packages
cp -r packages/shared-ui temp_build_nova/packages/
cp -r packages/shared-utils temp_build_nova/packages/
cp -r packages/shared-types temp_build_nova/packages/
cp -r packages/shared-hooks temp_build_nova/packages/
cp -r packages/shared-services temp_build_nova/packages/

# Adjust package.json in app to point to local packages
cd temp_build_nova/app
sed -i '' 's|file:../../packages/|file:../packages/|g' package.json

# Install dependencies (using npm to avoid pnpm workspace complexity)
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
npm rebuild esbuild


# Build
echo "🔨 Building..."
npm run build

# Move dist back
cd ../..
rm -rf apps/nova-post-pilot/dist
mv temp_build_nova/app/dist apps/nova-post-pilot/dist

# Cleanup
rm -rf temp_build_nova

echo "✅ Build complete! Dist is in apps/nova-post-pilot/dist"
