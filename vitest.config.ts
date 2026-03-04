import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Default environment for tests
    setupFiles: './src/vitest.setup.ts',
    // You might need to add `include` or `exclude` patterns if you have different test setups
    // For example, to separate frontend and Convex tests:
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'convex/__tests__/**/*.{test,spec}.ts'],
  },
});
