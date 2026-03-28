import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@super-son1k/shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
      '@super-son1k/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src'),
      '@super-son1k/shared-types': path.resolve(__dirname, '../../packages/shared-types/src')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
