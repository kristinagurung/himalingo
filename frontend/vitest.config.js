// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // This lets you use 'describe' and 'it' without importing
    environment: 'jsdom',   // <--- THIS IS THE FIX
    setupFiles: './tests/setup.js', // (Optional but recommended)
  },
});