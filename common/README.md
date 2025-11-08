# Common - Angry Birdman

Shared TypeScript library containing types, validation schemas, utilities, and
constants used by both frontend and backend.

## Purpose

This library provides:

- **Type Definitions** - Shared TypeScript types matching the Prisma schema
- **Validation Schemas** - Zod schemas for data validation
- **Utility Functions** - Calculation functions (ratio scores, etc.)
- **Constants** - Action codes, enums, and other constants

## Usage

Import from the common library in your workspace:

```typescript
// Import types
import type { Clan, RosterMember } from '@angrybirdman/common/types';

// Import validation schemas
import { clanSchema, battleSchema } from '@angrybirdman/common/schemas';

// Import utility functions
import {
  calculateRatioScore,
  generateBattleId,
} from '@angrybirdman/common/utils';

// Import constants
import { ACTION_CODES } from '@angrybirdman/common/constants';
```

## Development

### Build

Compile TypeScript to JavaScript:

```bash
npm run build --workspace=common
# or from this directory
npm run build
```

### Watch Mode

Compile on file changes:

```bash
npm run dev --workspace=common
# or from this directory
npm run dev
```

### Test

Run tests:

```bash
npm run test --workspace=common
# or from this directory
npm test
```

## Project Structure

```
common/
├── src/
│   ├── types/       # TypeScript type definitions
│   ├── schemas/     # Zod validation schemas
│   ├── utils/       # Utility functions and calculations
│   ├── constants/   # Constants and enums
│   └── index.ts     # Main entry point
└── tests/           # Test files
```

## Development Guidelines

- Keep types in sync with Prisma schema
- Write comprehensive tests for all calculation functions
- Follow Section 7 of high-level-spec.md for calculation formulas
- Export everything through appropriate index files
- Use TypeScript strict mode
