// frontend/vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'frontend',
    globals: true,          // Allows using beforeEach, describe, it without importing them
    environment: 'jsdom',   // Simulates a browser environment for React Testing Library
  },
});