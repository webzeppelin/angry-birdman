module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],

    // Import rules
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/no-duplicates': 'error',

    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.json',
          './frontend/tsconfig.json',
          './api/tsconfig.json',
          './common/tsconfig.eslint.json',
          './database/tsconfig.json',
        ],
      },
    },
  },
  overrides: [
    // Frontend specific rules (React)
    {
      files: ['frontend/**/*.{ts,tsx}'],
      env: {
        browser: true,
      },
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
      ],
      plugins: ['react', 'react-hooks'],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/prop-types': 'off', // TypeScript handles this
        'react/react-in-jsx-scope': 'off', // Not needed with React 18
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
    // Backend/API specific rules
    {
      files: ['api/**/*.ts'],
      rules: {
        'no-console': 'off', // Allow console in backend
      },
    },
    // Route files have special considerations for Prisma operations
    {
      files: ['api/src/routes/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
    // Test files may have less strict type requirements
    {
      files: ['api/tests/**/*.ts', 'frontend/tests/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
    // Common library - use eslint-specific tsconfig that includes tests
    {
      files: ['common/**/*.ts'],
      parserOptions: {
        project: './common/tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*.ts', '**/tests/**/*.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // Database scripts (seed, validation, test scripts)
    {
      files: [
        'database/prisma/seed.ts',
        'database/test-*.ts',
        'database/validate-*.ts',
        'keycloak/test/**/*.js',
      ],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
    // Frontend main.tsx (app initialization can use console)
    {
      files: ['frontend/src/main.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', '*.config.cjs', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-default-export': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.turbo/',
    '*.min.js',
    'database/prisma/migrations/',
    '**/tailwind.config.js',
    '**/postcss.config.js',
    'keycloak/test/**/*.js', // External test scripts with different conventions
  ],
};
