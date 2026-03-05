import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src-next/src'),
      '@convex': path.resolve(__dirname, './convex'),
      '@registry': path.resolve(__dirname, './packages/registry/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src-next/src/vitest.setup.ts',
    include: [
      'src-next/src/**/*.{test,spec}.{ts,tsx}',
      'convex/__tests__/**/*.{test,spec}.ts',
    ],
  },
});
