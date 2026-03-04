import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Default environment for tests
    setupFiles: './vitest.setup.ts',
    // You might need to add `include` or `exclude` patterns if you have different test setups
    // For example, to separate frontend and Convex tests:
    // include: ['**/*.{test,spec}.{ts,tsx}'],
    // exclude: ['convex/**/*.{test,spec}.ts'],
  },
});
