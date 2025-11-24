import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

    // Set environment variables for tests
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-for-authentication-min-32-chars-long',
      // Use separate test database to avoid wiping development data
      DATABASE_URL_TEST:
        process.env.DATABASE_URL_TEST ||
        'postgresql://angrybirdman:angrybirdman_dev_password@localhost:5432/angrybirdman_test?schema=public',
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/index.ts', // Entry point, tested via integration tests
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Quality gates
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },

    // Setup files for database and test utilities
    setupFiles: ['./tests/setup.ts'],

    // Test isolation and cleanup
    isolate: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Run test files sequentially to avoid database conflicts
    // since all tests share the same test database
    fileParallelism: false,

    // Test timeout for database operations
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@angrybirdman/common': resolve(__dirname, '../common/src'),
      '@angrybirdman/database': resolve(__dirname, '../database'),
    },
  },
});
