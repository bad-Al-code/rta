import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/config/setup.ts'],
    hookTimeout: 60000,
  },
});
