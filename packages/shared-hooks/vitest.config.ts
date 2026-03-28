import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@super-son1k/shared-types': path.resolve(__dirname, '../shared-types/src'),
      '@super-son1k/shared-services': path.resolve(__dirname, '../shared-services/src'),
    },
  },
});
