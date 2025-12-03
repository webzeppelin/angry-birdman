import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Vitest 4 simplified exclude - only add what's needed beyond defaults
    exclude: ['**/dist/**', '**/.{idea,cache,output,temp}/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Vitest 4: explicitly include source files for coverage
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx', // Entry point, not typically unit tested
        'src/vite-env.d.ts',
        'src/**/*.stories.{ts,tsx}',
      ],
      // Quality gates
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70,
      },
    },

    // Setup files for React Testing Library and MSW
    setupFiles: ['./tests/setup.ts'],

    // Test isolation and cleanup
    isolate: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Test timeout for async operations
    testTimeout: 10000,
    hookTimeout: 10000,

    // CSS handling
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@angrybirdman/common': resolve(__dirname, '../common/src'),
    },
  },
});
