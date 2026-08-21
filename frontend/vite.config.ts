/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

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
<<<<<<< HEAD
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
=======
    // 👇 ADD THIS TEST BLOCK
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts', // Adjust this path if your setup file lives elsewhere
>>>>>>> Ted7
    },
  };
});
