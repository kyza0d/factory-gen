import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@convex': path.resolve(__dirname, './convex'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom', // Default environment for tests
    setupFiles: './src/vitest.setup.ts',
    // You might need to add `include` or `exclude` patterns if you have different test setups
    // For example, to separate frontend and Convex tests:
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'convex/__tests__/**/*.{test,spec}.ts'],
  },
});
