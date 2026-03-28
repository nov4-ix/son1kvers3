import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@super-son1k/shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
      '@super-son1k/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src')
    }
  },
  server: {
    port: 3005,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
