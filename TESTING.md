# Testing Infrastructure

This document describes the testing setup for the Angry Birdman project.

## Overview

The project uses a comprehensive testing infrastructure across all workspaces
with:

- **Vitest**: Modern, fast test runner with TypeScript support
- **React Testing Library**: Component testing for React frontend
- **MSW (Mock Service Worker)**: API mocking for frontend tests
- **Isolated Test Database**: Separate database instance for API tests
- **Coverage Reporting**: v8 coverage with quality gates

## Running Tests

### Run Tests in All Workspaces

```bash
npm test
```

### Run Tests in Specific Workspace

```bash
npm test -w @angrybirdman/common
npm test -w @angrybirdman/api
npm test -w @angrybirdman/frontend
```

### Watch Mode (Auto-rerun on Changes)

```bash
npm run test:watch -w @angrybirdman/common
```

### Coverage Reports

```bash
npm run test:coverage -w @angrybirdman/common
npm run test:coverage -w @angrybirdman/api
npm run test:coverage -w @angrybirdman/frontend
```

Coverage reports are generated in each workspace's `coverage/` directory:

- **Text**: Console output
- **HTML**: `coverage/index.html` (open in browser)
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info` (for CI integration)

## Common Library Tests

**Location**: `common/tests/`

**Test Files**:

- `calculations.test.ts` - Battle calculation functions
- `date-formatting.test.ts` - Date ID formatting utilities
- `schemas.test.ts` - Zod validation schemas

**Coverage Thresholds**:

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

**Example Test**:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateRatio } from '@angrybirdman/common/utils';

describe('calculateRatio', () => {
  it('calculates correct ratio score', () => {
    expect(calculateRatio(50000, 40000)).toBe(12.5);
  });
});
```

## API Tests

**Location**: `api/tests/`

**Test Setup**:

- `setup.ts` - Database setup with automatic cleanup
- `utils/test-helpers.ts` - Test utilities and factories

**Coverage Thresholds**:

- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

**Database Testing**:

Tests use the main database with automatic cleanup between tests:

```typescript
beforeEach(async () => {
  // Database cleared automatically
});

afterAll(async () => {
  // Prisma disconnects automatically
});
```

**Test Helpers**:

```typescript
import { createTestApp, testData } from './utils/test-helpers';

// Create test app
const app = await createTestApp();

// Create test data
const clan = await testData.createClan({
  name: 'Test Clan',
  country: 'US',
});

const user = await testData.createUser({
  userId: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  clanId: clan.clanId,
});
```

**Example API Test**:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from './utils/test-helpers';

describe('Health Check', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('status', 'ok');
  });
});
```

## Frontend Tests

**Location**: `frontend/tests/`

**Test Setup**:

- `setup.ts` - React Testing Library and MSW setup
- `mocks/server.ts` - MSW server configuration
- `mocks/handlers.ts` - API request handlers
- `utils/test-utils.tsx` - Custom render functions

**Coverage Thresholds**:

- Lines: 70%
- Functions: 65%
- Branches: 60%
- Statements: 70%

**MSW (Mock Service Worker)**:

MSW intercepts HTTP requests during tests and returns mocked responses:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/clans', () => {
    return HttpResponse.json([{ clanId: 1, name: 'Test Clan', country: 'US' }]);
  }),
];
```

**Custom Render Functions**:

Use these instead of React Testing Library's `render()`:

```typescript
import { renderWithProviders } from './utils/test-utils';

// Includes QueryClient, Router, and AuthProvider
renderWithProviders(<MyComponent />);

// Just QueryClient (for simpler tests)
renderWithQuery(<MyComponent />);
```

**Example Component Test**:

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import { HomePage } from '@/pages/HomePage';

describe('HomePage', () => {
  it('renders welcome message', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: /welcome/i }))
      .toBeInTheDocument();
  });

  it('shows clan list', async () => {
    renderWithProviders(<HomePage />);

    // MSW will return mocked clan data
    const clanName = await screen.findByText('Test Clan');
    expect(clanName).toBeInTheDocument();
  });
});
```

**User Interactions**:

```typescript
import { screen, userEvent } from './utils/test-utils';

it('handles button click', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyForm />);

  const button = screen.getByRole('button', { name: /submit/i });
  await user.click(button);

  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

## Test Organization

### File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Setup files: `setup.ts`
- Helper utilities: `test-helpers.ts`, `test-utils.tsx`
- Mock data: `mocks/handlers.ts`, `mocks/server.ts`

### Test Structure

```typescript
describe('Feature/Component Name', () => {
  // Setup
  beforeAll(() => {
    // Runs once before all tests
  });

  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });

  afterAll(() => {
    // Runs once after all tests
  });

  // Tests grouped by functionality
  describe('specific functionality', () => {
    it('does something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## CI/CD Integration

Tests run automatically in CI/CD pipelines (when configured):

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` for setup
- Database cleaned automatically between tests
- MSW handlers reset between tests

### 2. Test Naming

- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Example: `it('should return 401 when user is not authenticated', ...)`

### 3. Assertions

- Use specific matchers when available
- Examples:
  - `toBeInTheDocument()` instead of `toBeTruthy()`
  - `toHaveValue('text')` instead of checking value property
  - `toBeDisabled()` instead of checking disabled attribute

### 4. Async Testing

- Always await async operations
- Use `findBy*` queries for elements that appear asynchronously
- Example: `await screen.findByText('Loaded data')`

### 5. Mock Data

- Keep test data minimal but realistic
- Use test helpers/factories for creating data
- Avoid hard-coded IDs (use relative references)

### 6. Coverage Goals

- Write tests that provide value, not just coverage
- Focus on critical paths and edge cases
- Use coverage reports to find untested code

## Troubleshooting

### Tests Timing Out

- Increase timeout in vitest.config.ts:
  ```typescript
  test: {
    testTimeout: 20000, // 20 seconds
  }
  ```

### Database Connection Errors

- Ensure Docker containers are running: `docker-compose up -d`
- Check DATABASE_URL environment variable
- Verify database migrations are applied

### React Testing Library Warnings

- "Not wrapped in act(...)": Usually safe to ignore in tests
- If problematic, wrap state updates in `await waitFor(() => {})`

### MSW Not Intercepting Requests

- Check that server.listen() is called in setup.ts
- Verify API_BASE_URL matches your test configuration
- Check handler patterns match the requests

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
