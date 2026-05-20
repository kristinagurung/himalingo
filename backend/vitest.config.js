import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.js'],
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      // This helps Vitest resolve your paths perfectly
      '@': path.resolve(__dirname, './'),
    },
  },
});