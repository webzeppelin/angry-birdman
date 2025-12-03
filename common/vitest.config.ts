import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Vitest 4 simplified exclude - only add what's needed beyond defaults
    exclude: ['**/dist/**', '**/.{idea,cache,output,temp}/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Vitest 4: explicitly include source files for coverage
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/index.ts', // Re-export file
      ],
      // Quality gates - higher standards for utility library
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Test isolation
    isolate: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
