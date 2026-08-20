/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
    // 👇 ADD THIS TEST BLOCK
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts', // Adjust this path if your setup file lives elsewhere
    },
  };
});
